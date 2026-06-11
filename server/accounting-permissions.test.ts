import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock jose to control JWT verification and return our test session
let mockJwtPayload: any = null;
vi.mock("jose", () => ({
  jwtVerify: vi.fn().mockImplementation(async () => {
    if (mockJwtPayload) return { payload: mockJwtPayload };
    throw new Error("invalid token");
  }),
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock_token"),
  })),
}));

// Mock all db helpers
vi.mock("./db", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    getStaffById: vi.fn(),
    getStaffBranches: vi.fn(),
    getPettyCashSettings: vi.fn(),
    upsertPettyCashSettings: vi.fn(),
    getPettyCashBalance: vi.fn(),
    createPettyCashTransaction: vi.fn(),
    listPettyCashTransactions: vi.fn(),
    countPettyCashTransactions: vi.fn(),
    getPettyCashSummary: vi.fn(),
    createFundRequest: vi.fn(),
    listFundRequests: vi.fn(),
    getFundRequestById: vi.fn(),
    updateFundRequestStatus: vi.fn(),
    listBranches: vi.fn(),
    notifyBranchStaff: vi.fn().mockResolvedValue(undefined),
    hasPermission: vi.fn(),
    createReceiptImage: vi.fn().mockResolvedValue(1),
    listReceiptImages: vi.fn().mockResolvedValue([]),
    getDailySalesRecordByDate: vi.fn(),
    createDailySalesRecord: vi.fn(),
    updateDailySalesRecord: vi.fn(),
    deleteExtraChannelsBySalesRecordId: vi.fn(),
    createDailySalesExtraChannels: vi.fn(),
    listDailySalesRecords: vi.fn(),
    countDailySalesRecords: vi.fn(),
    getMonthlySalesSummary: vi.fn(),
    getDailySalesRecordById: vi.fn(),
    getAllBranchesMonthlySummary: vi.fn(),
    getExtraChannelsBySalesRecordId: vi.fn(),
  };
});
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/receipt.jpg", key: "receipt.jpg" }),
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  getStaffById,
  getStaffBranches,
  getPettyCashSettings,
  getPettyCashBalance,
  hasPermission as hasPermissionDb,
} from "./db";

// Helper to create context with hibiSession via JWT mock
function createHibiContext(role: string, staffId = 1, branchId = 1): TrpcContext {
  // Set the JWT payload that jose.jwtVerify will return
  mockJwtPayload = { type: "staff", id: staffId, role };
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie: `hibi_session=mock_token`,
      },
    } as any,
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as any,
  };
}

function setupStaffMock(role: string, staffId = 1, branchId = 1) {
  const mockGetStaffById = getStaffById as ReturnType<typeof vi.fn>;
  mockGetStaffById.mockResolvedValue({
    id: staffId,
    name: "Test Staff",
    phone: "0812345678",
    role,
    branchId,
    isActive: 1,
    permissions: role === "branch_manager" ? "manage_accounting" : "",
  });

  const mockGetStaffBranches = getStaffBranches as ReturnType<typeof vi.fn>;
  mockGetStaffBranches.mockResolvedValue([{ branchId: 1 }, { branchId: 2 }]);

  const mockHasPermission = hasPermissionDb as ReturnType<typeof vi.fn>;
  if (role === "branch_manager" || role === "branch_owner") {
    mockHasPermission.mockResolvedValue(true);
  } else {
    mockHasPermission.mockResolvedValue(false);
  }
}

