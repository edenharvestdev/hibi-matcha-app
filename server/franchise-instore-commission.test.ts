import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as jose from "jose";

// Mock jose for hibiSession verification
vi.mock("jose", () => ({
  jwtVerify: vi.fn().mockResolvedValue({
    payload: { type: "staff", id: 1, role: "super_admin" },
  }),
  SignJWT: vi.fn().mockReturnValue({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-jwt"),
  }),
}));

// Mock db functions
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getStaffById: vi.fn().mockResolvedValue({
      id: 1, name: "Admin", role: "super_admin", branchId: 1, isActive: 1,
      phone: "0811111111", pin: "1234", permissions: null, zoneId: null,
    }),
    // Franchise owners
    createFranchiseOwner: vi.fn().mockResolvedValue({ id: 1, name: "Test Owner", companyName: "Test Co.", phone: "0812345678", email: "test@test.com", isActive: 1 }),
    listFranchiseOwners: vi.fn().mockResolvedValue([
      { id: 1, name: "Owner A", companyName: "Company A", phone: "0811111111", email: "a@test.com", isActive: 1 },
      { id: 2, name: "Owner B", companyName: null, phone: null, email: null, isActive: 1 },
    ]),
    updateFranchiseOwner: vi.fn().mockResolvedValue({ id: 1, name: "Updated Owner" }),
    getBranchesByFranchiseOwner: vi.fn().mockResolvedValue([
      { id: 1, name: "Branch 1", province: "Bangkok" },
    ]),
    assignBranchToFranchiseOwner: vi.fn().mockResolvedValue(undefined),
    // In-store sales
    createInStoreSale: vi.fn().mockResolvedValue(1),
    listInStoreSales: vi.fn().mockResolvedValue({
      sales: [
        {
          id: 1, branchId: 1, customerId: 100, productId: 5,
          quantity: 2, unitPrice: 50000, totalAmount: 100000,
          paymentSlipUrl: null, totalCommission: 5000,
          commissionType: "percent", commissionValue: 5,
          pointsAwarded: 100, staffCommission: 2500,
          saleDate: new Date(), note: null, createdBy: 1,
          productName: "Matcha Powder", customerName: "John",
          branchName: "Branch 1",
        },
      ],
      total: 1,
    }),
    // Commission reports
    getMonthlyCommissionReport: vi.fn().mockResolvedValue([
      {
        id: 1, staffId: 1, staffName: "Staff A", branchId: 1, branchName: "Branch 1",
        salesAmount: 100000, commission: 5000, status: "pending",
      },
      {
        id: 2, staffId: 2, staffName: "Staff B", branchId: 1, branchName: "Branch 1",
        salesAmount: 200000, commission: 10000, status: "approved",
      },
    ]),
    updateCommissionRecordStatus: vi.fn().mockResolvedValue({ id: 1, status: "approved" }),
    bulkUpdateCommissionRecordStatus: vi.fn().mockResolvedValue({ count: 2 }),
    // Existing mocks needed
    getShopProductById: vi.fn().mockResolvedValue({
      id: 5, name: "Matcha Powder", retailPrice: 50000,
      commissionType: "percent", commissionValue: 5, isActive: 1,
    }),
    addLoyaltyPoints: vi.fn().mockResolvedValue({ id: 1 }),
    addPoints: vi.fn().mockResolvedValue(undefined),
    addBranchPoints: vi.fn().mockResolvedValue(undefined),
    getOrCreateLoyaltyPoints: vi.fn().mockResolvedValue({ id: 1, customerId: 100, totalPoints: 0 }),
    upsertCommissionRecord: vi.fn().mockResolvedValue(undefined),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
    listBranches: vi.fn().mockResolvedValue([
      { id: 1, name: "Branch 1", isActive: 1 },
    ]),
    getBranchById: vi.fn().mockResolvedValue({
      id: 1, name: "Branch 1", isActive: 1, commissionMode: "product",
      province: null, address: null, phone: null, createdAt: new Date(),
      franchiseOwnerId: null,
    }),
    // Quick register customer mocks
    getCustomerByPhone: vi.fn().mockResolvedValue(null),
    getCustomerByEmail: vi.fn().mockResolvedValue(null),
    createCustomer: vi.fn().mockResolvedValue(500),
    // Staff management mocks
    getStaffByPhone: vi.fn().mockResolvedValue({ id: 1, phone: "0811111111" }),
    getStaffByEmployeeCode: vi.fn().mockResolvedValue(null),
    createStaffMember: vi.fn().mockResolvedValue(100),
    updateStaffMember: vi.fn().mockResolvedValue(undefined),
    setStaffPermissions: vi.fn().mockResolvedValue(undefined),
    setStaffBranches: vi.fn().mockResolvedValue(undefined),
    getStaffPermissions: vi.fn().mockResolvedValue([]),
    hasPermission: vi.fn().mockResolvedValue(true),
    DEFAULT_ROLE_PERMISSIONS: actual.DEFAULT_ROLE_PERMISSIONS,
  };
});

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$mockhash"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/slip.jpg", key: "slip.jpg" }),
}));

