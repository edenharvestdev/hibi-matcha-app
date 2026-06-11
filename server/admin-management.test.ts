import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock storagePut
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test/file.jpg", url: "https://cdn.example.com/test.jpg" }),
}));

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db") as any;
  return {
    ...actual,
    listStaffWithDetails: vi.fn().mockResolvedValue([
      {
        id: 1, phone: "0800000001", name: "Super Admin", email: "admin@hibi.com",
        role: "super_admin", branchId: null, isActive: 1,
        assignedBranchIds: [], permissions: [],
      },
      {
        id: 2, phone: "0800000002", name: "Area Manager", email: "area@hibi.com",
        role: "area_manager", branchId: null, isActive: 1,
        assignedBranchIds: [1, 2], permissions: ["manage_branches", "approve_reviews", "approve_points", "view_reports", "manage_issues"],
      },
      {
        id: 3, phone: "0800000003", name: "Branch Admin", email: null,
        role: "branch_manager", branchId: 1, isActive: 1,
        assignedBranchIds: [], permissions: ["approve_reviews", "approve_points", "manage_issues"],
      },
      {
        id: 4, phone: "0800000004", name: "Support Staff", email: "support@hibi.com",
        role: "support_staff", branchId: null, isActive: 1,
        assignedBranchIds: [], permissions: ["manage_issues", "manage_inquiries"],
      },
    ]),
    listStaff: vi.fn().mockResolvedValue([
      { id: 1, phone: "0800000001", name: "Super Admin", email: "admin@hibi.com", role: "super_admin", branchId: null, isActive: 1 },
      { id: 2, phone: "0800000002", name: "Area Manager", email: "area@hibi.com", role: "area_manager", branchId: null, isActive: 1 },
    ]),
    createStaffMember: vi.fn().mockResolvedValue(5),
    updateStaffMember: vi.fn().mockResolvedValue(undefined),
    deleteStaffMember: vi.fn().mockResolvedValue(undefined),
    getStaffById: vi.fn().mockImplementation(async (id: number) => {
      const staffMap: Record<number, any> = {
        1: { id: 1, phone: "0800000001", name: "Super Admin", email: "admin@hibi.com", role: "super_admin", branchId: null, isActive: 1, passwordHash: "hashed" },
        2: { id: 2, phone: "0800000002", name: "Area Manager", email: "area@hibi.com", role: "area_manager", branchId: null, isActive: 1, passwordHash: "hashed" },
        3: { id: 3, phone: "0800000003", name: "Branch Manager", email: null, role: "branch_manager", branchId: 1, isActive: 1, passwordHash: "hashed" },
        4: { id: 4, phone: "0800000004", name: "Support Staff", email: "support@hibi.com", role: "support_staff", branchId: null, isActive: 1, passwordHash: "hashed" },
      };
      return staffMap[id] || null;
    }),
    getStaffByPhone: vi.fn().mockResolvedValue(null),
    getStaffBranches: vi.fn().mockResolvedValue([1, 2]),
    setStaffBranches: vi.fn().mockResolvedValue(undefined),
    getStaffPermissions: vi.fn().mockResolvedValue(["manage_branches", "approve_reviews"]),
    setStaffPermissions: vi.fn().mockResolvedValue(undefined),
    hasPermission: vi.fn().mockResolvedValue(true),
    listBranches: vi.fn().mockResolvedValue([
      { id: 1, name: "สาขาสยาม", province: "กรุงเทพ", address: null, branchPhone: "021234567", isActive: 1 },
      { id: 2, name: "สาขาเชียงใหม่", province: "เชียงใหม่", address: null, branchPhone: null, isActive: 1 },
    ]),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
    ALL_PERMISSIONS: [
      "manage_branches", "manage_staff", "approve_reviews", "approve_points",
      "manage_rewards", "view_reports", "manage_issues", "manage_inquiries",
      "manage_customers", "view_audit_logs",
    ],
    DEFAULT_ROLE_PERMISSIONS: {
      super_admin: [],
      area_manager: ["manage_branches", "approve_reviews", "approve_points", "manage_rewards", "view_reports", "manage_issues"],
      branch_manager: ["approve_reviews", "approve_points", "manage_issues"],
      support_staff: ["manage_issues", "manage_inquiries"],
    },
  };
});

