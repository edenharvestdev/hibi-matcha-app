import { describe, it, expect } from "vitest";

/**
 * Test: Verify that code lookup/redeem procedures use staffProcedure (not branchAdminProcedure)
 * This ensures branch_staff can search and redeem codes.
 */
describe("Staff Code Access - Procedure Verification", () => {
  // Read the routers.ts source to verify procedure types
  const fs = require("fs");
  const routersSource = fs.readFileSync("./server/routers.ts", "utf-8");

  it("codes.lookup should use staffProcedure", () => {
    // Find the codes router section and check lookup uses staffProcedure
    const lookupMatch = routersSource.match(/lookup:\s*(staffProcedure|branchAdminProcedure)\.input/);
    expect(lookupMatch).toBeTruthy();
    expect(lookupMatch![1]).toBe("staffProcedure");
  });

  it("codes.redeem should use staffProcedure", () => {
    // The first redeem in codes router
    const codesSection = routersSource.split("codes: router({")[1]?.split("branchCodes:")[0];
    expect(codesSection).toBeTruthy();
    const redeemMatch = codesSection!.match(/redeem:\s*(staffProcedure|branchAdminProcedure)\.input/);
    expect(redeemMatch).toBeTruthy();
    expect(redeemMatch![1]).toBe("staffProcedure");
  });

  it("staffCodeRedeem.lookup should use staffProcedure", () => {
    const staffCodeSection = routersSource.split("staffCodeRedeem: router({")[1]?.split("}),")[0];
    expect(staffCodeSection).toBeTruthy();
    const lookupMatch = staffCodeSection!.match(/lookup:\s*(staffProcedure|branchAdminProcedure)\.input/);
    expect(lookupMatch).toBeTruthy();
    expect(lookupMatch![1]).toBe("staffProcedure");
  });

  it("staffCodeRedeem.redeem should use staffProcedure", () => {
    const staffCodeSection = routersSource.split("staffCodeRedeem: router({")[1];
    expect(staffCodeSection).toBeTruthy();
    const redeemMatch = staffCodeSection!.match(/redeem:\s*(staffProcedure|branchAdminProcedure)\.input/);
    expect(redeemMatch).toBeTruthy();
    expect(redeemMatch![1]).toBe("staffProcedure");
  });

  it("freeDrinkCodes.staffRedeem should use staffProcedure", () => {
    const match = routersSource.match(/staffRedeem:\s*(staffProcedure|branchAdminProcedure)\.input/);
    expect(match).toBeTruthy();
    expect(match![1]).toBe("staffProcedure");
  });

  it("rewards.useRedemption should use staffProcedure", () => {
    const match = routersSource.match(/useRedemption:\s*(staffProcedure|branchAdminProcedure)\.input/);
    expect(match).toBeTruthy();
    expect(match![1]).toBe("staffProcedure");
  });

  it("rewards.lookupRedemption should use staffProcedure", () => {
    const match = routersSource.match(/lookupRedemption:\s*(staffProcedure|branchAdminProcedure)\.input/);
    expect(match).toBeTruthy();
    expect(match![1]).toBe("staffProcedure");
  });

  it("staffProcedure should include branch_staff in allowed roles", () => {
    const staffProcMatch = routersSource.match(/const staffProcedure[\s\S]*?staffRoles\s*=\s*\[([\s\S]*?)\]/);
    expect(staffProcMatch).toBeTruthy();
    expect(staffProcMatch![1]).toContain("branch_staff");
  });

  it("branchAdminProcedure should include branch_staff for give points access", () => {
    const adminProcMatch = routersSource.match(/const branchAdminProcedure[\s\S]*?allowedRoles\s*=\s*\[([\s\S]*?)\]/);
    expect(adminProcMatch).toBeTruthy();
    expect(adminProcMatch![1]).toContain("branch_staff");
  });
});
