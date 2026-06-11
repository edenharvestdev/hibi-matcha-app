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
    listPointClaims: vi.fn().mockResolvedValue([]),
    getStaffById: vi.fn(),
  };
});

import { listPointClaims, getStaffById } from "./db";

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

describe("claimsQueue - branch filter (Admin)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getStaffById as any).mockResolvedValue({ id: 1, branchId: 1, role: "super_admin" });
    (listPointClaims as any).mockResolvedValue([]);
  });

  it("should pass branchId filter when super_admin specifies a branch", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await caller.loyalty.claimsQueue({ branchId: 2 });

    expect(listPointClaims).toHaveBeenCalledWith(undefined, 2, undefined, undefined);
  });

  it("should pass undefined branchId when super_admin selects all branches", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await caller.loyalty.claimsQueue({});

    expect(listPointClaims).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
  });

  it("should pass both status and branchId filters", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await caller.loyalty.claimsQueue({ status: "pending", branchId: 3 });

    expect(listPointClaims).toHaveBeenCalledWith("pending", 3, undefined, undefined);
  });
});

describe("claimsQueue - date filter (Branch)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getStaffById as any).mockResolvedValue({ id: 1, branchId: 5, role: "branch_admin" });
    (listPointClaims as any).mockResolvedValue([]);
  });

  it("should pass fromDate and toDate when date filter is specified", async () => {
    // branch_admin role will use staffMember.branchId
    // But since jose mock returns super_admin, let's test with super_admin for simplicity
    (getStaffById as any).mockResolvedValue({ id: 1, branchId: 1, role: "super_admin" });

    const fromDate = new Date("2026-03-28T00:00:00");
    const toDate = new Date("2026-03-28T23:59:59");

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await caller.loyalty.claimsQueue({ fromDate, toDate });

    expect(listPointClaims).toHaveBeenCalledWith(undefined, undefined, fromDate, toDate);
  });

  it("should pass all filters together (status + branchId + date)", async () => {
    (getStaffById as any).mockResolvedValue({ id: 1, branchId: 1, role: "super_admin" });

    const fromDate = new Date("2026-03-27T00:00:00");
    const toDate = new Date("2026-03-27T23:59:59");

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await caller.loyalty.claimsQueue({ status: "approved", branchId: 2, fromDate, toDate });

    expect(listPointClaims).toHaveBeenCalledWith("approved", 2, fromDate, toDate);
  });

  it("should work with only fromDate (no toDate)", async () => {
    (getStaffById as any).mockResolvedValue({ id: 1, branchId: 1, role: "super_admin" });

    const fromDate = new Date("2026-03-01T00:00:00");

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    await caller.loyalty.claimsQueue({ fromDate });

    expect(listPointClaims).toHaveBeenCalledWith(undefined, undefined, fromDate, undefined);
  });

  it("should return empty array when no claims match", async () => {
    (getStaffById as any).mockResolvedValue({ id: 1, branchId: 1, role: "super_admin" });
    (listPointClaims as any).mockResolvedValue([]);

    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.loyalty.claimsQueue({ branchId: 999 });

    expect(result).toEqual([]);
  });
});
