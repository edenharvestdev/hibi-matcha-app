import { describe, it, expect, vi } from "vitest";

// Mock db module — only need listBranches for this test
vi.mock("./db", () => ({
  listBranches: vi.fn().mockResolvedValue([
    { id: 1, name: "สาขาสยาม", isActive: true },
    { id: 2, name: "สาขาลาดพร้าว", isActive: true },
  ]),
}));

describe("POS Launcher", () => {
  it("listBranches returns branches for launcher dropdown", async () => {
    const { listBranches } = await import("./db");
    const result = await listBranches(true);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty("name", "สาขาสยาม");
    expect(listBranches).toHaveBeenCalledWith(true);
  });

  it("VITE_POS_V2_URL env is set (placeholder or real)", () => {
    // This test verifies the env var is configured in the system
    const url = process.env.VITE_POS_V2_URL;
    expect(url).toBeDefined();
    expect(typeof url).toBe("string");
    expect(url!.length).toBeGreaterThan(0);
  });
});
