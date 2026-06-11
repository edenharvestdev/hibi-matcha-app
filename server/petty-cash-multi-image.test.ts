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
  listReceiptImages,
  hasPermission as hasPermissionDb,
} from "./db";

// Helper to create context with hibiSession via JWT mock
function createHibiContext(role: string, staffId = 1, branchId = 1): TrpcContext {
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

describe("Petty Cash - Multi-Image & OCR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addExpense with multiple images", () => {
    const multiImageInput = {
      amount: 500,
      description: "ซื้อนม 10 กล่อง",
      receiptImages: [
        { data: "base64data1", type: "image/jpeg", fileName: "receipt1.jpg" },
        { data: "base64data2", type: "image/png", fileName: "receipt2.png" },
      ],
      transactionDate: new Date().toISOString().split("T")[0],
    };

    it("should accept multiple receipt images and save them", async () => {
      setupStaffMock("branch_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({ isActive: 1, alertThreshold: 1000, allowedRole: "branch_manager" });
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(5000);
      (createPettyCashTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(42);

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.addExpense(multiImageInput);

      expect(result.balanceAfter).toBe(4500);
      expect(result.id).toBe(42);
      // Should have created 2 receipt images
      expect(createReceiptImage).toHaveBeenCalledTimes(2);
      expect(createReceiptImage).toHaveBeenCalledWith(expect.objectContaining({
        transactionId: 42,
        sortOrder: 0,
      }));
      expect(createReceiptImage).toHaveBeenCalledWith(expect.objectContaining({
        transactionId: 42,
        sortOrder: 1,
      }));
    });

    it("should accept empty images for manual entry (no longer rejected)", async () => {
      setupStaffMock("branch_manager");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({ isActive: 1, alertThreshold: 1000, allowedRole: "branch_manager" });
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(5000);
      (createPettyCashTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(50);

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pettyCash.addExpense({
        amount: 500,
        description: "ซื้อนม",
        receiptImages: [],
        entryMethod: "manual",
        transactionDate: new Date().toISOString().split("T")[0],
      });
      expect(result.balanceAfter).toBe(4500);
      expect(result.id).toBe(50);
    });

    it("branch_staff should be FORBIDDEN from adding expenses", async () => {
      setupStaffMock("branch_staff");
      const ctx = createHibiContext("branch_staff");
      const caller = appRouter.createCaller(ctx);

      await expect(caller.pettyCash.addExpense(multiImageInput)).rejects.toThrow(
        "พนักงานสาขาไม่มีสิทธิ์ใช้ระบบบัญชี"
      );
    });

    it("should handle PDF file type in receipt images", async () => {
      setupStaffMock("branch_owner");
      const mockSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockSettings.mockResolvedValue({ isActive: 1, alertThreshold: 500 });
      const mockBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockBalance.mockResolvedValue(3000);
      (createPettyCashTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(99);

      const ctx = createHibiContext("branch_owner");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.addExpense({
        amount: 200,
        description: "ค่าน้ำ",
        receiptImages: [
          { data: "pdfbase64data", type: "application/pdf", fileName: "invoice.pdf" },
        ],
        transactionDate: new Date().toISOString().split("T")[0],
      });

      expect(result.id).toBe(99);
      expect(createReceiptImage).toHaveBeenCalledWith(expect.objectContaining({
        fileType: "application/pdf",
        fileName: "invoice.pdf",
      }));
    });
  });

  describe("ocrReceipt", () => {
    it("should extract data from receipt image using LLM", async () => {
      setupStaffMock("branch_manager");
      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pettyCash.ocrReceipt({
        imageData: "base64imagedata",
        imageType: "image/jpeg",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.amount).toBe(85);
      expect(result.data.description).toBe("น้ำคริสตัล 1 แพ็ค");
      expect(result.data.vendor).toBe("7-Eleven");
      expect(result.data.category).toBe("ingredients");
    });

    it("branch_staff should be FORBIDDEN from using OCR", async () => {
      setupStaffMock("branch_staff");
      const ctx = createHibiContext("branch_staff");
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.pettyCash.ocrReceipt({
          imageData: "base64imagedata",
          imageType: "image/jpeg",
        })
      ).rejects.toThrow("พนักงานสาขาไม่มีสิทธิ์ใช้ระบบบัญชี");
    });
  });

  describe("getReceiptImages", () => {
    it("should return receipt images for a transaction", async () => {
      setupStaffMock("branch_manager");
      const mockListImages = listReceiptImages as ReturnType<typeof vi.fn>;
      mockListImages.mockResolvedValue([
        { id: 1, transactionId: 42, imageUrl: "https://s3.example.com/img1.jpg", fileType: "image/jpeg", sortOrder: 0 },
        { id: 2, transactionId: 42, imageUrl: "https://s3.example.com/img2.png", fileType: "image/png", sortOrder: 1 },
      ]);

      const ctx = createHibiContext("branch_manager");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.pettyCash.getReceiptImages({ transactionId: 42 });

      expect(result).toHaveLength(2);
      expect(result[0].imageUrl).toBe("https://s3.example.com/img1.jpg");
      expect(result[1].imageUrl).toBe("https://s3.example.com/img2.png");
    });
  });
});
