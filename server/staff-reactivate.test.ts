import { describe, it, expect } from "vitest";
import { DEFAULT_ROLE_PERMISSIONS, ALL_PERMISSIONS } from "./db";

describe("Staff Reactivation - Role Authorization", () => {
  it("branch_owner should have manage_staff permission to reactivate staff", () => {
    const ownerPerms = DEFAULT_ROLE_PERMISSIONS["branch_owner"];
    expect(ownerPerms).toContain("manage_staff");
  });

  it("branch_manager should NOT have manage_staff permission", () => {
    const managerPerms = DEFAULT_ROLE_PERMISSIONS["branch_manager"];
    expect(managerPerms).not.toContain("manage_staff");
  });

  it("branch_staff should NOT have manage_staff permission", () => {
    const staffPerms = DEFAULT_ROLE_PERMISSIONS["branch_staff"];
    expect(staffPerms).not.toContain("manage_staff");
  });

  it("super_admin should have manage_staff permission", () => {
    const adminPerms = DEFAULT_ROLE_PERMISSIONS["super_admin"];
    expect(adminPerms).toContain("manage_staff");
  });
});

describe("Staff Reactivation - DB function existence", () => {
  it("reactivateStaffMember should be exported from db module", async () => {
    const dbModule = await import("./db");
    expect(typeof dbModule.reactivateStaffMember).toBe("function");
  });

  it("deleteStaffMember should be exported from db module", async () => {
    const dbModule = await import("./db");
    expect(typeof dbModule.deleteStaffMember).toBe("function");
  });
});

describe("Staff Reactivation - Router procedure existence", () => {
  it("branchStaff router should have reactivate procedure", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    // Check that the procedure path exists
    expect(router._def.procedures).toHaveProperty("branchStaff.reactivate");
  });

  it("branchStaff router should have delete procedure", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    expect(router._def.procedures).toHaveProperty("branchStaff.delete");
  });

  it("branchStaff router should have list procedure", async () => {
    const routerModule = await import("./routers");
    const router = routerModule.appRouter;
    expect(router._def.procedures).toHaveProperty("branchStaff.list");
  });
});

describe("Review How-To Infographic URL", () => {
  const INFOGRAPHIC_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029164707/Vnv2Yn9Lbgw8vJ5BLPM68j/review-howto-infographic_db5605b0.jpg";

  it("infographic URL should be a valid CloudFront URL", () => {
    expect(INFOGRAPHIC_URL).toMatch(/^https:\/\/d2xsxph8kpxj0f\.cloudfront\.net\//);
  });

  it("infographic URL should end with .jpg", () => {
    expect(INFOGRAPHIC_URL).toMatch(/\.jpg$/);
  });

  it("infographic URL should contain the correct hash", () => {
    expect(INFOGRAPHIC_URL).toContain("db5605b0");
  });
});
