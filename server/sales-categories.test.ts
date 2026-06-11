import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db helpers
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    listSalesCategories: vi.fn(),
    createSalesCategory: vi.fn(),
    updateSalesCategory: vi.fn(),
    deleteSalesCategory: vi.fn(),
    upsertDailySales: vi.fn(),
    getDailySalesByDate: vi.fn(),
    getDailySalesById: vi.fn(),
    listDailySales: vi.fn(),
    getMonthlySummary: vi.fn(),
    upsertDailySalesItems: vi.fn(),
    getDailySalesItemsByRecordId: vi.fn(),
    getMonthlyCategoryBreakdown: vi.fn(),
    getMonthlyCommission: vi.fn(),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.jpg", key: "file.jpg" }),
}));

import {
  listSalesCategories,
  createSalesCategory,
  updateSalesCategory,
  deleteSalesCategory,
  upsertDailySales,
  getDailySalesByDate,
  getDailySalesById,
  listDailySales,
  getMonthlySummary,
  upsertDailySalesItems,
  getDailySalesItemsByRecordId,
  getMonthlyCategoryBreakdown,
  getMonthlyCommission,
} from "./db";

describe("Sales Categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listSalesCategories", () => {
    it("should return categories for a specific branch", async () => {
      const mockCategories = [
        { id: 1, name: "หน้าร้าน", commissionRate: "5.00", branchId: 1, sortOrder: 0 },
        { id: 2, name: "สินค้ากลับบ้าน", commissionRate: "3.00", branchId: 1, sortOrder: 1 },
      ];
      (listSalesCategories as any).mockResolvedValue(mockCategories);

      const result = await listSalesCategories(1);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("หน้าร้าน");
      expect(result[1].name).toBe("สินค้ากลับบ้าน");
    });

    it("should return global categories when branchId is null", async () => {
      const mockCategories = [
        { id: 3, name: "Delivery", commissionRate: "2.00", branchId: null, sortOrder: 0 },
      ];
      (listSalesCategories as any).mockResolvedValue(mockCategories);

      const result = await listSalesCategories(null);
      expect(result).toHaveLength(1);
      expect(result[0].branchId).toBeNull();
    });

    it("should return empty array when no categories exist", async () => {
      (listSalesCategories as any).mockResolvedValue([]);
      const result = await listSalesCategories(1);
      expect(result).toEqual([]);
    });
  });

  describe("createSalesCategory", () => {
    it("should create a new category with commission rate", async () => {
      const newCat = { id: 4, name: "หน้าร้าน", commissionRate: "5.00", branchId: 1, sortOrder: 0 };
      (createSalesCategory as any).mockResolvedValue(newCat);

      const result = await createSalesCategory({ name: "หน้าร้าน", commissionRate: 5.0, branchId: 1 });
      expect(result.name).toBe("หน้าร้าน");
      expect(result.commissionRate).toBe("5.00");
    });

    it("should create a global category (branchId null)", async () => {
      const newCat = { id: 5, name: "Delivery", commissionRate: "2.00", branchId: null, sortOrder: 0 };
      (createSalesCategory as any).mockResolvedValue(newCat);

      const result = await createSalesCategory({ name: "Delivery", commissionRate: 2.0, branchId: null });
      expect(result.branchId).toBeNull();
    });
  });

  describe("deleteSalesCategory", () => {
    it("should delete a category", async () => {
      (deleteSalesCategory as any).mockResolvedValue(true);
      const result = await deleteSalesCategory(1);
      expect(result).toBe(true);
    });
  });
});

describe("Daily Sales Items (Category Breakdown)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("upsertDailySalesItems", () => {
    it("should save category items for a daily sales record", async () => {
      (upsertDailySalesItems as any).mockResolvedValue(true);

      const items = [
        { categoryId: 1, amount: 5000, note: "ยอดหน้าร้าน" },
        { categoryId: 2, amount: 3000, note: "ยอดสินค้ากลับบ้าน" },
      ];
      const result = await upsertDailySalesItems(100, items);
      expect(result).toBe(true);
      expect(upsertDailySalesItems).toHaveBeenCalledWith(100, items);
    });

    it("should handle empty category items", async () => {
      (upsertDailySalesItems as any).mockResolvedValue(true);
      const result = await upsertDailySalesItems(100, []);
      expect(result).toBe(true);
    });
  });

  describe("getDailySalesItemsByRecordId", () => {
    it("should return category items for a record", async () => {
      const mockItems = [
        { id: 1, dailySalesId: 100, categoryId: 1, amount: "5000.00", note: "ยอดหน้าร้าน" },
        { id: 2, dailySalesId: 100, categoryId: 2, amount: "3000.00", note: null },
      ];
      (getDailySalesItemsByRecordId as any).mockResolvedValue(mockItems);

      const result = await getDailySalesItemsByRecordId(100);
      expect(result).toHaveLength(2);
      expect(result[0].amount).toBe("5000.00");
    });

    it("should return empty array when no items exist", async () => {
      (getDailySalesItemsByRecordId as any).mockResolvedValue([]);
      const result = await getDailySalesItemsByRecordId(999);
      expect(result).toEqual([]);
    });
  });
});

