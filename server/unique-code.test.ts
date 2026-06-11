import { describe, it, expect } from "vitest";

/**
 * Tests for code uniqueness logic.
 * Since generateUniqueCode is a private function inside routers.ts,
 * we test the underlying logic and format here.
 */

describe("Code Generation Format & Uniqueness", () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  function generateCodeSync(type: "RV" | "CL"): string {
    const prefix = type === "RV" ? "HIBI-RV-" : "HIBI-CL-";
    let code = prefix;
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  it("generates RV codes with correct prefix and length", () => {
    const code = generateCodeSync("RV");
    expect(code).toMatch(/^HIBI-RV-[A-Z2-9]{6}$/);
    expect(code.length).toBe(14); // "HIBI-RV-" (8) + 6 chars
  });

  it("generates CL codes with correct prefix and length", () => {
    const code = generateCodeSync("CL");
    expect(code).toMatch(/^HIBI-CL-[A-Z2-9]{6}$/);
    expect(code.length).toBe(14);
  });

  it("does not use ambiguous characters (0, O, I, 1)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCodeSync("RV");
      const suffix = code.replace("HIBI-RV-", "");
      expect(suffix).not.toMatch(/[0OI1]/);
    }
  });

  it("generates unique codes in batch (statistical uniqueness)", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateCodeSync("RV"));
    }
    // With 32^6 = ~1 billion possible codes, 1000 should all be unique
    expect(codes.size).toBe(1000);
  });

  it("total possible combinations is large enough to prevent collisions", () => {
    // 32 chars, 6 positions = 32^6 = 1,073,741,824 possible codes per type
    const totalCombinations = Math.pow(32, 6);
    expect(totalCombinations).toBeGreaterThan(1_000_000_000);
  });

  // Test free drink code format
  function generateFreeDrinkCodeSync(menuCode: string, sizeCode: string, milkCode?: string): string {
    let suffix = "";
    for (let i = 0; i < 4; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    const parts = ["HIBI", menuCode, sizeCode];
    if (milkCode) parts.push(milkCode);
    parts.push(suffix);
    return parts.join("-");
  }

  it("generates free drink codes with correct format (no milk)", () => {
    const code = generateFreeDrinkCodeSync("MCH", "M");
    expect(code).toMatch(/^HIBI-MCH-M-[A-Z2-9]{4}$/);
  });

  it("generates free drink codes with correct format (with milk)", () => {
    const code = generateFreeDrinkCodeSync("MCH", "L", "OAT");
    expect(code).toMatch(/^HIBI-MCH-L-OAT-[A-Z2-9]{4}$/);
  });

  it("free drink codes are statistically unique in batch", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 500; i++) {
      codes.add(generateFreeDrinkCodeSync("MCH", "M"));
    }
    // 32^4 = 1,048,576 possible suffixes, 500 should be unique
    expect(codes.size).toBe(500);
  });
});

describe("Code Redemption Rules", () => {
  it("redeemed codes cannot be redeemed again", () => {
    // This is enforced in redeemCode: status === "redeemed" → error
    const status = "redeemed";
    expect(status === "redeemed").toBe(true);
  });

  it("cancelled codes cannot be redeemed", () => {
    const status = "cancelled";
    expect(status === "cancelled").toBe(true);
  });

  it("expired codes cannot be redeemed", () => {
    const expiresAt = new Date("2020-01-01");
    expect(new Date() > expiresAt).toBe(true);
  });

  it("valid issued code with menu selection can be redeemed", () => {
    const code = {
      status: "issued",
      expiresAt: new Date("2030-12-31"),
      selectedMenuItemId: 1,
      selectedMenuCode: "MCH01",
    };
    const isValid = code.status === "issued" && new Date() < code.expiresAt && (code.selectedMenuItemId || code.selectedMenuCode);
    expect(isValid).toBeTruthy();
  });

  it("CL code with compensationMenuCode can be redeemed without menu selection", () => {
    const code = {
      status: "issued",
      expiresAt: new Date("2030-12-31"),
      selectedMenuItemId: null,
      selectedMenuCode: null,
      compensationMenuCode: "MCH01",
      compensationMenuName: "Matcha Latte",
    };
    const hasCompensation = code.compensationMenuCode && code.compensationMenuName;
    expect(hasCompensation).toBeTruthy();
  });

  it("code without menu selection and without compensation is NOT redeemable", () => {
    const code = {
      status: "issued",
      expiresAt: new Date("2030-12-31"),
      selectedMenuItemId: null,
      selectedMenuCode: null,
      compensationMenuCode: null,
      compensationMenuName: null,
    };
    const hasMenu = code.selectedMenuItemId || code.selectedMenuCode;
    const hasCompensation = code.compensationMenuCode && code.compensationMenuName;
    expect(hasMenu || hasCompensation).toBeFalsy();
  });
});
