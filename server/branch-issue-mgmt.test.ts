import { describe, it, expect } from "vitest";

// ── Test: Branch Order Issue Management + Auto-Resolve ──

describe("Branch Order Issue Management", () => {
  // Simulate issue status transitions
  type IssueStatus = "open" | "acknowledged" | "in_progress" | "resolved" | "escalated" | "closed";

  interface OrderIssue {
    id: number;
    status: IssueStatus;
    branchId: number;
    category: string;
    deliveryApp: string;
    orderId?: string;
    orderDetails?: string;
    description: string;
    customerName?: string;
    customerPhone?: string;
    customerId?: number;
    adminNote?: string;
    resolution?: string;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    slaResponseDeadline: Date;
    slaResolutionDeadline: Date;
    createdAt: Date;
  }

  function acknowledgeIssue(issue: OrderIssue): OrderIssue {
    if (issue.status !== "open") throw new Error("Can only acknowledge open issues");
    return { ...issue, status: "acknowledged", acknowledgedAt: new Date() };
  }

  function resolveIssue(issue: OrderIssue, resolution: string): OrderIssue {
    if (!["acknowledged", "in_progress"].includes(issue.status)) throw new Error("Can only resolve acknowledged/in_progress issues");
    if (!resolution.trim()) throw new Error("Resolution is required");
    return { ...issue, status: "resolved", resolution, resolvedAt: new Date() };
  }

  function autoResolveFromComp(issue: OrderIssue, compCode: string, compMenu: string): OrderIssue {
    if (["resolved", "closed"].includes(issue.status)) return issue; // Already resolved, skip
    const resolution = `ออกโค้ดชดเชย ${compCode} (${compMenu}) ให้ลูกค้าแล้ว`;
    return { ...issue, status: "resolved", resolution, resolvedAt: new Date() };
  }

  const now = new Date();
  const slaResponse = new Date(now.getTime() + 24 * 3600000);
  const slaResolution = new Date(now.getTime() + 48 * 3600000);

  const baseIssue: OrderIssue = {
    id: 1,
    status: "open",
    branchId: 1,
    category: "wrong_order",
    deliveryApp: "shopee",
    orderId: "SPE-123456",
    orderDetails: "Matcha Latte เย็น 1 แก้ว",
    description: "ได้เมนูผิดจากที่สั่ง",
    customerName: "สมชาย",
    customerPhone: "0812345678",
    customerId: 10,
    slaResponseDeadline: slaResponse,
    slaResolutionDeadline: slaResolution,
    createdAt: now,
  };

  // ── Acknowledge ──
  it("acknowledges an open issue", () => {
    const result = acknowledgeIssue(baseIssue);
    expect(result.status).toBe("acknowledged");
    expect(result.acknowledgedAt).toBeDefined();
  });

  it("throws when acknowledging non-open issue", () => {
    const acked = { ...baseIssue, status: "acknowledged" as IssueStatus };
    expect(() => acknowledgeIssue(acked)).toThrow("Can only acknowledge open issues");
  });

  // ── Resolve ──
  it("resolves an acknowledged issue with resolution text", () => {
    const acked = acknowledgeIssue(baseIssue);
    const resolved = resolveIssue(acked, "ส่งออเดอร์ใหม่ให้ลูกค้า");
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolution).toBe("ส่งออเดอร์ใหม่ให้ลูกค้า");
    expect(resolved.resolvedAt).toBeDefined();
  });

  it("throws when resolving with empty resolution", () => {
    const acked = acknowledgeIssue(baseIssue);
    expect(() => resolveIssue(acked, "")).toThrow("Resolution is required");
  });

  it("throws when resolving an open issue directly", () => {
    expect(() => resolveIssue(baseIssue, "fixed")).toThrow("Can only resolve acknowledged/in_progress issues");
  });

  // ── Auto-resolve from compensation code ──
  it("auto-resolves issue when compensation code is created", () => {
    const result = autoResolveFromComp(baseIssue, "CL-ABC123", "Matcha Latte");
    expect(result.status).toBe("resolved");
    expect(result.resolution).toContain("CL-ABC123");
    expect(result.resolution).toContain("Matcha Latte");
    expect(result.resolvedAt).toBeDefined();
  });

  it("auto-resolves acknowledged issue when compensation code is created", () => {
    const acked = acknowledgeIssue(baseIssue);
    const result = autoResolveFromComp(acked, "CL-XYZ789", "Hojicha Frappe");
    expect(result.status).toBe("resolved");
    expect(result.resolution).toContain("CL-XYZ789");
  });

  it("skips auto-resolve for already resolved issue", () => {
    const resolved: OrderIssue = { ...baseIssue, status: "resolved", resolution: "Already fixed" };
    const result = autoResolveFromComp(resolved, "CL-SKIP01", "Test");
    expect(result.status).toBe("resolved");
    expect(result.resolution).toBe("Already fixed"); // Unchanged
  });

  it("skips auto-resolve for closed issue", () => {
    const closed: OrderIssue = { ...baseIssue, status: "closed", resolution: "Closed" };
    const result = autoResolveFromComp(closed, "CL-SKIP02", "Test");
    expect(result.status).toBe("closed");
    expect(result.resolution).toBe("Closed"); // Unchanged
  });
});

