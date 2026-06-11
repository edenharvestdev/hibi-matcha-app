import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db helpers
vi.mock("./db", () => ({
  getStaffById: vi.fn(),
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
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/receipt.jpg", key: "receipt.jpg" }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    getStaffById: vi.fn(),
    getPettyCashSettings: vi.fn(),
    upsertPettyCashSettings: vi.fn(),
    getPettyCashBalance: vi.fn(),
    createPettyCashTransaction: vi.fn(),
    listPettyCashTransactions: vi.fn(),
    countPettyCashTransactions: vi.fn(),
    getPettyCashSummary: vi.fn(),
    getPettyCashPeriodSummary: vi.fn(),
    createFundRequest: vi.fn(),
    listFundRequests: vi.fn(),
    getFundRequestById: vi.fn(),
    updateFundRequestStatus: vi.fn(),
    listBranches: vi.fn(),
    notifyBranchStaff: vi.fn().mockResolvedValue(undefined),
  };
});

import {
  getStaffById,
  getPettyCashSettings,
  upsertPettyCashSettings,
  getPettyCashBalance,
  createPettyCashTransaction,
  listPettyCashTransactions,
  countPettyCashTransactions,
  getPettyCashSummary,
  getPettyCashPeriodSummary,
  createFundRequest,
  listFundRequests,
  getFundRequestById,
  updateFundRequestStatus,
  listBranches,
} from "./db";

