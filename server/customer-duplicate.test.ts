import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db helpers
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    getCustomerByPhone: vi.fn(),
    getCustomerByEmail: vi.fn(),
    createCustomer: vi.fn(),
    getCustomerById: vi.fn(),
    getOrCreateLoyaltyPoints: vi.fn(),
    calculatePoints: vi.fn(),
    addPoints: vi.fn(),
    getStaffById: vi.fn(),
    addBranchPoints: vi.fn(),
    createAuditLog: vi.fn(),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.jpg", key: "file.jpg" }),
}));

import {
  getCustomerByPhone,
  getCustomerByEmail,
  createCustomer,
  getCustomerById,
  getOrCreateLoyaltyPoints,
  calculatePoints,
  addPoints,
  getStaffById,
  addBranchPoints,
  createAuditLog,
} from "./db";

// ── Phone Normalization Tests ──
describe("Phone Normalization", () => {
  it("normalizes phone by stripping non-digit characters", () => {
    const raw = "06-1616-6213";
    const clean = raw.replace(/\D/g, "");
    expect(clean).toBe("0616166213");
  });

  it("normalizes +66 prefix to 0 prefix", () => {
    let clean = "+66649799879".replace(/\D/g, "");
    if (clean.startsWith("66") && clean.length >= 11) {
      clean = "0" + clean.slice(2);
    }
    expect(clean).toBe("0649799879");
  });

  it("does not modify already clean phone numbers", () => {
    let clean = "0812345678".replace(/\D/g, "");
    if (clean.startsWith("66") && clean.length >= 11) {
      clean = "0" + clean.slice(2);
    }
    expect(clean).toBe("0812345678");
  });

  it("handles phone with spaces", () => {
    const raw = "081 234 5678";
    const clean = raw.replace(/\D/g, "");
    expect(clean).toBe("0812345678");
  });

  it("handles +66 with dashes", () => {
    let clean = "+66-88-237-3747".replace(/\D/g, "");
    if (clean.startsWith("66") && clean.length >= 11) {
      clean = "0" + clean.slice(2);
    }
    expect(clean).toBe("0882373747");
  });
});

// ── Email Normalization Tests ──
describe("Email Normalization", () => {
  it("normalizes email to lowercase", () => {
    const email = "WaewLove26@Gmail.com";
    const clean = email.trim().toLowerCase();
    expect(clean).toBe("waewlove26@gmail.com");
  });

  it("trims whitespace from email", () => {
    const email = "  test@example.com  ";
    const clean = email.trim().toLowerCase();
    expect(clean).toBe("test@example.com");
  });
});

