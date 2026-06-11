import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ADMIN_PAGES_DIR = path.resolve(__dirname, "../client/src/pages/admin");

/**
 * These tests verify that the admin page access control is correctly configured:
 * 1. Operational pages (dashboard, reviews, points, redeem, claims, give-points)
 *    should use `isAdmin` to allow branch_admin, area_manager, and super_admin.
 * 2. Management pages (branches, staff, reports, audit-logs, customers, rewards, announcements)
 *    should redirect to /admin (not /login) when non-super-admin tries to access.
 * 3. No admin page should redirect non-super-admin to /login (which causes infinite loop).
 */

// Pages that should allow isAdmin (branch_admin, area_manager, super_admin)
const ADMIN_ACCESSIBLE_PAGES = [
  "AdminDashboard.tsx",
  "AdminReviewQueue.tsx",
  "AdminReviewDetail.tsx",
  "AdminPointClaims.tsx",
  "AdminCreateClaim.tsx",
  "AdminRedeemCode.tsx",
  "AdminGivePoints.tsx",
];

// Pages that should be super_admin only but redirect to /admin (not /login)
const SUPER_ADMIN_ONLY_PAGES = [
  "BranchManagement.tsx",
  "StaffManagement.tsx",
  "Reports.tsx",
  "AuditLogs.tsx",
  "CustomerDatabase.tsx",
  "AdminRewards.tsx",
  "AdminAnnouncements.tsx",
];

describe("Admin page access control - operational pages use isAdmin", () => {
  ADMIN_ACCESSIBLE_PAGES.forEach((filename) => {
    it(`${filename} should use isAdmin (not isSuperAdmin) for access check`, () => {
      const filePath = path.join(ADMIN_PAGES_DIR, filename);
      const content = fs.readFileSync(filePath, "utf-8");

      // Should destructure isAdmin from useHibiAuth
      expect(content).toContain("isAdmin");

      // Should NOT redirect non-admin to /login based on isSuperAdmin
      expect(content).not.toMatch(/!isSuperAdmin.*setLocation\("\/login"\)/);

      // Should use isAdmin for access guard
      expect(content).toMatch(/!isAdmin.*setLocation\("\/login"\)/);
    });
  });
});

describe("Admin page access control - super_admin pages redirect to /admin not /login", () => {
  SUPER_ADMIN_ONLY_PAGES.forEach((filename) => {
    it(`${filename} should redirect non-super-admin to /admin (not /login)`, () => {
      const filePath = path.join(ADMIN_PAGES_DIR, filename);
      const content = fs.readFileSync(filePath, "utf-8");

      // Should NOT have: !isSuperAdmin -> setLocation("/login")
      // This pattern causes infinite redirect loop for area_manager
      expect(content).not.toMatch(/!isSuperAdmin\)?\s*setLocation\("\/login"\)/);

      // Should redirect to /admin instead
      expect(content).toMatch(/setLocation\("\/admin"\)/);
    });
  });
});

describe("Admin page access control - no infinite redirect loop", () => {
  it("AdminDashboard should allow area_manager and branch_admin (isAdmin check)", () => {
    const filePath = path.join(ADMIN_PAGES_DIR, "AdminDashboard.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Must use isAdmin (which includes branch_admin, area_manager, super_admin)
    expect(content).toContain("isAdmin");
    // Must NOT gate on isSuperAdmin for redirect
    expect(content).not.toMatch(/!isSuperAdmin.*setLocation/);
  });

  it("AdminDashboard should show management menu only for super_admin", () => {
    const filePath = path.join(ADMIN_PAGES_DIR, "AdminDashboard.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Should conditionally show management section
    expect(content).toMatch(/isSuperAdmin.*&&/);
  });

  it("No admin page should redirect logged-in staff to /login based on isSuperAdmin", () => {
    const allAdminFiles = fs.readdirSync(ADMIN_PAGES_DIR).filter(f => f.endsWith(".tsx"));

    allAdminFiles.forEach((filename) => {
      const filePath = path.join(ADMIN_PAGES_DIR, filename);
      const content = fs.readFileSync(filePath, "utf-8");

      // The pattern `!isSuperAdmin) setLocation("/login")` causes infinite loop
      // for area_manager who gets redirected to /admin -> /login -> /admin...
      const hasInfiniteLoopPattern = /!isSuperAdmin\)?\s*(?:{\s*)?setLocation\("\/login"\)/.test(content);
      expect(
        hasInfiniteLoopPattern,
        `${filename} has infinite redirect loop pattern: !isSuperAdmin -> /login`
      ).toBe(false);
    });
  });
});

describe("useHibiAuth hook provides correct role checks", () => {
  it("should export isAdmin that includes branch_owner, branch_manager, area_manager, super_admin", () => {
    const hookPath = path.resolve(__dirname, "../client/src/hooks/useHibiAuth.ts");
    const content = fs.readFileSync(hookPath, "utf-8");

    // adminRoles should include the admin roles (branch_admin was renamed to branch_owner/branch_manager)
    expect(content).toContain("branch_owner");
    expect(content).toContain("branch_manager");
    expect(content).toContain("area_manager");
    expect(content).toContain("super_admin");
    expect(content).toContain("isAdmin");
    expect(content).toContain("isSuperAdmin");
    expect(content).toContain("isStaff");
  });
});

describe("Login redirect logic", () => {
  it("Login.tsx should redirect area_manager to /branch", () => {
    const loginPath = path.resolve(__dirname, "../client/src/pages/Login.tsx");
    const content = fs.readFileSync(loginPath, "utf-8");

    // area_manager is now included in the branch roles array redirect
    expect(content).toMatch(/area_manager.*setLocation\("\/branch"\)/);
  });

  it("StaffLogin.tsx should redirect area_manager to /branch", () => {
    const staffLoginPath = path.resolve(__dirname, "../client/src/pages/StaffLogin.tsx");
    const content = fs.readFileSync(staffLoginPath, "utf-8");

    expect(content).toMatch(/area_manager.*setLocation\("\/branch"\)/);
  });
});
