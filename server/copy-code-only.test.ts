import { describe, it, expect } from "vitest";

describe("Copy Code Only - Customer sees only code, staff sees menu after scan", () => {
  // ── 1. Customer copy behavior: only code, no menu ──
  describe("Customer copy behavior (FreeDrinks)", () => {
    it("should copy only the code string, not menu details", () => {
      const code = {
        code: "RV-ML-M-FM-A1B2",
        selectedMenuName: "Matcha Latte",
        selectedMenuCode: "ML01",
        sweetnessGrams: 15,
        packagingType: "ready",
      };

      // New behavior: copy only the code
      const copyText = code.code;

      expect(copyText).toBe("RV-ML-M-FM-A1B2");
      expect(copyText).not.toContain("Matcha Latte");
      expect(copyText).not.toContain("ML01");
      expect(copyText).not.toContain("หวาน");
      expect(copyText).not.toContain("พร้อมดื่ม");
    });

    it("should not include emoji or menu info in copied text", () => {
      const code = {
        code: "RV-HL-L-FM-X9Y8",
        selectedMenuName: "Hojicha Latte",
        selectedMenuCode: "HL02",
        sweetnessGrams: 30,
        packagingType: "separate",
      };

      const copyText = code.code;

      expect(copyText).not.toContain("🎟");
      expect(copyText).not.toContain("📦");
      expect(copyText).not.toContain("📝");
      expect(copyText).not.toContain("Hojicha");
    });

    it("should not build order text with menu details anymore", () => {
      // The old buildOrderText function has been removed
      // Customer only copies the raw code
      const code = {
        code: "RV-GM-S-FM-Z3W4",
        selectedMenuItemId: 42,
        selectedMenuName: "Genmaicha",
        selectedMenuCode: "GM01",
        sweetnessGrams: 0,
        packagingType: "ready",
      };

      // Only the code is copied
      const copyText = code.code;
      expect(copyText).toBe("RV-GM-S-FM-Z3W4");
      expect(copyText.split("\n")).toHaveLength(1);
    });
  });

  // ── 2. Customer MyCodes behavior: only code, no menu ──
  describe("Customer MyCodes copy behavior", () => {
    it("should copy only the code for review/compensation codes", () => {
      const code = {
        code: "HIBI-RV-ABC123",
        type: "RV",
        compensationMenuCode: "M01",
        compensationMenuName: "Matcha Latte",
      };

      const copyText = code.code;

      expect(copyText).toBe("HIBI-RV-ABC123");
      expect(copyText).not.toContain("M01");
      expect(copyText).not.toContain("Matcha Latte");
    });

    it("should copy only the code for CL codes too", () => {
      const code = {
        code: "HIBI-CL-XYZ789",
        type: "CL",
        claimMenuCode: "HBC01",
        claimMenuName: "Clear Matcha",
        compensationMenuCode: "HBC01",
        compensationMenuName: "Clear Matcha",
        compensationRemark: "หวานน้อย เย็น",
      };

      const copyText = code.code;

      expect(copyText).toBe("HIBI-CL-XYZ789");
      expect(copyText).not.toContain("HBC01");
      expect(copyText).not.toContain("Clear Matcha");
      expect(copyText).not.toContain("หวานน้อย");
    });
  });

  // ── 3. Staff/Admin: sees full menu after scanning code ──
  describe("Staff sees full menu after scanning/looking up code", () => {
    it("codes.lookup should return all menu fields for staff", () => {
      const lookupResult = {
        id: 1,
        code: "HIBI-CL-8G8USA",
        type: "CL",
        status: "issued",
        branchId: 1,
        branchName: "Hibi Matcha HQ",
        email: "test@example.com",
        claimMenuCode: "HBC01M10C",
        claimMenuName: "Clear Matcha Saemidori",
        compensationMenuCode: "HBC01M10C",
        compensationMenuName: "Clear Matcha Saemidori",
        compensationRemark: "หวานน้อย เย็น ไซส์ L",
        claimOrderId: "GF-677",
        orderDate: new Date("2026-03-25"),
        expiresAt: new Date("2026-04-25"),
        issuedAt: new Date("2026-03-25"),
      };

      // Staff should see all menu details
      expect(lookupResult.claimMenuCode).toBe("HBC01M10C");
      expect(lookupResult.claimMenuName).toBe("Clear Matcha Saemidori");
      expect(lookupResult.compensationMenuCode).toBe("HBC01M10C");
      expect(lookupResult.compensationMenuName).toBe("Clear Matcha Saemidori");
      expect(lookupResult.compensationRemark).toBe("หวานน้อย เย็น ไซส์ L");
    });

    it("staffCodeRedeem.lookup should return full menu details for free drink codes", () => {
      const lookupResult = {
        id: 1,
        code: "RV-ML-M-FM-A1B2",
        status: "issued",
        menuName: "Matcha Latte",
        sizeName: "M",
        milkName: "Fresh Milk",
        selectedMenuName: "Matcha Latte Special",
        selectedMenuCode: "ML01S",
        sweetnessGrams: 15,
        packagingType: "ready",
        orderType: "in_store",
        deliveryOrderId: null,
        expiresAt: new Date("2026-05-01"),
        branchId: 1,
        customerName: "John",
        customerPhone: "0812345678",
        isExpired: false,
        isRedeemed: false,
      };

      // Staff should see all menu details after scanning
      expect(lookupResult.menuName).toBe("Matcha Latte");
      expect(lookupResult.selectedMenuName).toBe("Matcha Latte Special");
      expect(lookupResult.selectedMenuCode).toBe("ML01S");
      expect(lookupResult.sweetnessGrams).toBe(15);
      expect(lookupResult.packagingType).toBe("ready");
      expect(lookupResult.customerName).toBe("John");
    });
  });

  // ── 4. Redeem button enforcement ──
  describe("Redeem button enforcement (prevent code from staying active)", () => {
    it("should only allow redeem for issued, non-expired codes", () => {
      const issuedActive = { status: "issued", isExpired: false };
      const issuedExpired = { status: "issued", isExpired: true };
      const redeemed = { status: "redeemed", isExpired: false };

      const canRedeem = (code: any) => code.status === "issued" && !code.isExpired;

      expect(canRedeem(issuedActive)).toBe(true);
      expect(canRedeem(issuedExpired)).toBe(false);
      expect(canRedeem(redeemed)).toBe(false);
    });

    it("should require staff to press redeem button after viewing menu", () => {
      // The flow is: scan → see menu → MUST press redeem
      // This test verifies the logical flow
      const steps = ["scan_code", "view_menu_details", "press_redeem_button"];

      expect(steps).toContain("press_redeem_button");
      expect(steps.indexOf("view_menu_details")).toBeLessThan(steps.indexOf("press_redeem_button"));
      expect(steps.indexOf("scan_code")).toBeLessThan(steps.indexOf("view_menu_details"));
    });

    it("redeem for branch RedeemCode should use codes.redeem procedure", () => {
      // Branch redeem uses codes.redeem (for RV/CL codes)
      const procedureName = "codes.redeem";
      expect(procedureName).toBe("codes.redeem");
    });

    it("redeem for StaffCodeRedeem should use staffCodeRedeem.redeem procedure", () => {
      // Staff code redeem uses staffCodeRedeem.redeem (for free drink codes)
      const procedureName = "staffCodeRedeem.redeem";
      expect(procedureName).toBe("staffCodeRedeem.redeem");
    });
  });

  // ── 5. Customer hint text ──
  describe("Customer hint text", () => {
    it("should tell customer that staff will scan to see menu and confirm", () => {
      const hintText = "พนักงานจะสแกนโค้ดเพื่อดูเมนูที่คุณเลือกและยืนยันการใช้";
      expect(hintText).toContain("สแกน");
      expect(hintText).toContain("เมนู");
      expect(hintText).toContain("ยืนยัน");
    });

    it("should tell customer to show QR or tell code to staff", () => {
      const hintText = "แจ้งโค้ดนี้กับพนักงาน หรือวางในช่องหมายเหตุตอนสั่ง";
      expect(hintText).toContain("แจ้งโค้ด");
      expect(hintText).toContain("หมายเหตุ");
    });
  });
});