const HIBI_SESSION_COOKIE = "hibi_session";

function createSuperAdminContext(): TrpcContext {
  return {
    user: null,
    hibiSession: null,
    req: {
      protocol: "https",
      headers: { cookie: `${HIBI_SESSION_COOKIE}=mock-token` },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    hibiSession: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Franchise Owners", () => {
  it("should list franchise owners", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.franchiseOwners.list({});
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Owner A");
    expect(result[1].name).toBe("Owner B");
  });

  it("should create a franchise owner", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.franchiseOwners.create({
      name: "Test Owner",
      companyName: "Test Co.",
      phone: "0812345678",
      email: "test@test.com",
    });
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
  });

  it("should update a franchise owner", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.franchiseOwners.update({
      id: 1,
      name: "Updated Owner",
    });
    expect(result).toBeDefined();
  });

  it("should get branches by franchise owner", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.franchiseOwners.branches({ franchiseOwnerId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Branch 1");
  });

  it("should assign branch to franchise owner", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.franchiseOwners.assignBranch({ branchId: 1, franchiseOwnerId: 1 })
    ).resolves.not.toThrow();
  });

  it("should reject unauthenticated access to franchise owners", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.franchiseOwners.list({})).rejects.toThrow();
  });
});

describe("In-Store Sales", () => {
  it("should list in-store sales", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.list({
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    });
    expect(result.sales).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.sales[0].productName).toBe("Matcha Powder");
  });

  it("should create an in-store sale with staff", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.create({
      branchId: 1,
      customerId: 100,
      productId: 5,
      quantity: 2,
      unitPrice: 50000,
      staffIds: [1, 2],
    });
    expect(result).toBeDefined();
    expect(result.pointsAwarded).toBeGreaterThanOrEqual(0);
  });

  it("should reject more than 10 staff members", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.inStoreSales.create({
        branchId: 1,
        customerId: 100,
        productId: 5,
        quantity: 1,
        unitPrice: 50000,
        staffIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      })
    ).rejects.toThrow();
  });

  it("should reject empty staff list", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.inStoreSales.create({
        branchId: 1,
        customerId: 100,
        productId: 5,
        quantity: 1,
        unitPrice: 50000,
        staffIds: [],
      })
    ).rejects.toThrow();
  });

  it("should upload a payment slip", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.uploadSlip({
      fileName: "slip.jpg",
      base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      contentType: "image/jpeg",
    });
    expect(result.url).toBeDefined();
    expect(result.url).toContain("s3");
  });

  it("should reject unauthenticated access to in-store sales", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.inStoreSales.list({ startDate: "2026-01-01", endDate: "2026-12-31" })
    ).rejects.toThrow();
  });
});

describe("Commission Reports", () => {
  it("should get monthly commission report", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.commissionReports.monthly({ month: "2026-04" });
    expect(result).toHaveLength(2);
    expect(result[0].staffName).toBe("Staff A");
    expect(result[0].status).toBe("pending");
    expect(result[1].status).toBe("approved");
  });

  it("should update commission record status", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.commissionReports.updateStatus({ id: 1, status: "approved" });
    expect(result).toBeDefined();
  });

  it("should bulk update commission record status", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.commissionReports.bulkUpdateStatus({
      ids: [1, 2],
      status: "paid",
    });
    expect(result.count).toBe(2);
  });

  it("should reject invalid status values", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.commissionReports.updateStatus({ id: 1, status: "invalid_status" as any })
    ).rejects.toThrow();
  });

  it("should reject unauthenticated access to commission reports", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.commissionReports.monthly({ month: "2026-04" })
    ).rejects.toThrow();
  });
});

