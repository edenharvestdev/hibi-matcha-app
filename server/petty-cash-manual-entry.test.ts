import { describe, expect, it, vi, beforeEach } from "vitest";

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
    listReceiptImagesByBranch: vi.fn().mockResolvedValue([]),
    updateReceiptImageOcr: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/receipt.jpg", key: "receipt.jpg" }),
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          amount: 85,
          description: "น้ำคริสตัล 1 แพ็ค",
          vendor: "7-Eleven",
          date: "2026-05-15",
          items: [{ name: "น้ำคริสตัล", qty: 1, price: 85 }],
          rawText: "7-Eleven น้ำคริสตัล 1 แพ็ค 85 บาท",
          category: "ingredients",
        }),
      },
    }],
  }),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  getStaffById,
  getStaffBranches,
  getPettyCashSettings,
  getPettyCashBalance,
  createPettyCashTransaction,
  createReceiptImage,
  hasPermission as hasPermissionDb,
} from "./db";

// Helper to create context with hibiSession via JWT mock
function createHibiContext(role: string, staffId = 1): TrpcContext {
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

describe("Petty Cash - Manual Entry (no receipt)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addExpense with empty receiptImages (manual entry)", () => {
    const manualInput = {
      amount: 150,
      description: "ค่าแท็กซี่ไปซื้อของ",
      category: "transport",
      receiptImages: [],
      entryMethod: "manual" as const,
      note: "ไม่มีใบเสร็จ",
      transactionDate: new Date().toISOString().split("T")[0],
    };

    it("should accept expense with empty receiptImages and entryMethod=manual", async () => {
      setupStaffMock("branch_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({ isActive: 1, alertThreshold: 1000, allowedRole: "branch_manager" });
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(5000);
      (createPettyCashTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(99);

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.addExpense(manualInput);

      expect(result.balanceAfter).toBe(4850);
      expect(result.id).toBe(99);
      // Should NOT create any receipt images
      expect(createReceiptImage).not.toHaveBeenCalled();
      // Should pass entryMethod to createPettyCashTransaction
      expect(createPettyCashTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 150,
          description: "ค่าแท็กซี่ไปซื้อของ",
          category: "transport",
          entryMethod: "manual",
          receiptUrl: null,
          note: "ไม่มีใบเสร็จ",
        })
      );
    });

    it("should accept expense with entryMethod=ocr when receipts are provided", async () => {
      setupStaffMock("branch_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({ isActive: 1, alertThreshold: 1000, allowedRole: "branch_manager" });
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(5000);
      (createPettyCashTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(100);

      const ocrInput = {
        amount: 85,
        description: "น้ำดื่ม",
        receiptImages: [
          { data: "base64imagedata", type: "image/jpeg", fileName: "slip.jpg" },
        ],
        entryMethod: "ocr" as const,
        transactionDate: new Date().toISOString().split("T")[0],
      };

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.addExpense(ocrInput);

      expect(result.balanceAfter).toBe(4915);
      expect(result.id).toBe(100);
      // Should create receipt image
      expect(createReceiptImage).toHaveBeenCalledTimes(1);
      // Should pass entryMethod=ocr
      expect(createPettyCashTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          entryMethod: "ocr",
        })
      );
    });

    it("should default entryMethod to null when not provided", async () => {
      setupStaffMock("branch_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({ isActive: 1, alertThreshold: 1000, allowedRole: "branch_manager" });
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(5000);
      (createPettyCashTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(101);

      const noMethodInput = {
        amount: 200,
        description: "ค่าน้ำแข็ง",
        receiptImages: [],
        transactionDate: new Date().toISOString().split("T")[0],
      };

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.addExpense(noMethodInput);

      expect(result.balanceAfter).toBe(4800);
      // entryMethod should be null when not provided
      expect(createPettyCashTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          entryMethod: null,
        })
      );
    });
  });
});
