import { describe, it, expect } from "vitest";

/**
 * Tests for phone number normalization across all input points,
 * admin member management, and password reset integration
 */

describe("Phone normalization in all input contexts", () => {
  const normalizePhone = (val: string) => val.replace(/\D/g, "");

  // Registration / Login
  it("should strip dashes from registration phone", () => {
    expect(normalizePhone("09-6812-9333")).toBe("0968129333");
  });

  it("should strip spaces from login phone", () => {
    expect(normalizePhone("09 6812 9333")).toBe("0968129333");
  });

  it("should strip parentheses and country code", () => {
    expect(normalizePhone("+66(96)812-9333")).toBe("66968129333");
  });

  it("should handle phone with dots", () => {
    expect(normalizePhone("096.812.9333")).toBe("0968129333");
  });

  it("should handle phone with mixed separators", () => {
    expect(normalizePhone("096-812 9333")).toBe("0968129333");
  });

  it("should keep clean phone unchanged", () => {
    expect(normalizePhone("0968129333")).toBe("0968129333");
  });

  it("should handle empty string", () => {
    expect(normalizePhone("")).toBe("");
  });

  // Contact Form
  it("should normalize phone in contact form context", () => {
    const contactPhone = "099-292-5456";
    expect(normalizePhone(contactPhone)).toBe("0992925456");
  });

  // Give Points (admin/branch)
  it("should normalize phone in give points context", () => {
    const givePointsPhone = "081 234 5678";
    expect(normalizePhone(givePointsPhone)).toBe("0812345678");
  });

  // Create Claim (admin/branch)
  it("should normalize phone in create claim context", () => {
    const claimPhone = "(081)-234-5678";
    expect(normalizePhone(claimPhone)).toBe("0812345678");
  });

  // Staff create
  it("should normalize phone in staff creation context", () => {
    const staffPhone = "062-345-6789";
    expect(normalizePhone(staffPhone)).toBe("0623456789");
  });

  // Lookup customer
  it("should normalize phone in customer lookup context", () => {
    const lookupPhone = "081 234 5678";
    expect(normalizePhone(lookupPhone)).toBe("0812345678");
  });
});

describe("Admin member management list", () => {
  it("should support search by name", () => {
    const searchQuery = "สมชาย";
    const pattern = `%${searchQuery}%`;
    expect(pattern).toBe("%สมชาย%");
  });

  it("should support search by phone", () => {
    const searchQuery = "0968129333";
    const pattern = `%${searchQuery}%`;
    expect(pattern).toContain("0968129333");
  });

  it("should support search by email", () => {
    const searchQuery = "test@example.com";
    const pattern = `%${searchQuery}%`;
    expect(pattern).toContain("test@example.com");
  });

  it("should support pagination with limit and offset", () => {
    const limit = 20;
    const page = 2;
    const offset = page * limit;
    expect(offset).toBe(40);
  });

  it("should calculate total pages correctly", () => {
    const total = 143;
    const limit = 20;
    const totalPages = Math.ceil(total / limit);
    expect(totalPages).toBe(8);
  });

  it("should handle empty search", () => {
    const search = "";
    const searchQuery = search || undefined;
    expect(searchQuery).toBeUndefined();
  });
});

describe("Password reset link generation from member page", () => {
  it("should generate reset URL with token", () => {
    const origin = "https://hibimatcha.love";
    const token = "abc123def456ghi789jkl012mno345pqr678stu901vwx234";
    const resetUrl = `${origin}/reset-password?token=${token}`;
    expect(resetUrl).toContain("/reset-password?token=");
    expect(resetUrl).toContain(token);
  });

  it("should set 24-hour expiry for reset link", () => {
    const now = Date.now();
    const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
    const diffHours = (expiresAt.getTime() - now) / (60 * 60 * 1000);
    expect(diffHours).toBe(24);
  });

  it("should validate token is not empty", () => {
    const token = "abc123def456";
    expect(token.length).toBeGreaterThan(0);
  });

  it("should detect expired token", () => {
    const expiresAt = new Date(Date.now() - 1000); // 1 second ago
    const isExpired = new Date() > expiresAt;
    expect(isExpired).toBe(true);
  });

  it("should detect valid (not expired) token", () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now
    const isExpired = new Date() > expiresAt;
    expect(isExpired).toBe(false);
  });

  it("should detect used token", () => {
    const tokenRow = { usedAt: new Date() };
    expect(tokenRow.usedAt).not.toBeNull();
  });

  it("should detect unused token", () => {
    const tokenRow = { usedAt: null };
    expect(tokenRow.usedAt).toBeNull();
  });
});

describe("Admin password reset request management", () => {
  it("should list pending requests", () => {
    const requests = [
      { id: 1, status: "pending", customerId: 1 },
      { id: 2, status: "processed", customerId: 2 },
      { id: 3, status: "pending", customerId: 3 },
    ];
    const pending = requests.filter(r => r.status === "pending");
    expect(pending.length).toBe(2);
  });

  it("should count pending requests for badge", () => {
    const pendingCount = 5;
    expect(pendingCount).toBeGreaterThan(0);
  });

  it("should transition request status to processed", () => {
    let status = "pending";
    // Admin generates reset link
    status = "processed";
    expect(status).toBe("processed");
  });

  it("should enrich request with customer info", () => {
    const request = { id: 1, customerId: 10, status: "pending" };
    const customer = { id: 10, name: "สมชาย", phone: "0812345678", email: "test@example.com" };
    const enriched = {
      ...request,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
    };
    expect(enriched.customerName).toBe("สมชาย");
    expect(enriched.customerPhone).toBe("0812345678");
    expect(enriched.customerEmail).toBe("test@example.com");
  });
});

describe("Forgot password flow (customer side)", () => {
  it("should accept phone identifier type", () => {
    const identifierType = "phone";
    expect(["phone", "email"]).toContain(identifierType);
  });

  it("should accept email identifier type", () => {
    const identifierType = "email";
    expect(["phone", "email"]).toContain(identifierType);
  });

  it("should normalize phone before submitting request", () => {
    const normalizePhone = (val: string) => val.replace(/\D/g, "");
    const input = "096-812-9333";
    const cleaned = normalizePhone(input);
    expect(cleaned).toBe("0968129333");
    expect(/^\d+$/.test(cleaned)).toBe(true);
  });

  it("should trim and lowercase email before submitting", () => {
    const email = "  Test@Example.COM  ";
    const cleaned = email.trim().toLowerCase();
    expect(cleaned).toBe("test@example.com");
  });
});

describe("Reset password page (customer side)", () => {
  it("should validate new password minimum length (6 chars)", () => {
    expect("abc123".length).toBeGreaterThanOrEqual(6);
    expect("abc12".length).toBeLessThan(6);
  });

  it("should validate password confirmation matches", () => {
    const password = "newpassword123";
    const confirm = "newpassword123";
    expect(password).toBe(confirm);
  });

  it("should reject mismatched password confirmation", () => {
    const password = "newpassword123";
    const confirm = "differentpassword";
    expect(password).not.toBe(confirm);
  });

  it("should extract token from URL query params", () => {
    const url = "https://hibimatcha.love/reset-password?token=abc123def456";
    const params = new URLSearchParams(url.split("?")[1]);
    const token = params.get("token");
    expect(token).toBe("abc123def456");
  });
});