describe("Quick Register Customer", () => {
  it("should quick register a new customer from in-store sales", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.quickRegisterCustomer({
      phone: "0891234567",
      name: "New Customer",
    });
    expect(result.success).toBe(true);
    expect(result.customerId).toBeDefined();
    expect(result.customerName).toBe("New Customer");
    expect(result.customerPhone).toBe("0891234567");
    expect(result.isExisting).toBe(false);
    expect(result.tempPassword).toBeDefined();
  });

  it("should return existing customer if phone already registered", async () => {
    const { getCustomerByPhone } = await import("./db");
    vi.mocked(getCustomerByPhone).mockResolvedValueOnce({
      id: 99, name: "Existing Customer", phone: "0891234567",
      email: "exist@test.com", passwordHash: "hash",
      address: null, province: null, isActive: 1, createdAt: new Date(),
    } as any);
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.quickRegisterCustomer({
      phone: "0891234567",
      name: "New Customer",
    });
    expect(result.success).toBe(true);
    expect(result.isExisting).toBe(true);
    expect(result.customerId).toBe(99);
    expect(result.customerName).toBe("Existing Customer");
  });

  it("should normalize +66 phone prefix", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.quickRegisterCustomer({
      phone: "+66891234567",
      name: "Thai Customer",
    });
    expect(result.success).toBe(true);
    expect(result.customerPhone).toBe("0891234567");
  });

  it("should reject invalid phone numbers", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.inStoreSales.quickRegisterCustomer({
        phone: "123",
        name: "Bad Phone",
      })
    ).rejects.toThrow();
  });

  it("should reject unauthenticated quick register", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.inStoreSales.quickRegisterCustomer({
        phone: "0891234567",
        name: "Test",
      })
    ).rejects.toThrow();
  });
});

describe("Commission Split Logic", () => {
  it("should split commission equally among multiple staff", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    // With 2 staff, commission should be split
    const result = await caller.inStoreSales.create({
      branchId: 1,
      customerId: 100,
      productId: 5,
      quantity: 2,
      unitPrice: 50000,
      staffIds: [1, 2],
    });
    // commissionValue=5 basis points, totalAmount=100000 satang
    // totalCommission = round(100000 * 5 / 10000) = 50
    expect(result.totalCommission).toBe(50);
    expect(result.saleId).toBe(1);
    // pointsAwarded = floor(100000/100/10) = 100
    expect(result.pointsAwarded).toBe(100);
  });

  it("should handle single staff commission without split", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.create({
      branchId: 1,
      customerId: 100,
      productId: 5,
      quantity: 1,
      unitPrice: 50000,
      staffIds: [1],
    });
    // commissionValue=5 basis points, totalAmount=50000
    // totalCommission = round(50000 * 5 / 10000) = 25
    expect(result.totalCommission).toBe(25);
    // pointsAwarded = floor(50000/100/10) = 50
    expect(result.pointsAwarded).toBe(50);
  });

  it("should handle 3 staff commission split", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.create({
      branchId: 1,
      customerId: 100,
      productId: 5,
      quantity: 3,
      unitPrice: 50000,
      staffIds: [1, 2, 3],
    });
    // commissionValue=5 basis points, totalAmount=150000
    // totalCommission = round(150000 * 5 / 10000) = 75
    expect(result.totalCommission).toBe(75);
    // upsertCommissionRecord should be called 3 times with perStaff = floor(75/3) = 25
    const { upsertCommissionRecord } = await import("./db");
    const mockUpsert = vi.mocked(upsertCommissionRecord);
    const calls = mockUpsert.mock.calls;
    const lastThreeCalls = calls.slice(-3);
    expect(lastThreeCalls).toHaveLength(3);
    for (const call of lastThreeCalls) {
      expect(call[0].commission).toBe(25);
    }
  });
});

describe("Commission Mode B (Staff-based)", () => {
  it("should use product commission in default (product) mode", async () => {
    // Default mock returns commissionMode: "product" from getBranchById
    // and product has commissionValue: 5 (basis points)
    // So commission = round(50000 * 5 / 10000) = 25
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.create({
      branchId: 1,
      customerId: 100,
      productId: 5,
      quantity: 1,
      unitPrice: 50000,
      staffIds: [1],
    });
    expect(result.totalCommission).toBe(25);
  });

  it("should validate staffIds max is now 10", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    // 10 staff should be accepted
    const result = await caller.inStoreSales.create({
      branchId: 1,
      customerId: 100,
      productId: 5,
      quantity: 1,
      unitPrice: 50000,
      staffIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    });
    expect(result).toBeDefined();
    // 11 staff should be rejected
    await expect(
      caller.inStoreSales.create({
        branchId: 1,
        customerId: 100,
        productId: 5,
        quantity: 1,
        unitPrice: 50000,
        staffIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      })
    ).rejects.toThrow();
  });

  it("should calculate commission correctly with calculateCommission helper", async () => {
    // Import the actual calculateCommission function
    const { calculateCommission } = await import("./db");
    // Percent mode: 5% of 100000 satang
    expect(calculateCommission("percent", 500, 100000)).toBe(5000);
    // Fixed mode: 2000 satang
    expect(calculateCommission("fixed", 2000, 100000)).toBe(2000);
    // Null type: 0
    expect(calculateCommission(null, 0, 100000)).toBe(0);
    // Percent 1% of 50000
    expect(calculateCommission("percent", 100, 50000)).toBe(500);
  });
});

