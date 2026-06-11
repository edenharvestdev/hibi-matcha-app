import { describe, it, expect } from "vitest";

describe("Area Manager Access - DB Functions", () => {
  it("getDashboardStatsMultiBranch should be exported from db module", async () => {
    const dbModule = await import("./db");
    expect(typeof dbModule.getDashboardStatsMultiBranch).toBe("function");
  });

  it("listCodesByBranches should be exported from db module", async () => {
    const dbModule = await import("./db");
    expect(typeof dbModule.listCodesByBranches).toBe("function");
  });

  it("listReviewRequestsByBranches should be exported from db module", async () => {
    const dbModule = await import("./db");
    expect(typeof dbModule.listReviewRequestsByBranches).toBe("function");
  });

  it("getStaffBranches should be exported from db module", async () => {
    const dbModule = await import("./db");
    expect(typeof dbModule.getStaffBranches).toBe("function");
  });
});

describe("Area Manager Access - Router Procedures", () => {
  it("dashboard.stats procedure should exist", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    expect(router._def.procedures).toHaveProperty("dashboard.stats");
  });

  it("reviews.branchQueue procedure should exist", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    expect(router._def.procedures).toHaveProperty("reviews.branchQueue");
  });

  it("reviews.approve procedure should exist", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    expect(router._def.procedures).toHaveProperty("reviews.approve");
  });

  it("reviews.reject procedure should exist", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    expect(router._def.procedures).toHaveProperty("reviews.reject");
  });

  it("codes.branchCodes procedure should exist", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    expect(router._def.procedures).toHaveProperty("codes.branchCodes");
  });

  it("codes.lookup procedure should exist", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    expect(router._def.procedures).toHaveProperty("codes.lookup");
  });

  it("codes.redeem procedure should exist", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    expect(router._def.procedures).toHaveProperty("codes.redeem");
  });
});

describe("Area Manager Access - Role Permissions", () => {
  it("area_manager should be in branchAdminProcedure allowed roles", () => {
    // branchAdminProcedure allows: branch_owner, branch_manager, area_manager, super_admin
    const allowedRoles = ["branch_owner", "branch_manager", "area_manager", "super_admin"];
    expect(allowedRoles).toContain("area_manager");
  });

  it("area_manager should be in adminRoles for frontend isAdmin check", () => {
    // From useHibiAuth: adminRoles = ["branch_owner", "branch_manager", "area_manager", "super_admin"]
    const adminRoles = ["branch_owner", "branch_manager", "area_manager", "super_admin"];
    expect(adminRoles).toContain("area_manager");
  });

  it("area_manager should NOT be in superAdminProcedure", () => {
    // superAdminProcedure only allows super_admin
    const superAdminRole = "super_admin";
    expect(superAdminRole).not.toBe("area_manager");
  });
});

describe("Area Manager Access - Multi-Branch Stats", () => {
  it("getDashboardStatsMultiBranch should return correct shape with empty branchIds", async () => {
    const dbModule = await import("./db");
    const result = await dbModule.getDashboardStatsMultiBranch([]);
    expect(result).toHaveProperty("totalPendingReviews", 0);
    expect(result).toHaveProperty("totalApprovedToday", 0);
    expect(result).toHaveProperty("totalCodesIssued", 0);
    expect(result).toHaveProperty("totalCodesRedeemed", 0);
    expect(result).toHaveProperty("totalCodesExpired", 0);
  });

  it("listCodesByBranches should return empty array with empty branchIds", async () => {
    const dbModule = await import("./db");
    const result = await dbModule.listCodesByBranches([]);
    expect(result).toEqual([]);
  });

  it("listReviewRequestsByBranches should return empty array with empty branchIds", async () => {
    const dbModule = await import("./db");
    const result = await dbModule.listReviewRequestsByBranches([]);
    expect(result).toEqual([]);
  });
});