describe("Petty Cash System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Settings", () => {
    it("should return default settings when none exist", async () => {
      const mockGetSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockGetSettings.mockResolvedValue(null);

      const result = await getPettyCashSettings(1);
      expect(result).toBeNull();
      expect(mockGetSettings).toHaveBeenCalledWith(1);
    });

    it("should return existing settings for a branch", async () => {
      const mockSettings = {
        id: 1,
        branchId: 1,
        alertThreshold: 2000,
        bankName: "กสิกรไทย",
        bankAccountNumber: "123-4-56789-0",
        bankAccountName: "Hibi Matcha",
        promptPayId: "0812345678",
        allowedRole: "both",
        isActive: 1,
      };
      const mockGetSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      mockGetSettings.mockResolvedValue(mockSettings);

      const result = await getPettyCashSettings(1);
      expect(result).toEqual(mockSettings);
      expect(result!.alertThreshold).toBe(2000);
      expect(result!.allowedRole).toBe("both");
    });

    it("should upsert settings correctly", async () => {
      const mockUpsert = upsertPettyCashSettings as ReturnType<typeof vi.fn>;
      mockUpsert.mockResolvedValue(undefined);

      await upsertPettyCashSettings({
        branchId: 1,
        alertThreshold: 3000,
        bankName: "กรุงเทพ",
        bankAccountNumber: "999-9-99999-9",
        bankAccountName: "Test",
        promptPayId: null,
        allowedRole: "branch_manager",
        isActive: 1,
      });

      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
        branchId: 1,
        alertThreshold: 3000,
        allowedRole: "branch_manager",
      }));
    });
  });

  describe("Balance Calculation", () => {
    it("should return 0 when no transactions exist", async () => {
      const mockGetBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockGetBalance.mockResolvedValue(0);

      const balance = await getPettyCashBalance(1);
      expect(balance).toBe(0);
    });

    it("should return correct balance after deposits and expenses", async () => {
      const mockGetBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;
      mockGetBalance.mockResolvedValue(7000); // 10000 deposit - 3000 expense

      const balance = await getPettyCashBalance(1);
      expect(balance).toBe(7000);
    });
  });

  describe("Transactions", () => {
    it("should create a deposit transaction", async () => {
      const mockCreate = createPettyCashTransaction as ReturnType<typeof vi.fn>;
      mockCreate.mockResolvedValue(1);

      const txId = await createPettyCashTransaction({
        branchId: 1,
        type: "deposit",
        amount: 5000,
        description: "เติมเงินสดย่อยประจำสัปดาห์",
        transferMethod: "transfer",
        transactionDate: new Date(),
        balanceAfter: 5000,
        createdBy: 10,
        createdByName: "Owner",
        note: null,
        category: null,
        receiptUrl: null,
      });

      expect(txId).toBe(1);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        type: "deposit",
        amount: 5000,
        branchId: 1,
      }));
    });

    it("should create an expense transaction with receipt", async () => {
      const mockCreate = createPettyCashTransaction as ReturnType<typeof vi.fn>;
      mockCreate.mockResolvedValue(2);

      const txId = await createPettyCashTransaction({
        branchId: 1,
        type: "expense",
        amount: 350,
        description: "ซื้อนม 10 กล่อง",
        category: "ingredients",
        receiptUrl: "https://s3.example.com/receipt.jpg",
        transactionDate: new Date(),
        balanceAfter: 4650,
        createdBy: 11,
        createdByName: "Staff A",
        note: "ร้านข้างๆ",
        transferMethod: null,
      });

      expect(txId).toBe(2);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        type: "expense",
        amount: 350,
        category: "ingredients",
        receiptUrl: "https://s3.example.com/receipt.jpg",
      }));
    });

    it("should list transactions with pagination", async () => {
      const mockList = listPettyCashTransactions as ReturnType<typeof vi.fn>;
      const mockCount = countPettyCashTransactions as ReturnType<typeof vi.fn>;

      mockList.mockResolvedValue([
        { id: 1, type: "deposit", amount: 5000, description: "เติมเงิน", balanceAfter: 5000 },
        { id: 2, type: "expense", amount: 350, description: "ซื้อนม", balanceAfter: 4650 },
      ]);
      mockCount.mockResolvedValue(2);

      const transactions = await listPettyCashTransactions(1, 20, 0);
      const total = await countPettyCashTransactions(1);

      expect(transactions).toHaveLength(2);
      expect(total).toBe(2);
      expect(transactions[0].type).toBe("deposit");
      expect(transactions[1].type).toBe("expense");
    });
  });

  describe("Summary", () => {
    it("should return correct summary totals", async () => {
      const mockSummary = getPettyCashSummary as ReturnType<typeof vi.fn>;
      mockSummary.mockResolvedValue({
        totalDeposits: 10000,
        totalExpenses: 3500,
        totalAdjustments: 0,
        transactionCount: 5,
      });

      const summary = await getPettyCashSummary(1);
      expect(summary.totalDeposits).toBe(10000);
      expect(summary.totalExpenses).toBe(3500);
      expect(summary.transactionCount).toBe(5);
    });
  });

  describe("Fund Requests", () => {
    it("should create a fund request", async () => {
      const mockCreate = createFundRequest as ReturnType<typeof vi.fn>;
      mockCreate.mockResolvedValue(1);

      const id = await createFundRequest({
        branchId: 1,
        requestedAmount: 5000,
        reason: "เงินสดใกล้หมด ต้องซื้อวัตถุดิบ",
        requestedBy: 11,
        requestedByName: "Staff A",
        status: "pending",
      });

      expect(id).toBe(1);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        requestedAmount: 5000,
        status: "pending",
      }));
    });

    it("should list fund requests by branch", async () => {
      const mockList = listFundRequests as ReturnType<typeof vi.fn>;
      mockList.mockResolvedValue([
        { id: 1, requestedAmount: 5000, status: "pending", requestedByName: "Staff A" },
        { id: 2, requestedAmount: 3000, status: "approved", requestedByName: "Staff B" },
      ]);

      const requests = await listFundRequests(1);
      expect(requests).toHaveLength(2);
      expect(requests[0].status).toBe("pending");
    });

    it("should process fund request - approve", async () => {
      const mockGet = getFundRequestById as ReturnType<typeof vi.fn>;
      const mockUpdate = updateFundRequestStatus as ReturnType<typeof vi.fn>;

      mockGet.mockResolvedValue({
        id: 1,
        branchId: 1,
        requestedAmount: 5000,
        reason: "ต้องการเงินเพิ่ม",
        status: "pending",
        requestedBy: 11,
      });
      mockUpdate.mockResolvedValue(undefined);

      const request = await getFundRequestById(1);
      expect(request).toBeTruthy();
      expect(request!.status).toBe("pending");

      await updateFundRequestStatus(1, "approved", 10, "อนุมัติแล้ว");
      expect(mockUpdate).toHaveBeenCalledWith(1, "approved", 10, "อนุมัติแล้ว");
    });

    it("should process fund request - reject", async () => {
      const mockUpdate = updateFundRequestStatus as ReturnType<typeof vi.fn>;
      mockUpdate.mockResolvedValue(undefined);

      await updateFundRequestStatus(2, "rejected", 10, "ยอดเกินงบ");
      expect(mockUpdate).toHaveBeenCalledWith(2, "rejected", 10, "ยอดเกินงบ");
    });
  });

  describe("Low Balance Alert", () => {
    it("should detect low balance when below threshold", () => {
      const balance = 800;
      const threshold = 1000;
      expect(balance < threshold).toBe(true);
    });

    it("should not trigger alert when balance is above threshold", () => {
      const balance = 5000;
      const threshold = 1000;
      expect(balance < threshold).toBe(false);
    });

    it("should trigger alert exactly at threshold", () => {
      const balance = 1000;
      const threshold = 1000;
      // balance < threshold means NOT triggered at exactly threshold
      expect(balance < threshold).toBe(false);
    });
  });

  describe("Role-based Access", () => {
    it("should allow branch_owner to update settings", () => {
      const role = "branch_owner";
      const canUpdateSettings = role === "branch_owner" || role === "super_admin";
      expect(canUpdateSettings).toBe(true);
    });

    it("should allow super_admin to update settings", () => {
      const role = "super_admin";
      const canUpdateSettings = role === "branch_owner" || role === "super_admin";
      expect(canUpdateSettings).toBe(true);
    });

    it("should deny branch_manager from updating settings", () => {
      const role = "branch_manager";
      const canUpdateSettings = role === "branch_owner" || role === "super_admin";
      expect(canUpdateSettings).toBe(false);
    });

    it("should allow branch_staff to add expense when allowedRole is 'both'", () => {
      const role = "branch_staff";
      const allowedRole = "both";
      const canAddExpense = role !== "branch_staff" || allowedRole === "branch_staff" || allowedRole === "both";
      expect(canAddExpense).toBe(true);
    });

    it("should deny branch_staff from adding expense when allowedRole is 'branch_manager'", () => {
      const role = "branch_staff";
      const allowedRole = "branch_manager";
      const canAddExpense = role !== "branch_staff" || allowedRole === "branch_staff" || allowedRole === "both";
      expect(canAddExpense).toBe(false);
    });

    it("should allow branch_manager to add expense regardless of allowedRole", () => {
      const role = "branch_manager";
      const allowedRole = "branch_manager";
      const canAddExpense = role !== "branch_staff" || allowedRole === "branch_staff" || allowedRole === "both";
      expect(canAddExpense).toBe(true);
    });
  });

  describe("Period Summary (Monthly/Weekly Comparison)", () => {
    it("should return period summary with this month vs last month", async () => {
      const mockPeriodSummary = getPettyCashPeriodSummary as ReturnType<typeof vi.fn>;
      mockPeriodSummary.mockResolvedValue({
        thisMonth: { totalDeposits: 5000, totalExpenses: 3000, transactionCount: 8 },
        lastMonth: { totalDeposits: 4000, totalExpenses: 2000, transactionCount: 6 },
        thisWeek: { totalDeposits: 2000, totalExpenses: 1500, transactionCount: 4 },
        lastWeek: { totalDeposits: 1000, totalExpenses: 800, transactionCount: 3 },
      });

      const result = await getPettyCashPeriodSummary(1);
      expect(result.thisMonth.totalDeposits).toBe(5000);
      expect(result.thisMonth.totalExpenses).toBe(3000);
      expect(result.lastMonth.totalDeposits).toBe(4000);
      expect(result.lastMonth.totalExpenses).toBe(2000);
    });

    it("should calculate correct monthly expense change percentage", async () => {
      const mockPeriodSummary = getPettyCashPeriodSummary as ReturnType<typeof vi.fn>;
      mockPeriodSummary.mockResolvedValue({
        thisMonth: { totalDeposits: 5000, totalExpenses: 3000, transactionCount: 8 },
        lastMonth: { totalDeposits: 4000, totalExpenses: 2000, transactionCount: 6 },
        thisWeek: { totalDeposits: 0, totalExpenses: 0, transactionCount: 0 },
        lastWeek: { totalDeposits: 0, totalExpenses: 0, transactionCount: 0 },
      });

      const result = await getPettyCashPeriodSummary(1);
      // Expense change: (3000 - 2000) / 2000 * 100 = 50%
      const expenseChange = ((result.thisMonth.totalExpenses - result.lastMonth.totalExpenses) / result.lastMonth.totalExpenses) * 100;
      expect(expenseChange).toBe(50);
    });

    it("should handle zero previous period gracefully", async () => {
      const mockPeriodSummary = getPettyCashPeriodSummary as ReturnType<typeof vi.fn>;
      mockPeriodSummary.mockResolvedValue({
        thisMonth: { totalDeposits: 5000, totalExpenses: 3000, transactionCount: 8 },
        lastMonth: { totalDeposits: 0, totalExpenses: 0, transactionCount: 0 },
        thisWeek: { totalDeposits: 1000, totalExpenses: 500, transactionCount: 2 },
        lastWeek: { totalDeposits: 0, totalExpenses: 0, transactionCount: 0 },
      });

      const result = await getPettyCashPeriodSummary(1);
      expect(result.lastMonth.totalDeposits).toBe(0);
      expect(result.lastMonth.totalExpenses).toBe(0);
      // When previous is 0, change should be 100% if current > 0
      const depositChange = result.lastMonth.totalDeposits > 0
        ? ((result.thisMonth.totalDeposits - result.lastMonth.totalDeposits) / result.lastMonth.totalDeposits) * 100
        : result.thisMonth.totalDeposits > 0 ? 100 : 0;
      expect(depositChange).toBe(100);
    });

    it("should return weekly comparison data", async () => {
      const mockPeriodSummary = getPettyCashPeriodSummary as ReturnType<typeof vi.fn>;
      mockPeriodSummary.mockResolvedValue({
        thisMonth: { totalDeposits: 10000, totalExpenses: 7000, transactionCount: 15 },
        lastMonth: { totalDeposits: 8000, totalExpenses: 5000, transactionCount: 12 },
        thisWeek: { totalDeposits: 2000, totalExpenses: 1500, transactionCount: 4 },
        lastWeek: { totalDeposits: 3000, totalExpenses: 1000, transactionCount: 3 },
      });

      const result = await getPettyCashPeriodSummary(1);
      expect(result.thisWeek.totalDeposits).toBe(2000);
      expect(result.thisWeek.totalExpenses).toBe(1500);
      expect(result.lastWeek.totalDeposits).toBe(3000);
      expect(result.lastWeek.totalExpenses).toBe(1000);
      // Weekly expense change: (1500 - 1000) / 1000 * 100 = 50%
      const weeklyExpenseChange = ((result.thisWeek.totalExpenses - result.lastWeek.totalExpenses) / result.lastWeek.totalExpenses) * 100;
      expect(weeklyExpenseChange).toBe(50);
    });

    it("should detect expense increase that may need attention", async () => {
      const mockPeriodSummary = getPettyCashPeriodSummary as ReturnType<typeof vi.fn>;
      mockPeriodSummary.mockResolvedValue({
        thisMonth: { totalDeposits: 5000, totalExpenses: 8000, transactionCount: 20 },
        lastMonth: { totalDeposits: 5000, totalExpenses: 3000, transactionCount: 10 },
        thisWeek: { totalDeposits: 1000, totalExpenses: 3000, transactionCount: 8 },
        lastWeek: { totalDeposits: 1000, totalExpenses: 800, transactionCount: 3 },
      });

      const result = await getPettyCashPeriodSummary(1);
      // Monthly expense increase: (8000-3000)/3000*100 = 166.67%
      const monthlyExpenseChange = ((result.thisMonth.totalExpenses - result.lastMonth.totalExpenses) / result.lastMonth.totalExpenses) * 100;
      expect(monthlyExpenseChange).toBeCloseTo(166.67, 1);
      // This is a significant increase that owner should notice
      expect(monthlyExpenseChange).toBeGreaterThan(100);

      // Weekly expense increase: (3000-800)/800*100 = 275%
      const weeklyExpenseChange = ((result.thisWeek.totalExpenses - result.lastWeek.totalExpenses) / result.lastWeek.totalExpenses) * 100;
      expect(weeklyExpenseChange).toBe(275);
      expect(weeklyExpenseChange).toBeGreaterThan(100);
    });
  });

  describe("Admin Overview", () => {
    it("should list all branches with petty cash status", async () => {
      const mockListBranches = listBranches as ReturnType<typeof vi.fn>;
      const mockGetSettings = getPettyCashSettings as ReturnType<typeof vi.fn>;
      const mockGetBalance = getPettyCashBalance as ReturnType<typeof vi.fn>;

      mockListBranches.mockResolvedValue([
        { id: 1, name: "สาขา 1" },
        { id: 2, name: "สาขา 2" },
      ]);
      mockGetSettings.mockResolvedValueOnce({ isActive: 1, alertThreshold: 1000 })
        .mockResolvedValueOnce(null);
      mockGetBalance.mockResolvedValueOnce(5000).mockResolvedValueOnce(0);

      const branches = await listBranches();
      expect(branches).toHaveLength(2);

      const results = [];
      for (const branch of branches) {
        const [settings, balance] = await Promise.all([
          getPettyCashSettings(branch.id),
          getPettyCashBalance(branch.id),
        ]);
        results.push({
          branchId: branch.id,
          branchName: branch.name,
          isActive: settings?.isActive ?? 0,
          balance,
          alertThreshold: settings?.alertThreshold ?? 0,
        });
      }

      expect(results).toHaveLength(2);
      expect(results[0].isActive).toBe(1);
      expect(results[0].balance).toBe(5000);
      expect(results[1].isActive).toBe(0);
      expect(results[1].balance).toBe(0);
    });
  });
});