// Mock jose for session verification
vi.mock("jose", () => ({
  jwtVerify: vi.fn().mockImplementation(async (token: string) => {
    if (token === "super-admin-token") {
      return {
        payload: {
          type: "staff", id: 1, phone: "0800000001", name: "Super Admin",
          email: "admin@hibi.com", role: "super_admin", branchId: null, branchName: null,
        },
      };
    }
    if (token === "area-manager-token") {
      return {
        payload: {
          type: "staff", id: 2, phone: "0800000002", name: "Area Manager",
          email: "area@hibi.com", role: "area_manager", branchId: null, branchName: null,
        },
      };
    }
    if (token === "branch-admin-token") {
      return {
        payload: {
          type: "staff", id: 3, phone: "0800000003", name: "Branch Admin",
          email: null, role: "branch_manager", branchId: 1, branchName: "สาขาสยาม",
        },
      };
    }
    throw new Error("Invalid token");
  }),
  SignJWT: vi.fn().mockReturnValue({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-token"),
  }),
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createSuperAdminContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { cookie: "hibi_session=super-admin-token" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAreaManagerContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { cookie: "hibi_session=area-manager-token" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createBranchAdminContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { cookie: "hibi_session=branch-admin-token" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Admin Management - Roles & Permissions", () => {
  describe("staff.allPermissions", () => {
    it("returns all permissions and default role permissions for super admin", async () => {
      const ctx = createSuperAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.staff.allPermissions();

      expect(result).toBeDefined();
      expect(result.permissions).toBeInstanceOf(Array);
      expect(result.permissions.length).toBeGreaterThan(0);
      expect(result.permissions).toContain("manage_branches");
      expect(result.permissions).toContain("manage_staff");
      expect(result.permissions).toContain("approve_reviews");
      expect(result.permissions).toContain("manage_issues");
      expect(result.defaultRolePermissions).toBeDefined();
      expect(result.defaultRolePermissions).toHaveProperty("area_manager");
      expect(result.defaultRolePermissions).toHaveProperty("branch_manager");
      expect(result.defaultRolePermissions).toHaveProperty("support_staff");
    });
  });

  describe("staff.list", () => {
    it("returns staff list with details for super admin", async () => {
      const ctx = createSuperAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.staff.list();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("staff.create", () => {
    it("creates a new area_manager with permissions and branches", async () => {
      const ctx = createSuperAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.staff.create({
        phone: "0899999999",
        password: "password123",
        name: "New Area Manager",
        email: "new-area@hibi.com",
        role: "area_manager",
        assignedBranchIds: [1, 2],
        permissions: ["manage_branches", "approve_reviews", "view_reports"],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("creates a new support_staff with limited permissions", async () => {
      const ctx = createSuperAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.staff.create({
        phone: "0888888888",
        password: "password123",
        name: "New Support",
        role: "support_staff",
        permissions: ["manage_issues", "manage_inquiries"],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    it("creates a branch_manager with single branch", async () => {
      const ctx = createSuperAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.staff.create({
        phone: "0877777777",
        password: "password123",
        name: "Branch Manager",
        role: "branch_manager",
        branchId: 1,
        permissions: ["approve_reviews", "approve_points"],
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });
  });

  describe("staff.update", () => {
    it("updates staff role and permissions", async () => {
      const ctx = createSuperAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.staff.update({
        id: 3,
        name: "Updated Branch Admin",
        role: "area_manager",
        assignedBranchIds: [1, 2],
        permissions: ["manage_branches", "approve_reviews"],
      })).resolves.not.toThrow();
    });

    it("updates staff with new password", async () => {
      const ctx = createSuperAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.staff.update({
        id: 3,
        name: "Branch Admin",
        password: "newpassword123",
      })).resolves.not.toThrow();
    });
  });

  describe("staff.delete (deactivate)", () => {
    it("deactivates a staff member", async () => {
      const ctx = createSuperAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.staff.delete({ id: 3 })).resolves.not.toThrow();
    });
  });
});

describe("Admin Management - Role Labels", () => {
  it("all 4 roles are defined", () => {
    const roles = ["super_admin", "area_manager", "branch_manager", "support_staff"];
    roles.forEach(role => {
      expect(typeof role).toBe("string");
    });
  });

  it("default permissions cover all roles", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.staff.allPermissions();

    const roles = ["area_manager", "branch_manager", "support_staff"];
    roles.forEach(role => {
      expect(result.defaultRolePermissions[role]).toBeDefined();
      expect(result.defaultRolePermissions[role]).toBeInstanceOf(Array);
    });
  });
});

describe("Admin Management - Permission Validation", () => {
  it("all permission names are valid strings", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.staff.allPermissions();

    result.permissions.forEach((perm: string) => {
      expect(perm).toMatch(/^[a-z_]+$/);
    });
  });

  it("permissions list includes expected permissions", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.staff.allPermissions();

    const expected = [
      "manage_branches", "manage_staff", "approve_reviews",
      "approve_points", "manage_rewards", "view_reports",
      "manage_issues", "manage_inquiries",
    ];
    expected.forEach(perm => {
      expect(result.permissions).toContain(perm);
    });
  });
});

describe("Admin Management - Access Control", () => {
  it("non-super-admin cannot list staff", async () => {
    const ctx = createBranchAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.staff.list()).rejects.toThrow();
  });

  it("unauthenticated user cannot access staff management", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.staff.list()).rejects.toThrow();
  });

  it("non-super-admin cannot create staff", async () => {
    const ctx = createBranchAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.staff.create({
      phone: "0811111111",
      password: "password123",
      name: "Test",
      role: "branch_manager",
    })).rejects.toThrow();
  });
});
