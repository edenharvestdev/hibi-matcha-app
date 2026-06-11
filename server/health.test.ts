import { describe, it, expect } from "vitest";

describe("Health Check Endpoint", () => {
  describe("/api/health response structure", () => {
    it("should return status ok with correct fields", async () => {
      // Test the health endpoint via HTTP
      const res = await fetch("http://localhost:3000/api/health");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty("status", "ok");
      expect(body).toHaveProperty("timestamp");
      expect(body).toHaveProperty("uptime");
      expect(body).toHaveProperty("db");
      expect(body.db).toHaveProperty("status", "connected");
      expect(body.db).toHaveProperty("latencyMs");
    });

    it("should return valid ISO timestamp", async () => {
      const res = await fetch("http://localhost:3000/api/health");
      const body = await res.json();
      const date = new Date(body.timestamp);
      expect(date.toISOString()).toBe(body.timestamp);
    });

    it("should return positive uptime", async () => {
      const res = await fetch("http://localhost:3000/api/health");
      const body = await res.json();
      expect(body.uptime).toBeGreaterThan(0);
    });

    it("should return reasonable DB latency", async () => {
      const res = await fetch("http://localhost:3000/api/health");
      const body = await res.json();
      // DB latency should be under 5 seconds
      expect(body.db.latencyMs).toBeLessThan(5000);
      expect(body.db.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it("should respond with correct content-type", async () => {
      const res = await fetch("http://localhost:3000/api/health");
      const contentType = res.headers.get("content-type");
      expect(contentType).toContain("application/json");
    });
  });
});
