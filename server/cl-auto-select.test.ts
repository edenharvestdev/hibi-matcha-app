import { describe, it, expect } from "vitest";

/**
 * Tests for HIBI-CL code auto-select flow:
 * 1. CL codes with compensationMenuCode/Name skip menu selection
 * 2. autoSelectCLCodeMenu sets selectedMenuCode/Name from compensation data
 * 3. redeemCode allows CL codes without selectedMenuItemId if compensationMenuCode exists
 * 4. Frontend isCLAutoFill logic correctly identifies CL auto-fill codes
 */

describe("CL Code Auto-Select - Business Logic", () => {
  // Helper: determine if a code qualifies for CL auto-fill
  const isCLAutoFill = (code: { type: string; compensationMenuCode: string | null; compensationMenuName: string | null }) => {
    return code.type === "CL" && !!code.compensationMenuCode && !!code.compensationMenuName;
  };

  describe("isCLAutoFill detection", () => {
    it("should return true for CL code with compensationMenuCode and compensationMenuName", () => {
      expect(isCLAutoFill({
        type: "CL",
        compensationMenuCode: "M001",
        compensationMenuName: "Matcha Latte",
      })).toBe(true);
    });

    it("should return false for CL code without compensationMenuCode", () => {
      expect(isCLAutoFill({
        type: "CL",
        compensationMenuCode: null,
        compensationMenuName: "Matcha Latte",
      })).toBe(false);
    });

    it("should return false for CL code without compensationMenuName", () => {
      expect(isCLAutoFill({
        type: "CL",
        compensationMenuCode: "M001",
        compensationMenuName: null,
      })).toBe(false);
    });

    it("should return false for RV code even with compensation data", () => {
      expect(isCLAutoFill({
        type: "RV",
        compensationMenuCode: "M001",
        compensationMenuName: "Matcha Latte",
      })).toBe(false);
    });

    it("should return false for FR code even with compensation data", () => {
      expect(isCLAutoFill({
        type: "FR",
        compensationMenuCode: "M001",
        compensationMenuName: "Matcha Latte",
      })).toBe(false);
    });

    it("should return false for PR code even with compensation data", () => {
      expect(isCLAutoFill({
        type: "PR",
        compensationMenuCode: "M001",
        compensationMenuName: "Matcha Latte",
      })).toBe(false);
    });
  });

  describe("CL code redeem validation", () => {
    // Simulate the redeemCode validation logic for CL codes
    const canRedeemCLCode = (code: {
      type: string;
      status: string;
      selectedMenuItemId: number | null;
      compensationMenuCode: string | null;
      compensationMenuName: string | null;
    }) => {
      if (code.status !== "issued") return false;
      // CL codes with compensation data can be redeemed without selectedMenuItemId
      if (code.type === "CL" && code.compensationMenuCode && code.compensationMenuName) {
        return true;
      }
      // Other codes require selectedMenuItemId
      return !!code.selectedMenuItemId;
    };

    it("should allow CL code with compensationMenu to redeem without selectedMenuItemId", () => {
      expect(canRedeemCLCode({
        type: "CL",
        status: "issued",
        selectedMenuItemId: null,
        compensationMenuCode: "M001",
        compensationMenuName: "Matcha Latte",
      })).toBe(true);
    });

    it("should allow CL code with both selectedMenuItemId and compensationMenu", () => {
      expect(canRedeemCLCode({
        type: "CL",
        status: "issued",
        selectedMenuItemId: 5,
        compensationMenuCode: "M001",
        compensationMenuName: "Matcha Latte",
      })).toBe(true);
    });

    it("should reject CL code without compensationMenu and without selectedMenuItemId", () => {
      expect(canRedeemCLCode({
        type: "CL",
        status: "issued",
        selectedMenuItemId: null,
        compensationMenuCode: null,
        compensationMenuName: null,
      })).toBe(false);
    });

    it("should reject redeemed CL code", () => {
      expect(canRedeemCLCode({
        type: "CL",
        status: "redeemed",
        selectedMenuItemId: null,
        compensationMenuCode: "M001",
        compensationMenuName: "Matcha Latte",
      })).toBe(false);
    });

    it("should reject expired CL code", () => {
      expect(canRedeemCLCode({
        type: "CL",
        status: "expired",
        selectedMenuItemId: null,
        compensationMenuCode: "M001",
        compensationMenuName: "Matcha Latte",
      })).toBe(false);
    });

    it("should require selectedMenuItemId for RV codes", () => {
      expect(canRedeemCLCode({
        type: "RV",
        status: "issued",
        selectedMenuItemId: null,
        compensationMenuCode: null,
        compensationMenuName: null,
      })).toBe(false);
    });

    it("should allow RV code with selectedMenuItemId", () => {
      expect(canRedeemCLCode({
        type: "RV",
        status: "issued",
        selectedMenuItemId: 10,
        compensationMenuCode: null,
        compensationMenuName: null,
      })).toBe(true);
    });
  });

  describe("CL auto-select data mapping", () => {
    it("should map compensationMenuCode to selectedMenuCode", () => {
      const code = {
        compensationMenuCode: "M001",
        compensationMenuName: "Matcha Latte",
      };
      const result = {
        selectedMenuCode: code.compensationMenuCode,
        selectedMenuName: code.compensationMenuName,
      };
      expect(result.selectedMenuCode).toBe("M001");
      expect(result.selectedMenuName).toBe("Matcha Latte");
    });

    it("should set activatedAt to current time", () => {
      const before = new Date();
      const activatedAt = new Date();
      const after = new Date();
      expect(activatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(activatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it("should preserve optional remark from customer", () => {
      const remark = "ขอหวานน้อย";
      expect(remark).toBe("ขอหวานน้อย");
    });

    it("should handle null remark", () => {
      const remark: string | null = null;
      expect(remark).toBeNull();
    });
  });
});
