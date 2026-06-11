import { describe, it, expect } from "vitest";
import { DEFAULT_ROLE_PERMISSIONS, ALL_PERMISSIONS } from "./db";

describe("Branch Staff Management - Role Permissions", () => {
  it("should have branch_owner with manage_staff permission", () => {
    const ownerPerms = DEFAULT_ROLE_PERMISSIONS["branch_owner"];
    expect(ownerPerms).toBeDefined();
    expect(ownerPerms).toContain("manage_staff");
  });

  it("should have branch_manager without manage_staff permission", () => {
    const managerPerms = DEFAULT_ROLE_PERMISSIONS["branch_manager"];
    expect(managerPerms).toBeDefined();
    expect(managerPerms).not.toContain("manage_staff");
  });

  it("should have branch_staff with limited permissions", () => {
    const staffPerms = DEFAULT_ROLE_PERMISSIONS["branch_staff"];
    expect(staffPerms).toBeDefined();
    expect(staffPerms.length).toBeLessThan(DEFAULT_ROLE_PERMISSIONS["branch_manager"].length);
  });

  it("should have super_admin with all permissions", () => {
    const adminPerms = DEFAULT_ROLE_PERMISSIONS["super_admin"];
    expect(adminPerms).toBeDefined();
    expect(adminPerms).toEqual([...ALL_PERMISSIONS]);
  });

  it("branch_owner should have more permissions than branch_manager", () => {
    const ownerPerms = DEFAULT_ROLE_PERMISSIONS["branch_owner"];
    const managerPerms = DEFAULT_ROLE_PERMISSIONS["branch_manager"];
    expect(ownerPerms.length).toBeGreaterThan(managerPerms.length);
  });

  it("branch_manager should have more permissions than branch_staff", () => {
    const managerPerms = DEFAULT_ROLE_PERMISSIONS["branch_manager"];
    const staffPerms = DEFAULT_ROLE_PERMISSIONS["branch_staff"];
    expect(managerPerms.length).toBeGreaterThan(staffPerms.length);
  });
});

describe("Branch Staff Management - Permission Subsets", () => {
  const branchAssignablePermissions = ["approve_reviews", "approve_points", "manage_issues", "view_reports", "view_customers"];

  it("branch owner assignable permissions should be a subset of ALL_PERMISSIONS", () => {
    branchAssignablePermissions.forEach(perm => {
      expect(ALL_PERMISSIONS).toContain(perm);
    });
  });

  it("branch owner should not be able to assign manage_branches or manage_staff to sub-staff", () => {
    expect(branchAssignablePermissions).not.toContain("manage_branches");
    expect(branchAssignablePermissions).not.toContain("manage_staff");
  });

  it("branch_staff default permissions should only include approve_points", () => {
    const staffPerms = DEFAULT_ROLE_PERMISSIONS["branch_staff"];
    expect(staffPerms).toEqual(["approve_points"]);
  });

  it("branch_manager default permissions should include approve_reviews and approve_points", () => {
    const managerPerms = DEFAULT_ROLE_PERMISSIONS["branch_manager"];
    expect(managerPerms).toContain("approve_reviews");
    expect(managerPerms).toContain("approve_points");
  });
});

describe("Role Hierarchy Validation", () => {
  const branchRoles = ["branch_owner", "branch_manager", "branch_staff"];
  const adminRoles = ["super_admin", "area_manager", "support_staff"];

  it("all branch roles should have default permissions defined", () => {
    branchRoles.forEach(role => {
      expect(DEFAULT_ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(DEFAULT_ROLE_PERMISSIONS[role])).toBe(true);
    });
  });

  it("all admin roles should have default permissions defined", () => {
    adminRoles.forEach(role => {
      expect(DEFAULT_ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(DEFAULT_ROLE_PERMISSIONS[role])).toBe(true);
    });
  });

  it("branch_owner permissions should include view_reports", () => {
    expect(DEFAULT_ROLE_PERMISSIONS["branch_owner"]).toContain("view_reports");
  });

  it("branch_owner permissions should include view_customers", () => {
    expect(DEFAULT_ROLE_PERMISSIONS["branch_owner"]).toContain("view_customers");
  });

  it("branch_owner permissions should include manage_rewards", () => {
    expect(DEFAULT_ROLE_PERMISSIONS["branch_owner"]).toContain("manage_rewards");
  });
});