describe("Compensation Code with orderIssueId", () => {
  interface ClaimInput {
    branchId: number;
    claimChannel: "shopee" | "lineman" | "grab" | "gpos" | "walk_in";
    claimError: string;
    compensationMenuCode?: string;
    compensationMenuName?: string;
    compensationRemark?: string;
    customerId?: number;
    customerPhone?: string;
    expiryDays: number;
    orderIssueId?: number;
  }

  function validateClaimInput(input: ClaimInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!input.branchId) errors.push("กรุณาระบุสาขา");
    if (!input.claimError.trim()) errors.push("กรุณาระบุความผิดพลาด");
    if (!input.customerId && !input.customerPhone) errors.push("กรุณาระบุลูกค้า");
    if (input.expiryDays < 1 || input.expiryDays > 365) errors.push("อายุโค้ดไม่ถูกต้อง");
    return { valid: errors.length === 0, errors };
  }

  it("accepts claim with orderIssueId for auto-resolve", () => {
    const result = validateClaimInput({
      branchId: 1,
      claimChannel: "shopee",
      claimError: "ออเดอร์ผิด ได้เมนูไม่ตรง",
      compensationMenuName: "Matcha Latte เย็น",
      compensationRemark: "หวานน้อย ไซส์ L",
      customerId: 10,
      expiryDays: 30,
      orderIssueId: 5,
    });
    expect(result.valid).toBe(true);
  });

  it("accepts claim without orderIssueId (standalone claim)", () => {
    const result = validateClaimInput({
      branchId: 1,
      claimChannel: "grab",
      claimError: "ของขาดไม่ครบ",
      customerPhone: "0812345678",
      expiryDays: 14,
    });
    expect(result.valid).toBe(true);
  });

  it("rejects claim without customer info", () => {
    const result = validateClaimInput({
      branchId: 1,
      claimChannel: "lineman",
      claimError: "สินค้าเสียหาย",
      expiryDays: 30,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("กรุณาระบุลูกค้า");
  });

  it("rejects claim with empty error", () => {
    const result = validateClaimInput({
      branchId: 1,
      claimChannel: "walk_in",
      claimError: "",
      customerId: 5,
      expiryDays: 30,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("กรุณาระบุความผิดพลาด");
  });
});

describe("SLA Compliance Calculation", () => {
  function checkSla(issue: { status: string; createdAt: Date; acknowledgedAt?: Date; resolvedAt?: Date; slaResponseDeadline: Date; slaResolutionDeadline: Date }) {
    const now = new Date();
    const responseDeadline = issue.slaResponseDeadline.getTime();
    const resolutionDeadline = issue.slaResolutionDeadline.getTime();

    let responseOverdue = false;
    let resolutionOverdue = false;
    let slaText = "";

    if (issue.status === "open" && now.getTime() > responseDeadline) {
      responseOverdue = true;
      slaText = "เกิน SLA ตอบรับ (24 ชม.)";
    } else if (["acknowledged", "in_progress"].includes(issue.status) && now.getTime() > resolutionDeadline) {
      resolutionOverdue = true;
      slaText = "เกิน SLA แก้ไข (48 ชม.)";
    } else if (issue.status === "open") {
      const hoursLeft = Math.max(0, Math.floor((responseDeadline - now.getTime()) / 3600000));
      slaText = `ตอบรับภายใน ${hoursLeft} ชม.`;
    }

    return { responseOverdue, resolutionOverdue, slaText };
  }

  it("detects response SLA overdue for open issue", () => {
    const pastDeadline = new Date(Date.now() - 3600000); // 1 hour ago
    const result = checkSla({
      status: "open",
      createdAt: new Date(Date.now() - 25 * 3600000),
      slaResponseDeadline: pastDeadline,
      slaResolutionDeadline: new Date(Date.now() + 23 * 3600000),
    });
    expect(result.responseOverdue).toBe(true);
    expect(result.slaText).toContain("เกิน SLA ตอบรับ");
  });

  it("shows remaining time for open issue within SLA", () => {
    const futureDeadline = new Date(Date.now() + 12 * 3600000);
    const result = checkSla({
      status: "open",
      createdAt: new Date(Date.now() - 12 * 3600000),
      slaResponseDeadline: futureDeadline,
      slaResolutionDeadline: new Date(Date.now() + 36 * 3600000),
    });
    expect(result.responseOverdue).toBe(false);
    expect(result.slaText).toContain("ตอบรับภายใน");
  });

  it("detects resolution SLA overdue for acknowledged issue", () => {
    const pastDeadline = new Date(Date.now() - 3600000);
    const result = checkSla({
      status: "acknowledged",
      createdAt: new Date(Date.now() - 49 * 3600000),
      acknowledgedAt: new Date(Date.now() - 48 * 3600000),
      slaResponseDeadline: new Date(Date.now() - 25 * 3600000),
      slaResolutionDeadline: pastDeadline,
    });
    expect(result.resolutionOverdue).toBe(true);
    expect(result.slaText).toContain("เกิน SLA แก้ไข");
  });

  it("no overdue for resolved issue", () => {
    const result = checkSla({
      status: "resolved",
      createdAt: new Date(Date.now() - 24 * 3600000),
      acknowledgedAt: new Date(Date.now() - 23 * 3600000),
      resolvedAt: new Date(Date.now() - 1 * 3600000),
      slaResponseDeadline: new Date(Date.now() - 1 * 3600000),
      slaResolutionDeadline: new Date(Date.now() + 23 * 3600000),
    });
    expect(result.responseOverdue).toBe(false);
    expect(result.resolutionOverdue).toBe(false);
  });
});

describe("Suggested Guideline Helper", () => {
  const GUIDELINES: Record<string, { title: string; steps: string[]; tips: string }> = {
    wrong_order: {
      title: "แนวทางแก้ไข: ออเดอร์ผิด",
      steps: [
        "ตรวจสอบออเดอร์จริงกับที่ลูกค้าสั่ง",
        "ยืนยันกับลูกค้าว่าได้รับเมนูอะไร",
        "ทำเมนูที่ถูกต้องส่งให้ลูกค้า หรือออกโค้ดชดเชย",
        "บันทึกสาเหตุเพื่อป้องกันซ้ำ",
      ],
      tips: "ควรตอบกลับลูกค้าภายใน 15 นาที เพื่อรักษาความพึงพอใจ",
    },
    missing_item: {
      title: "แนวทางแก้ไข: ของขาด/ไม่ครบ",
      steps: [
        "ตรวจสอบรายการสั่งซื้อกับสิ่งที่จัดส่ง",
        "ยืนยันรายการที่ขาดกับลูกค้า",
        "จัดส่งรายการที่ขาดเพิ่ม หรือออกโค้ดชดเชย",
        "ตรวจสอบขั้นตอนการจัดเตรียมออเดอร์",
      ],
      tips: "ตรวจสอบ checklist ก่อนส่งมอบทุกครั้ง",
    },
  };

  function getGuideline(category: string) {
    return GUIDELINES[category] || {
      title: "แนวทางแก้ไขทั่วไป",
      steps: ["ตรวจสอบปัญหา", "ติดต่อลูกค้า", "แก้ไขปัญหา", "บันทึกผล"],
      tips: "ติดต่อลูกค้าโดยเร็วที่สุด",
    };
  }

  it("returns specific guideline for wrong_order", () => {
    const guide = getGuideline("wrong_order");
    expect(guide.title).toContain("ออเดอร์ผิด");
    expect(guide.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("returns specific guideline for missing_item", () => {
    const guide = getGuideline("missing_item");
    expect(guide.title).toContain("ของขาด");
    expect(guide.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("returns fallback guideline for unknown category", () => {
    const guide = getGuideline("unknown_category");
    expect(guide.title).toContain("ทั่วไป");
    expect(guide.steps.length).toBeGreaterThanOrEqual(3);
  });
});
