import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock jose for hibiSession verification
vi.mock("jose", () => ({
  jwtVerify: vi.fn().mockResolvedValue({
    payload: { staffId: 1, role: "super_admin", branchId: 1 },
  }),
  SignJWT: vi.fn().mockReturnValue({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-token"),
  }),
}));

// Mock db functions
vi.mock("./db", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    getPointClaimById: vi.fn(),
    getCustomerById: vi.fn(),
    getBranchById: vi.fn(),
    getOrCreateLoyaltyPoints: vi.fn(),
    calculatePoints: vi.fn(),
    addPoints: vi.fn(),
    addBranchPoints: vi.fn(),
    updatePointClaim: vi.fn(),
    createAuditLog: vi.fn(),
    getStaffById: vi.fn(),
    listPointClaims: vi.fn(),
  };
});

import {
  getPointClaimById,
  getCustomerById,
  getBranchById,
  getOrCreateLoyaltyPoints,
  calculatePoints,
  addPoints,
  addBranchPoints,
  updatePointClaim,
  createAuditLog,
  getStaffById,
  listPointClaims,
} from "./db";

const HIBI_SESSION_COOKIE = "hibi_session";

function createStaffContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { cookie: `${HIBI_SESSION_COOKIE}=mock-token` },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };
}

describe("point claim - approve from rejected status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getStaffById as any).mockResolvedValue({ id: 1, branchId: 1, role: "super_admin" });
  });

  it("should allow approving a rejected claim", async () => {
    const mockClaim = {
      id: 1,
      customerId: 10,
      branchId: 1,
      deliveryApp: "grab",
      orderId: "GF-602",
      orderAmount: 984,
      status: "rejected",
      rejectionReason: "ข้อมูลไม่ตรง",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getPointClaimById as any).mockResolvedValue(mockClaim);
    (getOrCreateLoyaltyPoints as any).mockResolvedValue({ tier: "green", totalPoints: 0 });
    (calculatePoints as any).mockReturnValue(98);
    (addPoints as any).mockResolvedValue({ id: 1 });
    (addBranchPoints as any).mockResolvedValue(undefined);
    (updatePointClaim as any).mockResolvedValue(undefined);
    (createAuditLog as any).mockResolvedValue(undefined);

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.loyalty.approveClaim({ id: 1 });

    expect(result).toEqual({ success: true, pointsAwarded: 98 });
    expect(updatePointClaim).toHaveBeenCalledWith(1, expect.objectContaining({
      status: "approved",
      pointsAwarded: 98,
      rejectionReason: null,
    }));
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "reapprove_point_claim",
      details: expect.stringContaining("อนุมัติย้อนหลัง"),
    }));
  });

  it("should still allow approving a pending claim", async () => {
    const mockClaim = {
      id: 2,
      customerId: 10,
      branchId: 1,
      deliveryApp: "shopee",
      orderId: "SP-100",
      orderAmount: 500,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getPointClaimById as any).mockResolvedValue(mockClaim);
    (getOrCreateLoyaltyPoints as any).mockResolvedValue({ tier: "green", totalPoints: 0 });
    (calculatePoints as any).mockReturnValue(50);
    (addPoints as any).mockResolvedValue({ id: 2 });
    (addBranchPoints as any).mockResolvedValue(undefined);
    (updatePointClaim as any).mockResolvedValue(undefined);
    (createAuditLog as any).mockResolvedValue(undefined);

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.loyalty.approveClaim({ id: 2 });

    expect(result).toEqual({ success: true, pointsAwarded: 50 });
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "approve_point_claim",
    }));
  });

  it("should reject approving an already approved claim", async () => {
    const mockClaim = {
      id: 3,
      customerId: 10,
      branchId: 1,
      deliveryApp: "grab",
      orderId: "GF-700",
      orderAmount: 300,
      status: "approved",
      pointsAwarded: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getPointClaimById as any).mockResolvedValue(mockClaim);

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.loyalty.approveClaim({ id: 3 })).rejects.toThrow("คำขอนี้ได้รับการพิจารณาแล้ว");
  });

  it("should throw NOT_FOUND for non-existent claim", async () => {
    (getPointClaimById as any).mockResolvedValue(null);

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.loyalty.approveClaim({ id: 999 })).rejects.toThrow();
  });
});

describe("point claim - claimDetail returns all order fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getStaffById as any).mockResolvedValue({ id: 1, branchId: 1, role: "super_admin" });
  });

  it("should return Grab-specific fields (gfNumber, bookingId)", async () => {
    const mockClaim = {
      id: 1,
      customerId: 10,
      branchId: 1,
      deliveryApp: "grab",
      orderId: "GF-602",
      gfNumber: "GF-602",
      bookingId: "A-955FCHCGW72IAV",
      orderAmount: 984,
      status: "pending",
      createdAt: new Date("2026-03-28T10:23:00Z"),
      updatedAt: new Date(),
    };

    (getPointClaimById as any).mockResolvedValue(mockClaim);
    (getCustomerById as any).mockResolvedValue({ id: 10, name: "Nopanat", phone: "0971540999" });
    (getBranchById as any).mockResolvedValue({ id: 1, name: "HB01-Ladprao107" });
    (getOrCreateLoyaltyPoints as any).mockResolvedValue({ tier: "green" });

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.loyalty.claimDetail({ id: 1 });

    expect(result.gfNumber).toBe("GF-602");
    expect(result.bookingId).toBe("A-955FCHCGW72IAV");
    expect(result.customerName).toBe("Nopanat");
    expect(result.branchName).toBe("HB01-Ladprao107");
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("should return Shopee-specific fields (shopeeOrderNumber, shopeeOrderId)", async () => {
    const mockClaim = {
      id: 2,
      customerId: 10,
      branchId: 1,
      deliveryApp: "shopee",
      orderId: "SP-212",
      shopeeOrderNumber: "212",
      shopeeOrderId: "3011303289058816525",
      orderAmount: 500,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getPointClaimById as any).mockResolvedValue(mockClaim);
    (getCustomerById as any).mockResolvedValue({ id: 10, name: "Test", phone: "0800000000" });
    (getBranchById as any).mockResolvedValue({ id: 1, name: "HB02" });
    (getOrCreateLoyaltyPoints as any).mockResolvedValue({ tier: "green" });

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.loyalty.claimDetail({ id: 2 });

    expect(result.shopeeOrderNumber).toBe("212");
    expect(result.shopeeOrderId).toBe("3011303289058816525");
  });

  it("should return LINE MAN-specific fields (linemanOrderNumber, linemanOrderId)", async () => {
    const mockClaim = {
      id: 3,
      customerId: 10,
      branchId: 1,
      deliveryApp: "lineman",
      orderId: "LM-5175",
      linemanOrderNumber: "5175",
      linemanOrderId: "LMF-260321-538845175",
      orderAmount: 300,
      status: "approved",
      pointsAwarded: 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getPointClaimById as any).mockResolvedValue(mockClaim);
    (getCustomerById as any).mockResolvedValue({ id: 10, name: "Test", phone: "0800000000" });
    (getBranchById as any).mockResolvedValue({ id: 1, name: "HB03" });
    (getOrCreateLoyaltyPoints as any).mockResolvedValue({ tier: "gold" });

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.loyalty.claimDetail({ id: 3 });

    expect(result.linemanOrderNumber).toBe("5175");
    expect(result.linemanOrderId).toBe("LMF-260321-538845175");
    expect(result.customerTier).toBe("gold");
  });
});
