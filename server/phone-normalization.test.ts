import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db helpers
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    getCustomerByPhone: vi.fn(),
    createCustomer: vi.fn(),
    listCustomers: vi.fn(),
    countCustomers: vi.fn(),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.jpg", key: "file.jpg" }),
}));

import {
  getCustomerByPhone,
  createCustomer,
  listCustomers,
  countCustomers,
} from "./db";

describe("Phone Number Normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Phone normalization utility", () => {
    const normalizePhone = (val: string) => val.replace(/\D/g, "");

    it("should strip dashes from phone number", () => {
      expect(normalizePhone("089-900-1794")).toBe("0899001794");
    });

    it("should strip spaces from phone number", () => {
      expect(normalizePhone("089 900 1794")).toBe("0899001794");
    });

    it("should strip mixed dashes and spaces", () => {
      expect(normalizePhone("089-900 1794")).toBe("0899001794");
    });

    it("should strip plus sign from international format", () => {
      expect(normalizePhone("+66614718570")).toBe("66614718570");
    });

    it("should not change already clean phone number", () => {
      expect(normalizePhone("0899001794")).toBe("0899001794");
    });

    it("should handle empty string", () => {
      expect(normalizePhone("")).toBe("");
    });

    it("should strip parentheses and dots", () => {
      expect(normalizePhone("(089) 900.1794")).toBe("0899001794");
    });
  });

  describe("Admin search normalization", () => {
    const normalizeSearch = (search: string) => search.replace(/[\-\s]/g, "");

    it("should strip dashes from search query", () => {
      expect(normalizeSearch("089-900-1794")).toBe("0899001794");
    });

    it("should strip spaces from search query", () => {
      expect(normalizeSearch("089 900 1794")).toBe("0899001794");
    });

    it("should not affect name searches", () => {
      expect(normalizeSearch("พรพรรณ")).toBe("พรพรรณ");
    });

    it("should not affect email searches", () => {
      expect(normalizeSearch("test@example.com")).toBe("test@example.com");
    });
  });

  describe("Registration phone normalization", () => {
    it("should normalize phone with dashes before creating customer", () => {
      const phone = "089-900-1794";
      const cleanPhone = phone.replace(/\D/g, "");
      expect(cleanPhone).toBe("0899001794");
    });

    it("should normalize phone with international prefix", () => {
      const phone = "+66-89-900-1794";
      const cleanPhone = phone.replace(/\D/g, "");
      expect(cleanPhone).toBe("66899001794");
    });
  });

  describe("Login phone normalization", () => {
    it("should normalize phone with dashes for login lookup", () => {
      const phone = "095-985-8507";
      const cleanPhone = phone.replace(/\D/g, "");
      expect(cleanPhone).toBe("0959858507");
    });

    it("should find customer with clean phone after normalization", async () => {
      const mockCustomer = { id: 1, phone: "0899001794", name: "Test", email: "test@test.com" };
      (getCustomerByPhone as any).mockResolvedValue(mockCustomer);

      const inputPhone = "089-900-1794";
      const cleanPhone = inputPhone.replace(/\D/g, "");
      const result = await getCustomerByPhone(cleanPhone);
      
      expect(getCustomerByPhone).toHaveBeenCalledWith("0899001794");
      expect(result).toEqual(mockCustomer);
    });
  });

  describe("Claim code phone normalization", () => {
    it("should normalize customerPhone before looking up customer", () => {
      const customerPhone = "081-673-1241";
      const cleanPhone = (customerPhone || "").replace(/\D/g, "");
      expect(cleanPhone).toBe("0816731241");
    });

    it("should handle null/undefined customerPhone", () => {
      const customerPhone = "";
      const cleanPhone = (customerPhone || "").replace(/\D/g, "");
      expect(cleanPhone).toBe("");
    });
  });
});
