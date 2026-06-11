import { describe, expect, it } from "vitest";

// ── Test: Branch-specific Reward Redemption Logic ──
describe("Branch-specific Reward Redemption", () => {
  interface BranchLoyalty {
    customerId: number;
    branchId: number;
    totalPoints: number;
    usedPoints: number;
  }

  interface Reward {
    id: number;
    name: string;
    pointsCost: number;
    isActive: boolean;
    stock: number | null;
  }

  function getAvailablePoints(loyalty: BranchLoyalty): number {
    return loyalty.totalPoints - loyalty.usedPoints;
  }

  function canRedeemReward(loyalty: BranchLoyalty, reward: Reward): { ok: boolean; error?: string } {
    if (!reward.isActive) return { ok: false, error: "รางวัลนี้ปิดใช้งาน" };
    if (reward.stock !== null && reward.stock <= 0) return { ok: false, error: "รางวัลนี้หมดแล้ว" };
    const available = getAvailablePoints(loyalty);
    if (available < reward.pointsCost) return { ok: false, error: "แต้มสาขานี้ไม่เพียงพอ" };
    return { ok: true };
  }

  function spendBranchPoints(loyalty: BranchLoyalty, points: number): { success: boolean; balance: number; error?: string } {
    const available = getAvailablePoints(loyalty);
    if (available < points) return { success: false, balance: available, error: "แต้มสาขานี้ไม่เพียงพอ" };
    loyalty.usedPoints += points;
    return { success: true, balance: getAvailablePoints(loyalty) };
  }

  const reward: Reward = { id: 1, name: "Matcha Latte ฟรี", pointsCost: 100, isActive: true, stock: 5 };

  it("allows redemption when branch has enough points", () => {
    const loyalty: BranchLoyalty = { customerId: 1, branchId: 1, totalPoints: 200, usedPoints: 50 };
    const result = canRedeemReward(loyalty, reward);
    expect(result.ok).toBe(true);
  });

  it("rejects redemption when branch points insufficient", () => {
    const loyalty: BranchLoyalty = { customerId: 1, branchId: 1, totalPoints: 120, usedPoints: 50 };
    const result = canRedeemReward(loyalty, reward);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("ไม่เพียงพอ");
  });

  it("rejects redemption for inactive reward", () => {
    const inactiveReward: Reward = { ...reward, isActive: false };
    const loyalty: BranchLoyalty = { customerId: 1, branchId: 1, totalPoints: 500, usedPoints: 0 };
    const result = canRedeemReward(loyalty, inactiveReward);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("ปิดใช้งาน");
  });

  it("rejects redemption when stock is 0", () => {
    const noStockReward: Reward = { ...reward, stock: 0 };
    const loyalty: BranchLoyalty = { customerId: 1, branchId: 1, totalPoints: 500, usedPoints: 0 };
    const result = canRedeemReward(loyalty, noStockReward);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("หมดแล้ว");
  });

  it("allows redemption when stock is null (unlimited)", () => {
    const unlimitedReward: Reward = { ...reward, stock: null };
    const loyalty: BranchLoyalty = { customerId: 1, branchId: 1, totalPoints: 200, usedPoints: 0 };
    const result = canRedeemReward(loyalty, unlimitedReward);
    expect(result.ok).toBe(true);
  });

  it("deducts points from correct branch only", () => {
    const branch1: BranchLoyalty = { customerId: 1, branchId: 1, totalPoints: 200, usedPoints: 0 };
    const branch2: BranchLoyalty = { customerId: 1, branchId: 2, totalPoints: 300, usedPoints: 0 };

    // Spend from branch 1
    const result = spendBranchPoints(branch1, 100);
    expect(result.success).toBe(true);
    expect(result.balance).toBe(100);

    // Branch 2 should be unaffected
    expect(getAvailablePoints(branch2)).toBe(300);
  });

  it("prevents cross-branch point spending", () => {
    const branch1: BranchLoyalty = { customerId: 1, branchId: 1, totalPoints: 50, usedPoints: 0 };
    const branch2: BranchLoyalty = { customerId: 1, branchId: 2, totalPoints: 300, usedPoints: 0 };

    // Branch 1 has only 50 points, reward costs 100
    const result = spendBranchPoints(branch1, 100);
    expect(result.success).toBe(false);
    expect(result.error).toContain("ไม่เพียงพอ");

    // Even though branch 2 has 300, can't use them
    expect(getAvailablePoints(branch2)).toBe(300);
  });

  it("correctly calculates available points after multiple spends", () => {
    const loyalty: BranchLoyalty = { customerId: 1, branchId: 1, totalPoints: 500, usedPoints: 0 };

    spendBranchPoints(loyalty, 100);
    expect(getAvailablePoints(loyalty)).toBe(400);

    spendBranchPoints(loyalty, 150);
    expect(getAvailablePoints(loyalty)).toBe(250);

    spendBranchPoints(loyalty, 250);
    expect(getAvailablePoints(loyalty)).toBe(0);

    // Now can't spend more
    const result = spendBranchPoints(loyalty, 1);
    expect(result.success).toBe(false);
  });
});