describe("Accounting Permissions - Petty Cash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBalance", () => {
    it("branch_staff should be able to VIEW petty cash balance (read-only)", async () => {
      setupStaffMock("branch_staff");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({ isActive: 1, alertThreshold: 1000, allowedRole: "branch_manager" });
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(3000);

      const ctx = createHibiContext("branch_staff");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.getBalance({});
      expect(result).toBeDefined();
    });

    it("branch_manager should be able to access petty cash balance", async () => {
      setupStaffMock("branch_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({ isActive: 1, alertThreshold: 1000, allowedRole: "branch_manager" });
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(5000);

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.getBalance({});

      expect(result.balance).toBe(5000);
    });

    it("branch_owner should access balance even if system not activated", async () => {
      setupStaffMock("branch_owner");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue(null); // No settings = not activated
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(0);

      const ctx = createHibiContext("branch_owner");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.getBalance({});

      expect(result.balance).toBe(0);
      expect(result.alertThreshold).toBe(1000);
    });

    it("area_manager should access balance even if system not activated", async () => {
      setupStaffMock("area_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue(null);
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(0);

      const ctx = createHibiContext("area_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.getBalance({ branchId: 1 });

      expect(result.balance).toBe(0);
    });

    it("branch_manager should be BLOCKED if system not activated", async () => {
      setupStaffMock("branch_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue(null);

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.pettyCash.getBalance({})).rejects.toThrow(
        "ระบบเบิกจ่ายเงินสดยังไม่เปิดใช้งาน"
      );
    });
  });

  describe("addExpense", () => {
    const expenseInput = {
      amount: 500,
      description: "ซื้อนม",
      receiptImages: [{ data: "base64data", type: "image/jpeg", fileName: "receipt.jpg" }],
      transactionDate: new Date().toISOString().split("T")[0],
    };

    it("branch_staff should be FORBIDDEN from adding expenses", async () => {
      setupStaffMock("branch_staff");
      const ctx = createHibiContext("branch_staff");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.pettyCash.addExpense(expenseInput)).rejects.toThrow(
        "พนักงานสาขาไม่มีสิทธิ์ใช้ระบบบัญชี"
      );
    });

    it("branch_manager should be able to add expenses", async () => {
      setupStaffMock("branch_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({ isActive: 1, alertThreshold: 1000, allowedRole: "branch_manager" });
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(5000);
      const { createPettyCashTransaction } = await import("./db");
      (createPettyCashTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.addExpense(expenseInput);

      expect(result.balanceAfter).toBe(4500);
    });
  });

  describe("requestFund", () => {
    it("branch_staff should be FORBIDDEN from requesting funds", async () => {
      setupStaffMock("branch_staff");
      const ctx = createHibiContext("branch_staff");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.pettyCash.requestFund({ requestedAmount: 1000, reason: "ต้องการเงิน" })
      ).rejects.toThrow("พนักงานสาขาไม่มีสิทธิ์ใช้ระบบบัญชี");
    });
  });

  describe("getSettings", () => {
    it("branch_owner should get isActive=1 even if no settings exist", async () => {
      setupStaffMock("branch_owner");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue(null);

      const ctx = createHibiContext("branch_owner");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.getSettings({});

      expect(result.isActive).toBe(1);
    });

    it("area_manager should get isActive=1 even if settings have isActive=0", async () => {
      setupStaffMock("area_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({
        branchId: 1,
        isActive: 0,
        alertThreshold: 1000,
        allowedRole: "branch_manager",
      });

      const ctx = createHibiContext("area_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.getSettings({ branchId: 1 });

      expect(result.isActive).toBe(1);
    });

    it("branch_manager should get isActive=0 if settings have isActive=0", async () => {
      setupStaffMock("branch_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({
        branchId: 1,
        isActive: 0,
        alertThreshold: 1000,
        allowedRole: "branch_manager",
      });

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.getSettings({});

      expect(result.isActive).toBe(0);
    });
  });
});

describe("Accounting Permissions - Daily Sales", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requirePermission(manage_accounting)", () => {
    it("branch_owner should access daily sales", async () => {
      setupStaffMock("branch_owner");
      const { getDailySalesRecordByDate } = await import("./db");
      (getDailySalesRecordByDate as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createHibiContext("branch_owner");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.dailySales.getByDate({
        salesDate: new Date().toISOString().split("T")[0],
      });

      expect(result).toBeNull();
    });

    it("area_manager should access daily sales with branchId", async () => {
      setupStaffMock("area_manager");
      const { getDailySalesRecordByDate } = await import("./db");
      (getDailySalesRecordByDate as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const ctx = createHibiContext("area_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.dailySales.getByDate({
        salesDate: new Date().toISOString().split("T")[0],
        branchId: 1,
      });

      expect(result).toBeNull();
    });

    it("branch_staff without manage_accounting permission can VIEW daily sales (read-only)", async () => {
      setupStaffMock("branch_staff");
      const ctx = createHibiContext("branch_staff");
      const caller = appRouter.createCaller(ctx);

      // branch_staff can now view daily sales (read-only access)
      const result = await caller.dailySales.getByDate({
        salesDate: new Date().toISOString().split("T")[0],
      });
      // Should not throw - returns null or record
      expect(result === null || typeof result === "object").toBe(true);
    });
  });
});
