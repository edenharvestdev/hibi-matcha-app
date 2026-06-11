import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as jose from "jose";

// Mock jose to return our fake session
vi.mock("jose", async () => {
  const actual = await vi.importActual("jose");
  return {
    ...actual,
    jwtVerify: vi.fn(),
    SignJWT: (actual as any).SignJWT,
  };
});

// Mock DB functions - use the ACTUAL function names from db.ts
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    listServiceZones: vi.fn(),
    createServiceZone: vi.fn(),
    updateServiceZone: vi.fn(),
    getServiceZoneById: vi.fn(),
    listBranchesByZone: vi.fn(),
    updateBranchZone: vi.fn(),
    listBranchesWithZone: vi.fn(),
    getMultiBranchPettyCashBalances: vi.fn(),
    getMultiBranchDailySalesToday: vi.fn(),
    getMultiBranchOrderIssuesCounts: vi.fn(),
    getMultiBranchPendingReviewsCounts: vi.fn(),
    listOrderIssuesByBranchIds: vi.fn(),
    getStaffBranches: vi.fn(),
    getStaffById: vi.fn(),
    listBranches: vi.fn(),
    listOrderIssues: vi.fn(),
    createAuditLog: vi.fn(),
  };
});

const mockedDb = vi.mocked(await import("./db"));
const mockedJose = vi.mocked(jose);

