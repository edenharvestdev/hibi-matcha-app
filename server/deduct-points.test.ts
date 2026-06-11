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

// Mock db helpers
vi.mock("./db", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
    getCustomerById: vi.fn(),
    getStaffById: vi.fn(),
    getOrCreateLoyaltyPoints: vi.fn(),
    getOrCreateBranchLoyalty: vi.fn().mockResolvedValue({ totalPoints: 100, usedPoints: 0, lifetimePoints: 100 }),
    deductPoints: vi.fn(),
    deductBranchPoints: vi.fn(),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getCustomerById, getStaffById, deductPoints, deductBranchPoints } from "./db";

const mockedGetCustomerById = vi.mocked(getCustomerById);
const mockedGetStaffById = vi.mocked(getStaffById);
const mockedDeductPoints = vi.mocked(deductPoints);
const mockedDeductBranchPoints = vi.mocked(deductBranchPoints);

function createContext(role: string, staffId = 100): TrpcContext {
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
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("loyalty.deductPoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully deducts points for a valid customer (manager role)", async () => {
    const ctx = createContext("branch_manager");
    mockedGetCustomerById.mockResolvedValue({
      id: 1,
      name: "Test Customer",
      phone: "0812345678",
    } as any);
    mockedGetStaffById.mockResolvedValue({
      id: 100,
      branchId: 5,
      name: "Manager A",
    } as any);
    mockedDeductPoints.mockResolvedValue({
      success: true as const,
      newBalance: 44,
      pointsDeducted: 56,
    });
    mockedDeductBranchPoints.mockResolvedValue({
      success: true as const,
      balance: 44,
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.loyalty.deductPoints({
      customerId: 1,
      points: 56,
      reason: "ให้แต้มผิดสาขา",
      branchId: 5,
    });

    expect(result.success).toBe(true);
    expect(result.pointsDeducted).toBe(56);
    expect(result.newBalance).toBe(44);
    expect(result.customerName).toBe("Test Customer");
    expect(mockedDeductPoints).toHaveBeenCalledWith(1, 56, "ให้แต้มผิดสาขา", 5, 100);
    expect(mockedDeductBranchPoints).toHaveBeenCalledWith(1, 5, 56);
  });

  it("returns error when customer has insufficient points", async () => {
    const ctx = createContext("branch_owner");
    mockedGetCustomerById.mockResolvedValue({
      id: 2,
      name: "Low Points Customer",
      phone: "0899999999",
    } as any);
    mockedGetStaffById.mockResolvedValue({
      id: 100,
      branchId: 3,
      name: "Owner B",
    } as any);
    mockedDeductPoints.mockResolvedValue({
      success: false as const,
      error: "แต้มลูกค้าไม่เพียงพอสำหรับการหัก",
    });

    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.loyalty.deductPoints({
        customerId: 2,
        points: 100,
        reason: "ยกเลิกรายการ",
        branchId: 3,
      })
    ).rejects.toThrow("แต้มลูกค้าไม่เพียงพอสำหรับการหัก");
  });

  it("rejects non-manager roles (branch_staff) with FORBIDDEN", async () => {
    const ctx = createContext("branch_staff");

    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.loyalty.deductPoints({
        customerId: 1,
        points: 10,
        reason: "test",
        branchId: 1,
      })
    ).rejects.toThrow("เฉพาะ Manager ขึ้นไปเท่านั้นที่สามารถหักแต้มได้");
  });

  it("allows super_admin to deduct points", async () => {
    const ctx = createContext("super_admin");
    mockedGetCustomerById.mockResolvedValue({
      id: 3,
      name: "VIP Customer",
      phone: "0800000000",
    } as any);
    mockedGetStaffById.mockResolvedValue({
      id: 100,
      branchId: null,
      name: "Super Admin",
    } as any);
    mockedDeductPoints.mockResolvedValue({
      success: true as const,
      newBalance: 90,
      pointsDeducted: 10,
    });

    const caller = appRouter.createCaller(ctx);
    const result = await caller.loyalty.deductPoints({
      customerId: 3,
      points: 10,
      reason: "แก้ไขข้อผิดพลาด",
      branchId: 2,
    });

    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(90);
    expect(mockedDeductPoints).toHaveBeenCalledWith(3, 10, "แก้ไขข้อผิดพลาด", 2, 100);
    expect(mockedDeductBranchPoints).toHaveBeenCalledWith(3, 2, 10);
  });

  it("rejects customer role with FORBIDDEN", async () => {
    const ctx = createContext("customer", 50);
    // branchAdminProcedure should block this before reaching deductPoints logic
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.loyalty.deductPoints({
        customerId: 1,
        points: 5,
        reason: "hack attempt",
        branchId: 1,
      })
    ).rejects.toThrow();
  });
});
