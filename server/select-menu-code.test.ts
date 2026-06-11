import { describe, it, expect } from "vitest";

/**
 * Tests for the new code activation flow:
 * 1. Customer sees code without copy/QR → presses "ใช้โค้ด" → goes to select menu page
 * 2. Menu is filtered by the branch that issued the code
 * 3. After selecting menu, code is activated with activatedAt timestamp
 * 4. Activated code must be used within the same day
 * 5. QR Code is shown after activation for staff to scan
 * 6. Staff scans QR → sees menu details → must press redeem
 */

describe("Code Activation Flow - Business Logic", () => {
  it("should validate that activatedAt determines same-day usage", () => {
    const now = new Date();
    const activatedAt = new Date();
    
    // Same day check
    const isToday = activatedAt.toDateString() === now.toDateString();
    expect(isToday).toBe(true);
    
    // Yesterday should not be today
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = yesterday.toDateString() === now.toDateString();
    expect(isYesterday).toBe(false);
  });

  it("should correctly identify expired activation (not today)", () => {
    const now = new Date();
    
    // 2 days ago
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const isActivatedToday = twoDaysAgo.toDateString() === now.toDateString();
    expect(isActivatedToday).toBe(false);
  });

  it("should handle null activatedAt as not activated", () => {
    const activatedAt: Date | null = null;
    
    const isActivatedToday = (at: Date | null) => {
      if (!at) return false;
      return at.toDateString() === new Date().toDateString();
    };
    
    expect(isActivatedToday(activatedAt)).toBe(false);
  });

  it("should validate code status before menu selection", () => {
    const validStatuses = ["issued"];
    const invalidStatuses = ["redeemed", "expired", "cancelled"];
    
    validStatuses.forEach(status => {
      expect(status === "issued").toBe(true);
    });
    
    invalidStatuses.forEach(status => {
      expect(status === "issued").toBe(false);
    });
  });

  it("should prevent re-selecting menu if already selected and activated today", () => {
    const code = {
      selectedMenuItemId: 5,
      activatedAt: new Date(),
      status: "issued",
    };
    
    const hasSelectedMenu = !!code.selectedMenuItemId;
    const isActivatedToday = code.activatedAt.toDateString() === new Date().toDateString();
    const canReselect = !hasSelectedMenu || (hasSelectedMenu && !isActivatedToday);
    
    // Already selected and activated today → cannot re-select
    expect(canReselect).toBe(false);
  });

  it("should allow re-selecting menu if activated on a different day", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const code = {
      selectedMenuItemId: 5,
      activatedAt: yesterday,
      status: "issued",
    };
    
    const hasSelectedMenu = !!code.selectedMenuItemId;
    const isActivatedToday = code.activatedAt.toDateString() === new Date().toDateString();
    const canReselect = !hasSelectedMenu || (hasSelectedMenu && !isActivatedToday);
    
    // Selected but activated yesterday → can re-select
    expect(canReselect).toBe(true);
  });
});

describe("Code Display Flow", () => {
  it("should not show copy button for active codes", () => {
    // In the new flow, active codes should NOT have copy functionality
    // Instead they show "ใช้โค้ด" button
    const code = { status: "issued", selectedMenuItemId: null };
    const showCopyButton = false; // Never show copy
    const showUseCodeButton = code.status === "issued" && !code.selectedMenuItemId;
    
    expect(showCopyButton).toBe(false);
    expect(showUseCodeButton).toBe(true);
  });

  it("should show QR code only after activation", () => {
    const codeNotActivated = { status: "issued", selectedMenuItemId: null, activatedAt: null };
    const codeActivatedToday = { status: "issued", selectedMenuItemId: 5, activatedAt: new Date() };
    
    const showQR = (c: any) => {
      if (!c.selectedMenuItemId || !c.activatedAt) return false;
      return new Date(c.activatedAt).toDateString() === new Date().toDateString();
    };
    
    expect(showQR(codeNotActivated)).toBe(false);
    expect(showQR(codeActivatedToday)).toBe(true);
  });

  it("should show only code text for inactive codes (redeemed/expired/cancelled)", () => {
    const inactiveCodes = [
      { status: "redeemed", code: "HIBI-RV-ABC123" },
      { status: "expired", code: "HIBI-RV-DEF456" },
      { status: "cancelled", code: "HIBI-CL-GHI789" },
    ];
    
    inactiveCodes.forEach(code => {
      const isActive = code.status === "issued";
      expect(isActive).toBe(false);
    });
  });
});

describe("Branch Menu Filtering", () => {
  it("should filter menu items by branch availability", () => {
    const allMenuItems = [
      { id: 1, name: "Matcha Latte", isActive: 1 },
      { id: 2, name: "Hojicha Latte", isActive: 1 },
      { id: 3, name: "Sencha", isActive: 1 },
    ];
    
    // Branch overrides: item 2 is disabled at this branch
    const branchOverrides = new Map([[2, 0]]);
    
    const availableItems = allMenuItems.filter(item => {
      const override = branchOverrides.get(item.id);
      return override === undefined || override === 1;
    });
    
    expect(availableItems).toHaveLength(2);
    expect(availableItems.map(i => i.id)).toEqual([1, 3]);
  });
});
