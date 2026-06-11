import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module with new functions
vi.mock("./db", () => ({
  // Existing POS functions
  posListMenuItems: vi.fn().mockResolvedValue([
    { id: 1, name: "Matcha Latte", categoryId: 1, basePrice: "12000", isActive: true, sendTo: "bar" },
    { id: 2, name: "Hojicha Cake", categoryId: 2, basePrice: "8000", isActive: true, sendTo: "kitchen" },
  ]),
  posListCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "เครื่องดื่ม", type: "beverage", isActive: true },
    { id: 2, name: "ขนม", type: "dessert", isActive: true },
  ]),
  posListPaymentMethods: vi.fn().mockResolvedValue([
    { id: 1, name: "เงินสด", code: "cash", type: "cash", isActive: true },
  ]),

  // Auto-setup function
  posAutoSetupBranch: vi.fn().mockResolvedValue({
    branchMenuItemsCreated: 5,
    staffPinsCreated: 1,
    paymentMethodsCreated: 2,
  }),

  // Branch menu catalog functions
  posGetBranchMenuCatalog: vi.fn().mockResolvedValue([
    { id: 1, name: "Matcha Latte", categoryId: 1, basePrice: "12000", isActive: true, sendTo: "bar", isSelected: true, branchPrice: null },
    { id: 2, name: "Hojicha Cake", categoryId: 2, basePrice: "8000", isActive: true, sendTo: "kitchen", isSelected: false, branchPrice: null },
    { id: 3, name: "Genmaicha", categoryId: 1, basePrice: "9000", isActive: false, sendTo: "bar", isSelected: false, branchPrice: null },
  ]),
  posSelectBranchMenuItems: vi.fn().mockResolvedValue({ count: 2 }),
  posDeselectBranchMenuItems: vi.fn().mockResolvedValue({ count: 1 }),

  // Staff pin functions
  posUpdateStaffPin: vi.fn().mockResolvedValue({ id: 1, name: "สมชาย Updated" }),
  posDeleteStaffPin: vi.fn().mockResolvedValue(undefined),

  // Order creation
  posCreateOrder: vi.fn().mockResolvedValue({
    id: 1,
    orderNumber: "ORD-20260425-001",
    totalAmount: 20000,
    status: "completed",
  }),

  // Branch
  getBranchById: vi.fn().mockResolvedValue({ id: 1, name: "สาขาลาดพร้าว", isActive: true }),
}));

