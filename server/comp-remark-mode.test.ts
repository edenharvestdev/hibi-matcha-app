import { describe, it, expect } from "vitest";

// ── Test: Compensation mode selection (same / select / custom) ──
describe("Compensation mode selection", () => {
  interface CompInput {
    compMode: "same" | "select" | "custom";
    claimMenuCode?: string;
    claimMenuName?: string;
    selectedMenuCode?: string;
    selectedMenuName?: string;
    customCompName?: string;
  }

  function resolveCompensationMenu(input: CompInput): { code?: string; name?: string } {
    if (input.compMode === "same") {
      return {
        code: input.claimMenuCode || undefined,
        name: input.claimMenuName || undefined,
      };
    } else if (input.compMode === "select") {
      return {
        code: input.selectedMenuCode || undefined,
        name: input.selectedMenuName || undefined,
      };
    } else if (input.compMode === "custom") {
      return {
        name: input.customCompName?.trim() || undefined,
      };
    }
    return {};
  }

  it("same mode: uses claim menu code and name", () => {
    const result = resolveCompensationMenu({
      compMode: "same",
      claimMenuCode: "M01",
      claimMenuName: "Matcha Latte",
    });
    expect(result.code).toBe("M01");
    expect(result.name).toBe("Matcha Latte");
  });

  it("same mode: returns undefined when no claim menu info", () => {
    const result = resolveCompensationMenu({ compMode: "same" });
    expect(result.code).toBeUndefined();
    expect(result.name).toBeUndefined();
  });

  it("select mode: uses selected menu from list", () => {
    const result = resolveCompensationMenu({
      compMode: "select",
      selectedMenuCode: "FR01",
      selectedMenuName: "Matcha Frappe",
    });
    expect(result.code).toBe("FR01");
    expect(result.name).toBe("Matcha Frappe");
  });

  it("custom mode: uses custom typed name", () => {
    const result = resolveCompensationMenu({
      compMode: "custom",
      customCompName: "Hojicha Latte เย็น ไซส์ L",
    });
    expect(result.code).toBeUndefined();
    expect(result.name).toBe("Hojicha Latte เย็น ไซส์ L");
  });

  it("custom mode: trims whitespace", () => {
    const result = resolveCompensationMenu({
      compMode: "custom",
      customCompName: "  Matcha Latte  ",
    });
    expect(result.name).toBe("Matcha Latte");
  });

  it("custom mode: returns undefined for empty string", () => {
    const result = resolveCompensationMenu({
      compMode: "custom",
      customCompName: "   ",
    });
    expect(result.name).toBeUndefined();
  });
});

// ── Test: Compensation remark for branch staff ──
describe("Compensation remark field", () => {
  interface CopyTextInput {
    code: string;
    compensationMenuCode?: string | null;
    compensationMenuName?: string | null;
    compensationRemark?: string | null;
    claimError: string;
  }

  function buildCopyText(input: CopyTextInput): string {
    const compParts: string[] = [];
    if (input.compensationMenuCode) compParts.push(input.compensationMenuCode);
    if (input.compensationMenuName) compParts.push(input.compensationMenuName);
    const compText = compParts.length > 0 ? compParts.join(" - ") : "ไม่ระบุ";
    const remarkText = input.compensationRemark ? " (" + input.compensationRemark + ")" : "";
    return input.code + " | เมนูชดเชย: " + compText + remarkText + " | สาเหตุ: " + input.claimError;
  }

  it("includes menu code and name in copy text", () => {
    const text = buildCopyText({
      code: "HIBI-CL-ABC123",
      compensationMenuCode: "M01",
      compensationMenuName: "Matcha Latte",
      claimError: "ทำผิดเมนู",
    });
    expect(text).toBe("HIBI-CL-ABC123 | เมนูชดเชย: M01 - Matcha Latte | สาเหตุ: ทำผิดเมนู");
  });

  it("includes remark in parentheses", () => {
    const text = buildCopyText({
      code: "HIBI-CL-ABC123",
      compensationMenuCode: "M01",
      compensationMenuName: "Matcha Latte",
      compensationRemark: "หวานน้อย เย็น ไซส์ L",
      claimError: "ทำผิดเมนู",
    });
    expect(text).toBe("HIBI-CL-ABC123 | เมนูชดเชย: M01 - Matcha Latte (หวานน้อย เย็น ไซส์ L) | สาเหตุ: ทำผิดเมนู");
  });

  it("shows only name when no code", () => {
    const text = buildCopyText({
      code: "HIBI-CL-XYZ789",
      compensationMenuName: "Hojicha Latte",
      compensationRemark: "ร้อน ใส่นมสด",
      claimError: "ใส่น้ำตาลผิด",
    });
    expect(text).toBe("HIBI-CL-XYZ789 | เมนูชดเชย: Hojicha Latte (ร้อน ใส่นมสด) | สาเหตุ: ใส่น้ำตาลผิด");
  });

  it("shows ไม่ระบุ when no menu info", () => {
    const text = buildCopyText({
      code: "HIBI-CL-DEF456",
      claimError: "หกระหว่างทาง",
    });
    expect(text).toBe("HIBI-CL-DEF456 | เมนูชดเชย: ไม่ระบุ | สาเหตุ: หกระหว่างทาง");
  });

  it("no remark shows no parentheses", () => {
    const text = buildCopyText({
      code: "HIBI-CL-GHI012",
      compensationMenuCode: "FR01",
      compensationMenuName: "Matcha Frappe",
      claimError: "ของขาดไม่ครบ",
    });
    expect(text).not.toContain("(");
    expect(text).toBe("HIBI-CL-GHI012 | เมนูชดเชย: FR01 - Matcha Frappe | สาเหตุ: ของขาดไม่ครบ");
  });

  it("handles null remark gracefully", () => {
    const text = buildCopyText({
      code: "HIBI-CL-JKL345",
      compensationMenuName: "Genmaicha",
      compensationRemark: null,
      claimError: "สินค้าเสียหาย",
    });
    expect(text).toBe("HIBI-CL-JKL345 | เมนูชดเชย: Genmaicha | สาเหตุ: สินค้าเสียหาย");
  });

  it("handles only code without name", () => {
    const text = buildCopyText({
      code: "HIBI-CL-MNO678",
      compensationMenuCode: "M05",
      compensationRemark: "เย็น ไซส์ M",
      claimError: "ทำผิดเมนู",
    });
    expect(text).toBe("HIBI-CL-MNO678 | เมนูชดเชย: M05 (เย็น ไซส์ M) | สาเหตุ: ทำผิดเมนู");
  });
});