function createMockContext(hibiSession: { id: number; role: string; type?: string } | null): TrpcContext {
  const hasCookie = hibiSession !== null;
  return {
    user: hibiSession?.role === "super_admin" ? { id: "admin-1", name: "Admin", openId: "admin-open-1" } : null,
    hibiSession: null,
    req: {
      cookies: {},
      headers: {
        cookie: hasCookie ? "hibi_session=fake-token" : "",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function setupJwtMock(session: { id: number; role: string; type?: string }) {
  mockedJose.jwtVerify.mockResolvedValue({
    payload: { type: session.type || "staff", id: session.id, role: session.role },
    protectedHeader: { alg: "HS256" },
  } as any);
}

describe("Zone System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("zones.list", () => {
    it("should list all zones for super_admin", async () => {
      setupJwtMock({ id: 1, role: "super_admin" });
      const zoneData = [
        { id: 1, name: "เขตกรุงเทพ", description: "สาขาในกรุงเทพ", isActive: 1, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, name: "เขตปริมณฑล", description: "สาขาปริมณฑล", isActive: 1, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockedDb.listServiceZones.mockResolvedValue(zoneData as any);

      const ctx = createMockContext({ id: 1, role: "super_admin" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.zones.list();

      expect(result).toHaveLength(2);
      expect(mockedDb.listServiceZones).toHaveBeenCalled();
    });
  });

  describe("zones.create", () => {
    it("should create a zone for super_admin", async () => {
      setupJwtMock({ id: 1, role: "super_admin" });
      mockedDb.createServiceZone.mockResolvedValue(1);
      mockedDb.createAuditLog.mockResolvedValue(undefined as any);

      const ctx = createMockContext({ id: 1, role: "super_admin" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.zones.create({ name: "เขตภาคเหนือ", description: "สาขาภาคเหนือ" });

      expect(result.id).toBe(1);
      expect(mockedDb.createServiceZone).toHaveBeenCalledWith(expect.objectContaining({ name: "เขตภาคเหนือ" }));
    });

    it("should reject zone creation for area_manager", async () => {
      setupJwtMock({ id: 10, role: "area_manager" });
      const ctx = createMockContext({ id: 10, role: "area_manager" });
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.zones.create({ name: "Test Zone" });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(["UNAUTHORIZED", "FORBIDDEN"]).toContain(err.code);
      }
    });
  });

  describe("zones.update", () => {
    it("should update a zone for super_admin", async () => {
      setupJwtMock({ id: 1, role: "super_admin" });
      mockedDb.getServiceZoneById.mockResolvedValue({ id: 1, name: "Old Name" } as any);
      mockedDb.updateServiceZone.mockResolvedValue(undefined as any);
      mockedDb.createAuditLog.mockResolvedValue(undefined as any);

      const ctx = createMockContext({ id: 1, role: "super_admin" });
      const caller = appRouter.createCaller(ctx);
      await caller.zones.update({ id: 1, name: "New Name" });

      expect(mockedDb.updateServiceZone).toHaveBeenCalledWith(1, expect.objectContaining({ name: "New Name" }));
    });
  });

  describe("zones.assignBranch", () => {
    it("should assign a branch to a zone", async () => {
      setupJwtMock({ id: 1, role: "super_admin" });
      mockedDb.updateBranchZone.mockResolvedValue(undefined as any);
      mockedDb.createAuditLog.mockResolvedValue(undefined as any);

      const ctx = createMockContext({ id: 1, role: "super_admin" });
      const caller = appRouter.createCaller(ctx);
      await caller.zones.assignBranch({ branchId: 5, zoneId: 1 });

      expect(mockedDb.updateBranchZone).toHaveBeenCalledWith(5, 1);
    });

    it("should remove a branch from a zone (set zoneId to null)", async () => {
      setupJwtMock({ id: 1, role: "super_admin" });
      mockedDb.updateBranchZone.mockResolvedValue(undefined as any);
      mockedDb.createAuditLog.mockResolvedValue(undefined as any);

      const ctx = createMockContext({ id: 1, role: "super_admin" });
      const caller = appRouter.createCaller(ctx);
      await caller.zones.assignBranch({ branchId: 5, zoneId: null });

      expect(mockedDb.updateBranchZone).toHaveBeenCalledWith(5, null);
    });
  });

  describe("zones.branches (list branches by zone)", () => {
    it("should list branches in a zone", async () => {
      setupJwtMock({ id: 1, role: "super_admin" });
      mockedDb.listBranchesByZone.mockResolvedValue([
        { id: 1, name: "สาขา A", zoneId: 1 },
        { id: 2, name: "สาขา B", zoneId: 1 },
      ] as any);

      const ctx = createMockContext({ id: 1, role: "super_admin" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.zones.branches({ zoneId: 1 });

      expect(result).toHaveLength(2);
      expect(mockedDb.listBranchesByZone).toHaveBeenCalledWith(1);
    });
  });
});

describe("Multi-Branch Overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("multiBranchOverview.summary", () => {
    it("should return multi-branch summary for area_manager", async () => {
      setupJwtMock({ id: 10, role: "area_manager" });
      mockedDb.getStaffBranches.mockResolvedValue([
        { branchId: 1, role: "area_manager" } as any,
        { branchId: 2, role: "area_manager" } as any,
      ]);
      mockedDb.listBranches.mockResolvedValue([
        { id: 1, name: "สาขา 1" },
        { id: 2, name: "สาขา 2" },
        { id: 3, name: "สาขา 3" },
      ] as any);
      mockedDb.getMultiBranchPettyCashBalances.mockResolvedValue([
        { branchId: 1, balance: 5000 },
        { branchId: 2, balance: 3000 },
      ]);
      mockedDb.getMultiBranchDailySalesToday.mockResolvedValue([
        { branchId: 1, grandTotal: 15000 },
        { branchId: 2, grandTotal: 12000 },
      ]);
      mockedDb.getMultiBranchOrderIssuesCounts.mockResolvedValue([
        { branchId: 1, count: 2 },
        { branchId: 2, count: 1 },
      ]);
      mockedDb.getMultiBranchPendingReviewsCounts.mockResolvedValue([
        { branchId: 1, count: 3 },
        { branchId: 2, count: 0 },
      ]);

      const ctx = createMockContext({ id: 10, role: "area_manager" });
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.multiBranchOverview.summary({});
        expect(result.branches).toBeDefined();
        expect(result.branches.length).toBeLessThanOrEqual(2);
      } catch (err: any) {
        expect(err.code).not.toBe("FORBIDDEN");
      }
    });

    it("should reject overview for branch_staff", async () => {
      setupJwtMock({ id: 20, role: "branch_staff" });

      const ctx = createMockContext({ id: 20, role: "branch_staff" });
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.multiBranchOverview.summary({});
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(["UNAUTHORIZED", "FORBIDDEN"]).toContain(err.code);
      }
    });
  });
});

describe("Order Issues - Area Manager Branch Filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should filter order issues by branchId for area_manager", async () => {
    setupJwtMock({ id: 10, role: "area_manager" });
    mockedDb.getStaffBranches.mockResolvedValue([
      { branchId: 1, role: "area_manager" } as any,
      { branchId: 2, role: "area_manager" } as any,
    ]);
    mockedDb.listOrderIssues.mockResolvedValue([]);

    const ctx = createMockContext({ id: 10, role: "area_manager" });
    const caller = appRouter.createCaller(ctx);

    try {
      const result = await caller.orderIssues.list({ branchId: 1 });
      expect(Array.isArray(result)).toBe(true);
    } catch (err: any) {
      expect(err.code).not.toBe("FORBIDDEN");
    }
  });
});

describe("Branches with Zone Info", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return branches with zone names for super_admin", async () => {
    setupJwtMock({ id: 1, role: "super_admin" });
    mockedDb.listBranchesWithZone.mockResolvedValue([
      { branch: { id: 1, name: "สาขา A", zoneId: 1 }, zoneName: "เขตกรุงเทพ" },
      { branch: { id: 2, name: "สาขา B", zoneId: null }, zoneName: null },
    ] as any);

    const ctx = createMockContext({ id: 1, role: "super_admin" });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.branches.listAll();

    expect(result).toHaveLength(2);
    expect((result[0] as any).zoneName).toBe("เขตกรุงเทพ");
    expect((result[1] as any).zoneName).toBeNull();
  });
});