describe("Monthly Category Breakdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return category breakdown for a month", async () => {
    const mockBreakdown = [
      { categoryId: 1, categoryName: "หน้าร้าน", totalAmount: "150000.00" },
      { categoryId: 2, categoryName: "สินค้ากลับบ้าน", totalAmount: "90000.00" },
      { categoryId: 3, categoryName: "Delivery", totalAmount: "60000.00" },
    ];
    (getMonthlyCategoryBreakdown as any).mockResolvedValue(mockBreakdown);

    const result = await getMonthlyCategoryBreakdown(2026, 4, 1);
    expect(result).toHaveLength(3);
    expect(result[0].categoryName).toBe("หน้าร้าน");
    expect(result[0].totalAmount).toBe("150000.00");
  });

  it("should return empty array when no data", async () => {
    (getMonthlyCategoryBreakdown as any).mockResolvedValue([]);
    const result = await getMonthlyCategoryBreakdown(2026, 1, 1);
    expect(result).toEqual([]);
  });
});

describe("Commission Calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate commission based on category rates", async () => {
    const mockCommission = [
      { categoryId: 1, categoryName: "หน้าร้าน", commissionRate: "5.00", totalSales: "150000.00", commission: "7500.00" },
      { categoryId: 2, categoryName: "สินค้ากลับบ้าน", commissionRate: "3.00", totalSales: "90000.00", commission: "2700.00" },
    ];
    (getMonthlyCommission as any).mockResolvedValue(mockCommission);

    const result = await getMonthlyCommission(2026, 4, 1);
    expect(result).toHaveLength(2);
    expect(result[0].commission).toBe("7500.00");
    expect(result[1].commission).toBe("2700.00");
  });

  it("should return empty when no categories have commission", async () => {
    (getMonthlyCommission as any).mockResolvedValue([]);
    const result = await getMonthlyCommission(2026, 4, 1);
    expect(result).toEqual([]);
  });

  it("should handle zero commission rate categories", async () => {
    const mockCommission = [
      { categoryId: 1, categoryName: "หน้าร้าน", commissionRate: "0.00", totalSales: "150000.00", commission: "0.00" },
    ];
    (getMonthlyCommission as any).mockResolvedValue(mockCommission);

    const result = await getMonthlyCommission(2026, 4, 1);
    expect(result[0].commission).toBe("0.00");
  });
});

describe("Daily Sales with Category Items Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upsert daily sales and then save category items", async () => {
    const mockRecord = { id: 100, salesDate: "2026-04-20", totalAmount: "10000.00" };
    (upsertDailySales as any).mockResolvedValue(mockRecord);
    (upsertDailySalesItems as any).mockResolvedValue(true);

    const record = await upsertDailySales({
      salesDate: "2026-04-20",
      cashAmount: 5000,
      transferAmount: 3000,
      edcAmount: 2000,
      deliveryAmount: 0,
      branchId: 1,
    });

    await upsertDailySalesItems(record.id, [
      { categoryId: 1, amount: 6000 },
      { categoryId: 2, amount: 4000 },
    ]);

    expect(upsertDailySales).toHaveBeenCalledTimes(1);
    expect(upsertDailySalesItems).toHaveBeenCalledWith(100, [
      { categoryId: 1, amount: 6000 },
      { categoryId: 2, amount: 4000 },
    ]);
  });

  it("should return daily sales with category items", async () => {
    const mockRecord = {
      id: 100,
      salesDate: "2026-04-20",
      cashAmount: "5000.00",
      transferAmount: "3000.00",
      edcAmount: "2000.00",
      deliveryAmount: "0.00",
      totalAmount: "10000.00",
      categoryItems: [
        { categoryId: 1, amount: "6000.00", note: "หน้าร้าน" },
        { categoryId: 2, amount: "4000.00", note: "สินค้ากลับบ้าน" },
      ],
    };
    (getDailySalesByDate as any).mockResolvedValue(mockRecord);

    const result = await getDailySalesByDate("2026-04-20", 1);
    expect(result.categoryItems).toHaveLength(2);
    expect(result.categoryItems[0].amount).toBe("6000.00");
  });
});
