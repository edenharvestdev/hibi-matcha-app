import { describe, it, expect } from "vitest";

/**
 * Tests for:
 * 1. orderDate field in point_claims schema
 * 2. New staff role system (branch_owner, branch_manager, branch_staff)
 */

describe("orderDate field in point_claims", () => {
  it("schema should include orderDate column", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.pointClaims).toBeDefined();
    // Verify the column exists by checking the schema file content
    const fs = await import("fs");
    const schemaContent = fs.readFileSync("drizzle/schema.ts", "utf-8");
    expect(schemaContent).toContain("orderDate");
    expect(schemaContent).toContain("timestamp");
  });

  it("submitClaim input should accept orderDate field", async () => {
    // Read routers.ts to verify orderDate is in the input schema
    const fs = await import("fs");
    const routersContent = fs.readFileSync("server/routers.ts", "utf-8");
    expect(routersContent).toContain("orderDate: z.string().optional()");
    expect(routersContent).toContain("orderDate: input.orderDate ? new Date(input.orderDate) : null");
  });

  it("ClaimPoints form should include orderDate input", async () => {
    const fs = await import("fs");
    const claimContent = fs.readFileSync("client/src/pages/customer/ClaimPoints.tsx", "utf-8");
    expect(claimContent).toContain("orderDate");
    expect(claimContent).toContain('DatePickerCE');
    expect(claimContent).toContain("วันที่สั่งซื้อ");
    expect(claimContent).toContain("วันที่ที่สั่งซื้อจริง");
  });

  it("Admin and Branch claim detail should display orderDate", async () => {
    const fs = await import("fs");
    const adminContent = fs.readFileSync("client/src/pages/admin/AdminPointClaims.tsx", "utf-8");
    const branchContent = fs.readFileSync("client/src/pages/branch/PointClaimsQueue.tsx", "utf-8");
    
    expect(adminContent).toContain("claimDetail.orderDate");
    expect(adminContent).toContain("วันที่สั่งซื้อ");
    expect(branchContent).toContain("claimDetail.orderDate");
    expect(branchContent).toContain("วันที่สั่งซื้อ");
  });

  it("list cards should show orderDate when available", async () => {
    const fs = await import("fs");
    const adminContent = fs.readFileSync("client/src/pages/admin/AdminPointClaims.tsx", "utf-8");
    const branchContent = fs.readFileSync("client/src/pages/branch/PointClaimsQueue.tsx", "utf-8");
    
    expect(adminContent).toContain("claim.orderDate");
    expect(adminContent).toContain("สั่งซื้อ:");
    expect(branchContent).toContain("claim.orderDate");
    expect(branchContent).toContain("สั่งซื้อ:");
  });
});

describe("New staff role system", () => {
  it("schema should define new roles: branch_owner, branch_manager, branch_staff", async () => {
    const fs = await import("fs");
    const schemaContent = fs.readFileSync("drizzle/schema.ts", "utf-8");
    expect(schemaContent).toContain("branch_owner");
    expect(schemaContent).toContain("branch_manager");
    expect(schemaContent).toContain("branch_staff");
    // Old role should not exist in schema
    expect(schemaContent).not.toContain('"branch_admin"');
  });

  it("shared types should define new roles", async () => {
    const fs = await import("fs");
    const typesContent = fs.readFileSync("shared/types.ts", "utf-8");
    expect(typesContent).toContain("branch_owner");
    expect(typesContent).toContain("branch_manager");
    expect(typesContent).toContain("branch_staff");
  });

  it("staffProcedure should allow all new branch roles", async () => {
    const fs = await import("fs");
    const routersContent = fs.readFileSync("server/routers.ts", "utf-8");
    // staffProcedure should include all new roles
    expect(routersContent).toContain('"branch_manager"');
    expect(routersContent).toContain('"branch_owner"');
    expect(routersContent).toContain('"branch_staff"');
  });

  it("branchAdminProcedure should allow branch_owner, branch_manager, and branch_staff", async () => {
    const fs = await import("fs");
    const routersContent = fs.readFileSync("server/routers.ts", "utf-8");
    // Find branchAdminProcedure definition
    const branchAdminMatch = routersContent.match(/const branchAdminProcedure[\s\S]*?return next/);
    expect(branchAdminMatch).toBeTruthy();
    const branchAdminCode = branchAdminMatch![0];
    expect(branchAdminCode).toContain("branch_owner");
    expect(branchAdminCode).toContain("branch_manager");
    // branch_staff is now included so staff can give points at store
    expect(branchAdminCode).toContain("branch_staff");
  });

  it("StaffManagement UI should show new role options", async () => {
    const fs = await import("fs");
    const staffMgmt = fs.readFileSync("client/src/pages/admin/StaffManagement.tsx", "utf-8");
    expect(staffMgmt).toContain("เจ้าของสาขา");
    expect(staffMgmt).toContain("ผู้จัดการสาขา");
    expect(staffMgmt).toContain("พนักงานสาขา");
    // Old role label should not exist
    expect(staffMgmt).not.toContain("แอดมินสาขา");
  });

  it("CustomerHome should redirect branch roles correctly", async () => {
    const fs = await import("fs");
    const customerHome = fs.readFileSync("client/src/pages/customer/CustomerHome.tsx", "utf-8");
    expect(customerHome).toContain("branch_owner");
    expect(customerHome).toContain("branch_manager");
    expect(customerHome).toContain("branch_staff");
    expect(customerHome).not.toContain("branch_admin");
  });

  it("useHibiAuth hook should handle new roles", async () => {
    const fs = await import("fs");
    const hookContent = fs.readFileSync("client/src/hooks/useHibiAuth.ts", "utf-8");
    expect(hookContent).toContain("branch_owner");
    expect(hookContent).toContain("branch_manager");
    expect(hookContent).toContain("branch_staff");
  });

  it("MobileLayout should display new role labels", async () => {
    const fs = await import("fs");
    const mobileLayout = fs.readFileSync("client/src/components/MobileLayout.tsx", "utf-8");
    expect(mobileLayout).toContain("branch_owner");
    expect(mobileLayout).toContain("branch_manager");
    expect(mobileLayout).toContain("branch_staff");
  });

  it("no production code should reference branch_admin", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    // Check key production files
    const filesToCheck = [
      "server/routers.ts",
      "server/db.ts",
      "drizzle/schema.ts",
      "shared/types.ts",
      "client/src/hooks/useHibiAuth.ts",
      "client/src/components/MobileLayout.tsx",
      "client/src/pages/admin/StaffManagement.tsx",
      "client/src/pages/customer/CustomerHome.tsx",
    ];

    for (const file of filesToCheck) {
      const content = fs.readFileSync(file, "utf-8");
      // Allow in comments but not in actual code strings
      const lines = content.split("\n").filter(l => !l.trim().startsWith("//") && !l.trim().startsWith("*"));
      const codeContent = lines.join("\n");
      expect(codeContent).not.toContain('"branch_admin"');
    }
  });
});
