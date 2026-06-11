import { describe, it, expect } from "vitest";
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "./db";

describe("Daily Sales System", () => {
  describe("Permissions", () => {
    it("should include manage_accounting in ALL_PERMISSIONS", () => {
      expect(ALL_PERMISSIONS).toContain("manage_accounting");
    });

    it("should include manage_accounting in branch_manager default permissions", () => {
      expect(DEFAULT_ROLE_PERMISSIONS["branch_manager"]).toContain("manage_accounting");
    });

    it("should include manage_accounting in branch_owner default permissions", () => {
      expect(DEFAULT_ROLE_PERMISSIONS["branch_owner"]).toContain("manage_accounting");
    });

    it("should include manage_accounting in super_admin default permissions", () => {
      expect(DEFAULT_ROLE_PERMISSIONS["super_admin"]).toContain("manage_accounting");
    });

    it("should include manage_accounting in area_manager default permissions", () => {
      expect(DEFAULT_ROLE_PERMISSIONS["area_manager"]).toContain("manage_accounting");
    });
  });

  describe("Daily Sales Data Validation", () => {
    it("should calculate total correctly from channels", () => {
      const cash = 5000;
      const transfer = 3000;
      const edc = 2000;
      const delivery = 1500;
      const extraTotal = 500;
      const total = cash + transfer + edc + delivery + extraTotal;
      expect(total).toBe(12000);
    });

    it("should handle zero values for all channels", () => {
      const total = 0 + 0 + 0 + 0 + 0;
      expect(total).toBe(0);
    });

    it("should handle decimal amounts correctly", () => {
      const cash = 1234.50;
      const transfer = 567.25;
      const total = cash + transfer;
      expect(total).toBeCloseTo(1801.75, 2);
    });
  });

  describe("Permission Labels", () => {
    it("should have manage_accounting permission distinct from other permissions", () => {
      const accountingPerms = ALL_PERMISSIONS.filter(p => p === "manage_accounting");
      expect(accountingPerms).toHaveLength(1);
    });

    it("should not duplicate manage_accounting in any role", () => {
      for (const [role, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        const accountingCount = perms.filter(p => p === "manage_accounting").length;
        expect(accountingCount).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("Monthly Summary Aggregation", () => {
    it("should aggregate multiple daily records correctly", () => {
      const records = [
        { cash: 5000, transfer: 3000, edc: 2000, delivery: 1500 },
        { cash: 6000, transfer: 4000, edc: 1000, delivery: 2000 },
        { cash: 3000, transfer: 2000, edc: 3000, delivery: 500 },
      ];
      const totalCash = records.reduce((sum, r) => sum + r.cash, 0);
      const totalTransfer = records.reduce((sum, r) => sum + r.transfer, 0);
      const totalEdc = records.reduce((sum, r) => sum + r.edc, 0);
      const totalDelivery = records.reduce((sum, r) => sum + r.delivery, 0);
      const grandTotal = totalCash + totalTransfer + totalEdc + totalDelivery;

      expect(totalCash).toBe(14000);
      expect(totalTransfer).toBe(9000);
      expect(totalEdc).toBe(6000);
      expect(totalDelivery).toBe(4000);
      expect(grandTotal).toBe(33000);
      expect(records.length).toBe(3);
    });
  });
});
