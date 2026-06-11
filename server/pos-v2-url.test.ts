import { describe, it, expect } from "vitest";

describe("VITE_POS_V2_URL environment variable", () => {
  it("should be set and not be a placeholder", () => {
    const url = process.env.VITE_POS_V2_URL;
    expect(url).toBeDefined();
    expect(url).not.toBe("");
    expect(url).not.toContain("placeholder");
  });

  it("should be a valid URL pointing to hibimatcha manus.space", () => {
    const url = process.env.VITE_POS_V2_URL!;
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain("hibimatcha");
    expect(url).toContain("manus.space");
  });
});