// ── Test: Branch Points Display ──
describe("Branch Points Display", () => {
  interface BranchPointsView {
    branchId: number;
    branchName: string;
    totalPoints: number;
    usedPoints: number;
    available: number;
  }

  function formatBranchPoints(
    branchPoints: { branchId: number; totalPoints: number; usedPoints: number }[],
    branches: { id: number; name: string }[]
  ): BranchPointsView[] {
    return branchPoints.map(bp => {
      const branch = branches.find(b => b.id === bp.branchId);
      return {
        branchId: bp.branchId,
        branchName: branch?.name || "ไม่ทราบสาขา",
        totalPoints: bp.totalPoints,
        usedPoints: bp.usedPoints,
        available: bp.totalPoints - bp.usedPoints,
      };
    });
  }

  const branches = [
    { id: 1, name: "ลาดพร้าว 107" },
    { id: 2, name: "นวมินทร์ 111" },
    { id: 3, name: "สยามสแควร์" },
  ];

  it("formats branch points with branch names", () => {
    const branchPoints = [
      { branchId: 1, totalPoints: 200, usedPoints: 50 },
      { branchId: 2, totalPoints: 300, usedPoints: 100 },
    ];
    const result = formatBranchPoints(branchPoints, branches);
    expect(result).toHaveLength(2);
    expect(result[0].branchName).toBe("ลาดพร้าว 107");
    expect(result[0].available).toBe(150);
    expect(result[1].branchName).toBe("นวมินทร์ 111");
    expect(result[1].available).toBe(200);
  });

  it("handles unknown branch gracefully", () => {
    const branchPoints = [{ branchId: 999, totalPoints: 100, usedPoints: 0 }];
    const result = formatBranchPoints(branchPoints, branches);
    expect(result[0].branchName).toBe("ไม่ทราบสาขา");
    expect(result[0].available).toBe(100);
  });

  it("shows zero available when all points used", () => {
    const branchPoints = [{ branchId: 1, totalPoints: 200, usedPoints: 200 }];
    const result = formatBranchPoints(branchPoints, branches);
    expect(result[0].available).toBe(0);
  });

  it("each branch is independent", () => {
    const branchPoints = [
      { branchId: 1, totalPoints: 20, usedPoints: 0 },
      { branchId: 2, totalPoints: 30, usedPoints: 0 },
    ];
    const result = formatBranchPoints(branchPoints, branches);
    // Total across branches = 50, but each is independent
    const totalAcross = result.reduce((sum, bp) => sum + bp.available, 0);
    expect(totalAcross).toBe(50);
    // But branch 1 only has 20
    expect(result[0].available).toBe(20);
    // And branch 2 only has 30
    expect(result[1].available).toBe(30);
  });
});

// ── Test: Reward Redemption requires branchId ──
describe("Reward Redemption Input Validation", () => {
  interface RedeemInput {
    rewardId: number;
    branchId: number;
  }

  function validateRedeemInput(input: Partial<RedeemInput>): { valid: boolean; error?: string } {
    if (!input.rewardId || input.rewardId <= 0) return { valid: false, error: "rewardId is required" };
    if (!input.branchId || input.branchId <= 0) return { valid: false, error: "branchId is required" };
    return { valid: true };
  }

  it("valid input with both rewardId and branchId", () => {
    const result = validateRedeemInput({ rewardId: 1, branchId: 2 });
    expect(result.valid).toBe(true);
  });

  it("rejects missing branchId", () => {
    const result = validateRedeemInput({ rewardId: 1 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("branchId");
  });

  it("rejects missing rewardId", () => {
    const result = validateRedeemInput({ branchId: 2 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("rewardId");
  });

  it("rejects zero branchId", () => {
    const result = validateRedeemInput({ rewardId: 1, branchId: 0 });
    expect(result.valid).toBe(false);
  });
});
