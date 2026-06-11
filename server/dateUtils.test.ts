import { describe, it, expect } from "vitest";
import { formatDate, formatDateLong, formatDateTime, formatDateTimeFull, formatTime, formatMonthYear } from "../client/src/lib/dateUtils";

describe("dateUtils - CE date formatting", () => {
  const testDate = new Date(2026, 3, 7, 14, 30, 45); // April 7, 2026 14:30:45

  describe("formatDate", () => {
    it("formats date with full year (CE)", () => {
      expect(formatDate(testDate)).toBe("7 เม.ย. 2026");
    });

    it("formats date with short year", () => {
      expect(formatDate(testDate, { shortYear: true })).toBe("7 เม.ย. 26");
    });

    it("handles string date input", () => {
      expect(formatDate("2026-04-07")).toContain("เม.ย.");
      expect(formatDate("2026-04-07")).toContain("2026");
    });

    it("handles null/undefined", () => {
      expect(formatDate(null)).toBe("-");
      expect(formatDate(undefined)).toBe("-");
    });

    it("handles invalid date", () => {
      expect(formatDate("invalid")).toBe("-");
    });

    it("uses CE year not BE year", () => {
      const result = formatDate(testDate);
      expect(result).not.toContain("2569"); // BE year
      expect(result).toContain("2026"); // CE year
    });
  });

  describe("formatDateLong", () => {
    it("formats date with full Thai month name", () => {
      expect(formatDateLong(testDate)).toBe("7 เมษายน 2026");
    });

    it("uses CE year", () => {
      expect(formatDateLong(testDate)).not.toContain("2569");
    });

    it("handles null", () => {
      expect(formatDateLong(null)).toBe("-");
    });
  });

  describe("formatDateTime", () => {
    it("formats date with time", () => {
      expect(formatDateTime(testDate)).toBe("7 เม.ย. 2026 14:30");
    });

    it("formats date with time and short year", () => {
      expect(formatDateTime(testDate, { shortYear: true })).toBe("7 เม.ย. 26 14:30");
    });

    it("handles null", () => {
      expect(formatDateTime(null)).toBe("-");
    });
  });

  describe("formatDateTimeFull", () => {
    it("formats date with full time including seconds", () => {
      expect(formatDateTimeFull(testDate)).toBe("7 เม.ย. 2026 14:30:45");
    });

    it("handles null", () => {
      expect(formatDateTimeFull(null)).toBe("-");
    });
  });

  describe("formatTime", () => {
    it("formats time only", () => {
      expect(formatTime(testDate)).toBe("14:30");
    });

    it("handles null", () => {
      expect(formatTime(null)).toBe("-");
    });
  });

  describe("formatMonthYear", () => {
    it("formats month and year", () => {
      expect(formatMonthYear(testDate)).toBe("เม.ย. 2026");
    });

    it("handles null", () => {
      expect(formatMonthYear(null)).toBe("-");
    });
  });

  describe("all months", () => {
    const months = [
      "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
      "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
    ];
    months.forEach((monthName, index) => {
      it(`formats month ${index + 1} correctly`, () => {
        const date = new Date(2026, index, 15);
        expect(formatDate(date)).toContain(monthName);
      });
    });
  });
});