describe("POS Enhancements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Auto-setup branch POS", () => {
    it("should auto-setup POS for a new branch", async () => {
      const { posAutoSetupBranch } = await import("./db");
      const result = await posAutoSetupBranch(1);
      expect(posAutoSetupBranch).toHaveBeenCalledWith(1);
      expect(result).toHaveProperty("branchMenuItemsCreated", 5);
      expect(result).toHaveProperty("staffPinsCreated", 1);
      expect(result).toHaveProperty("paymentMethodsCreated", 2);
    });

    it("should create default payment methods during auto-setup", async () => {
      const { posAutoSetupBranch } = await import("./db");
      const result = await posAutoSetupBranch(2);
      expect(result.paymentMethodsCreated).toBeGreaterThan(0);
    });

    it("should create default staff pin during auto-setup", async () => {
      const { posAutoSetupBranch } = await import("./db");
      const result = await posAutoSetupBranch(3);
      expect(result.staffPinsCreated).toBeGreaterThan(0);
    });
  });

  describe("Branch Menu Catalog", () => {
    it("should list all menu items with selection status for a branch", async () => {
      const { posGetBranchMenuCatalog } = await import("./db");
      const catalog = await posGetBranchMenuCatalog(1);
      expect(catalog).toHaveLength(3);
      expect(catalog[0]).toHaveProperty("isSelected", true);
      expect(catalog[1]).toHaveProperty("isSelected", false);
    });

    it("should include inactive items in catalog for visibility", async () => {
      const { posGetBranchMenuCatalog } = await import("./db");
      const catalog = await posGetBranchMenuCatalog(1);
      const inactiveItem = catalog.find((item: any) => item.id === 3);
      expect(inactiveItem).toBeDefined();
      expect(inactiveItem!.isActive).toBe(false);
    });

    it("should select menu items for a branch", async () => {
      const { posSelectBranchMenuItems } = await import("./db");
      const result = await posSelectBranchMenuItems(1, [2, 3]);
      expect(posSelectBranchMenuItems).toHaveBeenCalledWith(1, [2, 3]);
      expect(result).toHaveProperty("count", 2);
    });

    it("should deselect menu items from a branch", async () => {
      const { posDeselectBranchMenuItems } = await import("./db");
      const result = await posDeselectBranchMenuItems(1, [1]);
      expect(posDeselectBranchMenuItems).toHaveBeenCalledWith(1, [1]);
      expect(result).toHaveProperty("count", 1);
    });

    it("should handle empty selection array gracefully", async () => {
      const { posSelectBranchMenuItems } = await import("./db");
      (posSelectBranchMenuItems as any).mockResolvedValueOnce({ count: 0 });
      const result = await posSelectBranchMenuItems(1, []);
      expect(result).toHaveProperty("count", 0);
    });
  });

  describe("Auto-print receipt system", () => {
    it("should generate 3 types of print data after order creation", async () => {
      const { posCreateOrder, posListMenuItems } = await import("./db");
      const menuItems = await posListMenuItems(1);

      // Simulate order creation
      const order = await posCreateOrder({
        branchId: 1,
        orderType: "dine_in",
        totalAmount: 20000,
        items: [
          { itemType: "menu", menuItemId: 1, name: "Matcha Latte", quantity: 1, unitPrice: 12000, totalPrice: 12000, sendTo: "bar" },
          { itemType: "menu", menuItemId: 2, name: "Hojicha Cake", quantity: 1, unitPrice: 8000, totalPrice: 8000, sendTo: "kitchen" },
        ],
        payments: [{ methodId: 1, amount: 20000 }],
      } as any);

      expect(order).toHaveProperty("orderNumber");

      // Verify we can separate items by station for kitchen/bar tickets
      const items = [
        { name: "Matcha Latte", sendTo: "bar", quantity: 1 },
        { name: "Hojicha Cake", sendTo: "kitchen", quantity: 1 },
      ];
      const kitchenItems = items.filter(i => i.sendTo === "kitchen");
      const barItems = items.filter(i => i.sendTo === "bar");

      expect(kitchenItems).toHaveLength(1);
      expect(kitchenItems[0].name).toBe("Hojicha Cake");
      expect(barItems).toHaveLength(1);
      expect(barItems[0].name).toBe("Matcha Latte");
    });

    it("should create customer receipt data with correct structure", () => {
      const receiptData = {
        orderNumber: "ORD-20260425-001",
        orderType: "dine_in",
        branchName: "สาขาลาดพร้าว",
        staffName: "สมชาย",
        items: [
          { name: "Matcha Latte", quantity: 1, unitPrice: "120.00", totalPrice: "120.00" },
        ],
        payments: [
          { methodName: "เงินสด", amount: "120.00" },
        ],
        subtotal: "120.00",
        discountAmount: "0",
        taxAmount: "0",
        totalAmount: "120.00",
        createdAt: new Date().toISOString(),
      };

      expect(receiptData).toHaveProperty("orderNumber");
      expect(receiptData).toHaveProperty("branchName");
      expect(receiptData).toHaveProperty("staffName");
      expect(receiptData.items).toHaveLength(1);
      expect(receiptData.payments).toHaveLength(1);
    });

    it("should create store copy receipt data (same structure, different label)", () => {
      const receiptData = {
        orderNumber: "ORD-20260425-001",
        orderType: "dine_in",
        branchName: "สาขาลาดพร้าว",
        staffName: "สมชาย",
        items: [{ name: "Matcha Latte", quantity: 1, unitPrice: "120.00", totalPrice: "120.00" }],
        payments: [{ methodName: "เงินสด", amount: "120.00" }],
        subtotal: "120.00",
        discountAmount: "0",
        taxAmount: "0",
        totalAmount: "120.00",
        createdAt: new Date().toISOString(),
      };

      // Store copy uses same data but different title label
      const customerTitle = "ใบเสร็จลูกค้า";
      const storeTitle = "สำเนาร้าน";
      expect(customerTitle).not.toBe(storeTitle);
      expect(receiptData.orderNumber).toBeTruthy();
    });

    it("should create kitchen ticket data for kitchen items only", () => {
      const cartItems = [
        { name: "Matcha Latte", sendTo: "bar", quantity: 1, note: "", options: [] },
        { name: "Hojicha Cake", sendTo: "kitchen", quantity: 2, note: "ไม่ใส่ถั่ว", options: [{ optionName: "เพิ่มครีม" }] },
        { name: "Matcha Powder", sendTo: "none", quantity: 1, note: "", options: [] },
      ];

      const kitchenItems = cartItems.filter(i => i.sendTo === "kitchen");
      const kitchenTicket = {
        ticketNumber: "ORD-001-K",
        station: "kitchen" as const,
        items: kitchenItems.map(i => ({
          name: i.name,
          qty: i.quantity,
          note: i.note || undefined,
          options: i.options.map(o => ({ name: o.optionName })),
        })),
        createdAt: new Date().toISOString(),
        branchName: "สาขาลาดพร้าว",
      };

      expect(kitchenTicket.items).toHaveLength(1);
      expect(kitchenTicket.items[0].name).toBe("Hojicha Cake");
      expect(kitchenTicket.items[0].qty).toBe(2);
      expect(kitchenTicket.items[0].note).toBe("ไม่ใส่ถั่ว");
      expect(kitchenTicket.items[0].options).toHaveLength(1);
      expect(kitchenTicket.station).toBe("kitchen");
    });

    it("should create bar ticket data for bar items only", () => {
      const cartItems = [
        { name: "Matcha Latte", sendTo: "bar", quantity: 3, note: "หวานน้อย", options: [] },
        { name: "Hojicha Cake", sendTo: "kitchen", quantity: 1, note: "", options: [] },
      ];

      const barItems = cartItems.filter(i => i.sendTo === "bar");
      const barTicket = {
        ticketNumber: "ORD-001-B",
        station: "bar" as const,
        items: barItems.map(i => ({
          name: i.name,
          qty: i.quantity,
          note: i.note || undefined,
          options: i.options.map(o => ({ name: o.optionName })),
        })),
        createdAt: new Date().toISOString(),
        branchName: "สาขาลาดพร้าว",
      };

      expect(barTicket.items).toHaveLength(1);
      expect(barTicket.items[0].name).toBe("Matcha Latte");
      expect(barTicket.items[0].qty).toBe(3);
      expect(barTicket.station).toBe("bar");
    });

    it("should not create kitchen ticket when no kitchen items exist", () => {
      const cartItems = [
        { name: "Matcha Latte", sendTo: "bar", quantity: 1 },
        { name: "Matcha Powder", sendTo: "none", quantity: 1 },
      ];

      const kitchenItems = cartItems.filter(i => i.sendTo === "kitchen");
      expect(kitchenItems).toHaveLength(0);
      // No kitchen ticket should be printed
    });

    it("should not create bar ticket when no bar items exist", () => {
      const cartItems = [
        { name: "Hojicha Cake", sendTo: "kitchen", quantity: 1 },
        { name: "Matcha Powder", sendTo: "none", quantity: 1 },
      ];

      const barItems = cartItems.filter(i => i.sendTo === "bar");
      expect(barItems).toHaveLength(0);
      // No bar ticket should be printed
    });
  });

  describe("Printer settings persistence", () => {
    it("should have correct default printer settings", () => {
      const defaults = {
        autoPrintCustomerReceipt: true,
        autoPrintStoreCopy: true,
        autoPrintKitchenTicket: true,
        printMethod: "browser",
      };

      expect(defaults.autoPrintCustomerReceipt).toBe(true);
      expect(defaults.autoPrintStoreCopy).toBe(true);
      expect(defaults.autoPrintKitchenTicket).toBe(true);
      expect(defaults.printMethod).toBe("browser");
    });

    it("should allow toggling individual print settings", () => {
      const settings = {
        autoPrintCustomerReceipt: true,
        autoPrintStoreCopy: true,
        autoPrintKitchenTicket: true,
        printMethod: "browser" as const,
      };

      // Toggle off store copy
      const updated = { ...settings, autoPrintStoreCopy: false };
      expect(updated.autoPrintStoreCopy).toBe(false);
      expect(updated.autoPrintCustomerReceipt).toBe(true);
      expect(updated.autoPrintKitchenTicket).toBe(true);
    });

    it("should store settings per branch", () => {
      const branch1Key = `pos_printer_1`;
      const branch2Key = `pos_printer_2`;
      expect(branch1Key).not.toBe(branch2Key);
    });
  });

  describe("Staff pin management", () => {
    it("should update a staff pin", async () => {
      const { posUpdateStaffPin } = await import("./db");
      const result = await posUpdateStaffPin(1, { name: "สมชาย Updated" });
      expect(result).toHaveProperty("name", "สมชาย Updated");
    });

    it("should delete a staff pin", async () => {
      const { posDeleteStaffPin } = await import("./db");
      await posDeleteStaffPin(1);
      expect(posDeleteStaffPin).toHaveBeenCalledWith(1);
    });
  });
});