describe("Staff Commission Fields", () => {
  it("should accept commissionType and commissionValue in staff create", async () => {
    // Mock getStaffByPhone to return null (no existing staff with this phone)
    const db = await import("./db");
    vi.mocked(db.getStaffByPhone).mockResolvedValueOnce(null);
    vi.mocked(db.getCustomerByPhone).mockResolvedValueOnce(null);
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    // This should not throw - commissionType/commissionValue are now accepted
    const result = await caller.staff.create({
      phone: "0899999999",
      password: "password123",
      name: "Commission Staff",
      role: "branch_staff",
      branchId: 1,
      commissionType: "percent",
      commissionValue: 500, // 5%
    });
    expect(result).toBeDefined();
  });

  it("should accept commissionType and commissionValue in staff update", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.staff.update({
      id: 1,
      name: "Updated Staff",
      commissionType: "fixed",
      commissionValue: 2000, // 20 baht
    });
    expect(result.success).toBe(true);
  });
});

describe("App Sale (isAppSale) & Cost Price", () => {
  it("should create sale with isAppSale=true and zero commission", async () => {
    const { createInStoreSale, getShopProductById, getBranchById } = await import("./db");
    (getBranchById as any).mockResolvedValueOnce({
      id: 1, name: "Branch 1", isActive: 1, commissionMode: "product",
      province: null, address: null, phone: null, createdAt: new Date(), franchiseOwnerId: null,
    });
    (getShopProductById as any).mockResolvedValueOnce({
      id: 5, name: "Matcha Powder", retailPrice: 50000,
      commissionType: "percent", commissionValue: 500, isActive: 1,
      costPrice: 20000, // 200 baht cost
    });

    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.create({
      branchId: 1,
      customerId: 100,
      productId: 5,
      quantity: 2,
      unitPrice: 50000,
      staffIds: [1],
      isAppSale: true,
    });

    // Commission should be 0 for app sales
    expect(result.totalCommission).toBe(0);
    expect(result.isAppSale).toBeTruthy();
    // totalCost = costPrice * quantity = 20000 * 2 = 40000
    expect(result.totalCost).toBe(40000);

    // createInStoreSale should be called with isAppSale=1
    expect(createInStoreSale).toHaveBeenCalledWith(
      expect.objectContaining({
        isAppSale: 1,
        totalCommission: 0,
        totalCost: 40000,
      })
    );
  });

  it("should create sale with isAppSale=false and normal commission", async () => {
    const { createInStoreSale, getShopProductById, getBranchById } = await import("./db");
    (getBranchById as any).mockResolvedValueOnce({
      id: 1, name: "Branch 1", isActive: 1, commissionMode: "product",
      province: null, address: null, phone: null, createdAt: new Date(), franchiseOwnerId: null,
    });
    (getShopProductById as any).mockResolvedValueOnce({
      id: 5, name: "Matcha Powder", retailPrice: 50000,
      commissionType: "percent", commissionValue: 500, isActive: 1,
      costPrice: 20000,
    });

    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.create({
      branchId: 1,
      customerId: 100,
      productId: 5,
      quantity: 2,
      unitPrice: 50000,
      staffIds: [1],
      isAppSale: false,
    });

    // Commission should be calculated normally
    expect(result.totalCommission).toBeGreaterThan(0);
    expect(result.isAppSale).toBeFalsy();
    expect(result.totalCost).toBe(40000);
  });

  it("should default isAppSale to false when not provided", async () => {
    const { createInStoreSale, getShopProductById, getBranchById } = await import("./db");
    (getBranchById as any).mockResolvedValueOnce({
      id: 1, name: "Branch 1", isActive: 1, commissionMode: "product",
      province: null, address: null, phone: null, createdAt: new Date(), franchiseOwnerId: null,
    });
    (getShopProductById as any).mockResolvedValueOnce({
      id: 5, name: "Matcha Powder", retailPrice: 50000,
      commissionType: "percent", commissionValue: 500, isActive: 1,
      costPrice: 0,
    });

    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.inStoreSales.create({
      branchId: 1,
      customerId: 100,
      productId: 5,
      quantity: 1,
      unitPrice: 50000,
      staffIds: [1],
    });

    // Should have commission (not app sale)
    expect(result.isAppSale).toBeFalsy();
    expect(result.totalCommission).toBeGreaterThan(0);
    expect(result.totalCost).toBe(0);
  });

  it("should accept costPrice in shopProducts.create", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    // This should not throw - costPrice is accepted
    await expect(
      caller.shopProducts.create({
        name: "Test Product",
        retailPrice: 50000,
        costPrice: 20000,
      })
    ).resolves.toBeDefined();
  });

  it("should accept costPrice in shopProducts.update", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.shopProducts.update({
        id: 5,
        costPrice: 25000,
      })
    ).resolves.toBeDefined();
  });
});