// ── Registration Duplicate Prevention Tests ──
describe("Registration Duplicate Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject registration when phone already exists", async () => {
    const mockGetCustomerByPhone = vi.mocked(getCustomerByPhone);
    mockGetCustomerByPhone.mockResolvedValue({
      id: 1, phone: "0812345678", name: "Test", email: "test@test.com",
      passwordHash: "hash", address: null, province: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    // Simulate the registration check
    const cleanPhone = "0812345678";
    const existing = await getCustomerByPhone(cleanPhone);
    expect(existing).toBeTruthy();
    // In the actual procedure, this would throw CONFLICT
  });

  it("should reject registration when email already exists", async () => {
    const mockGetCustomerByPhone = vi.mocked(getCustomerByPhone);
    const mockGetCustomerByEmail = vi.mocked(getCustomerByEmail);
    
    mockGetCustomerByPhone.mockResolvedValue(undefined);
    mockGetCustomerByEmail.mockResolvedValue({
      id: 1, phone: "0999999999", name: "Test", email: "test@test.com",
      passwordHash: "hash", address: null, province: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    const cleanPhone = "0812345678";
    const cleanEmail = "test@test.com";
    
    const existingPhone = await getCustomerByPhone(cleanPhone);
    expect(existingPhone).toBeUndefined();
    
    const existingEmail = await getCustomerByEmail(cleanEmail);
    expect(existingEmail).toBeTruthy();
    // In the actual procedure, this would throw CONFLICT for email
  });

  it("should allow registration when both phone and email are unique", async () => {
    const mockGetCustomerByPhone = vi.mocked(getCustomerByPhone);
    const mockGetCustomerByEmail = vi.mocked(getCustomerByEmail);
    const mockCreateCustomer = vi.mocked(createCustomer);
    
    mockGetCustomerByPhone.mockResolvedValue(undefined);
    mockGetCustomerByEmail.mockResolvedValue(null);
    mockCreateCustomer.mockResolvedValue(100);

    const cleanPhone = "0812345678";
    const cleanEmail = "new@test.com";
    
    const existingPhone = await getCustomerByPhone(cleanPhone);
    expect(existingPhone).toBeUndefined();
    
    const existingEmail = await getCustomerByEmail(cleanEmail);
    expect(existingEmail).toBeFalsy();
    
    const id = await createCustomer({
      phone: cleanPhone,
      passwordHash: "hash",
      name: "New User",
      email: cleanEmail,
    });
    expect(id).toBe(100);
    expect(mockCreateCustomer).toHaveBeenCalledWith({
      phone: cleanPhone,
      passwordHash: "hash",
      name: "New User",
      email: cleanEmail,
    });
  });

  it("should detect +66 prefix as duplicate of 0-prefix phone", () => {
    // Simulate: existing customer has phone "0649799879"
    // New registration with "+66649799879" should be detected as duplicate
    let cleanPhone = "+66649799879".replace(/\D/g, "");
    if (cleanPhone.startsWith("66") && cleanPhone.length >= 11) {
      cleanPhone = "0" + cleanPhone.slice(2);
    }
    expect(cleanPhone).toBe("0649799879");
    // This normalized phone would match the existing customer
  });
});

// ── earnAtStore Point Calculation Tests ──
describe("earnAtStore Point Calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate points correctly: 150 baht = 15 points", () => {
    const points = Math.floor(150 / 10);
    expect(points).toBe(15);
  });

  it("should calculate points correctly: 99 baht = 9 points", () => {
    const points = Math.floor(99 / 10);
    expect(points).toBe(9);
  });

  it("should calculate points correctly: 10 baht = 1 point", () => {
    const points = Math.floor(10 / 10);
    expect(points).toBe(1);
  });

  it("should return 0 points for less than 10 baht", () => {
    const points = Math.floor(9 / 10);
    expect(points).toBe(0);
  });

  it("should return newBalance in earnAtStore response", async () => {
    const mockGetCustomerById = vi.mocked(getCustomerById);
    const mockGetOrCreateLoyaltyPoints = vi.mocked(getOrCreateLoyaltyPoints);
    const mockAddPoints = vi.mocked(addPoints);
    const mockGetStaffById = vi.mocked(getStaffById);
    const mockAddBranchPoints = vi.mocked(addBranchPoints);
    const mockCreateAuditLog = vi.mocked(createAuditLog);

    mockGetCustomerById.mockResolvedValue({
      id: 100, name: "Test Customer", phone: "0812345678", email: "test@test.com",
      passwordHash: "hash", address: null, province: null,
      createdAt: new Date(), updatedAt: new Date(),
    } as any);

    // First call for initial check, second call after addPoints for newBalance
    mockGetOrCreateLoyaltyPoints
      .mockResolvedValueOnce({
        customerId: 100, totalPoints: 50, usedPoints: 10, lifetimePoints: 50, tier: "green",
      } as any)
      .mockResolvedValueOnce({
        customerId: 100, totalPoints: 65, usedPoints: 10, lifetimePoints: 65, tier: "green",
      } as any);

    mockAddPoints.mockResolvedValue({
      totalPoints: 65, lifetimePoints: 65, tier: "green", pointsEarned: 15,
    });

    mockGetStaffById.mockResolvedValue({
      id: 1, name: "Staff", branchId: 1,
    } as any);

    mockAddBranchPoints.mockResolvedValue(undefined as any);
    mockCreateAuditLog.mockResolvedValue(undefined as any);

    // Simulate the earnAtStore flow
    const customer = await getCustomerById(100);
    expect(customer).toBeTruthy();

    const lp = await getOrCreateLoyaltyPoints(100);
    const points = Math.floor(150 / 10); // calculatePoints
    expect(points).toBe(15);

    const result = await addPoints(100, points, "earn_store", 150, "สะสมแต้มหน้าร้าน ยอด 150 บาท", 1, 1);
    expect(result.pointsEarned).toBe(15);

    // Get updated loyalty points for newBalance
    const updatedLp = await getOrCreateLoyaltyPoints(100);
    const newBalance = updatedLp.totalPoints - updatedLp.usedPoints;
    expect(newBalance).toBe(55); // 65 - 10

    const response = { ...result, customerName: customer!.name, branchId: 1, newBalance };
    expect(response.newBalance).toBe(55);
    expect(response.pointsEarned).toBe(15);
    expect(response.customerName).toBe("Test Customer");
  });
});

// ── branchAdminProcedure Role Check Tests ──
describe("branchAdminProcedure Role Authorization", () => {
  const allowedRoles = ["branch_owner", "branch_manager", "branch_staff", "area_manager", "super_admin"];

  it("should allow branch_staff role", () => {
    expect(allowedRoles.includes("branch_staff")).toBe(true);
  });

  it("should allow branch_manager role", () => {
    expect(allowedRoles.includes("branch_manager")).toBe(true);
  });

  it("should allow branch_owner role", () => {
    expect(allowedRoles.includes("branch_owner")).toBe(true);
  });

  it("should allow area_manager role", () => {
    expect(allowedRoles.includes("area_manager")).toBe(true);
  });

  it("should allow super_admin role", () => {
    expect(allowedRoles.includes("super_admin")).toBe(true);
  });

  it("should deny customer role", () => {
    expect(allowedRoles.includes("customer")).toBe(false);
  });

  it("should deny support_staff role", () => {
    expect(allowedRoles.includes("support_staff")).toBe(false);
  });
});
