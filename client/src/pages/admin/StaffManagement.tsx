import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Pencil, Phone, Mail, Building2, Shield, Loader2, Key, MapPin, BadgeCheck, Copy, Coins } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  area_manager: "เจ้าของแฟรนไชส์",
  branch_owner: "เจ้าของสาขา",
  branch_manager: "ผู้จัดการสาขา",
  branch_staff: "พนักงานสาขา",
  support_staff: "เจ้าหน้าที่ซัพพอร์ต",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  area_manager: "bg-amber-100 text-amber-700",
  branch_owner: "bg-indigo-100 text-indigo-700",
  branch_manager: "bg-blue-100 text-blue-700",
  branch_staff: "bg-sky-100 text-sky-700",
  support_staff: "bg-green-100 text-green-700",
};

const permissionLabels: Record<string, string> = {
  manage_branches: "จัดการสาขา",
  manage_staff: "จัดการพนักงาน",
  approve_reviews: "อนุมัติรีวิว",
  approve_points: "อนุมัติแต้ม",
  manage_rewards: "จัดการรางวัล",
  view_reports: "ดูรายงาน",
  manage_issues: "จัดการปัญหา",
  manage_inquiries: "จัดการข้อมูลติดต่อ",
  manage_customers: "จัดการลูกค้า",
  view_audit_logs: "ดู Audit Logs",
  manage_accounting: "จัดการบัญชีสาขา",
};

interface StaffForm {
  phone: string;
  password: string;
  name: string;
  email: string;
  employeeCode: string;
  role: string;
  branchId: string;
  assignedBranchIds: number[];
  permissions: string[];
  commissionType: string;
  commissionValue: string;
}

const emptyForm: StaffForm = {
  phone: "", password: "", name: "", email: "", employeeCode: "",
  role: "branch_manager", branchId: "",
  assignedBranchIds: [], permissions: [],
  commissionType: "percent", commissionValue: "",
};

export default function StaffManagement() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StaffForm>({ ...emptyForm });
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) { toast.error("ไม่มีสิทธิ์เข้าถึง (Super Admin เท่านั้น)"); setLocation("/admin"); }
  }, [loading, session, isSuperAdmin, setLocation]);

  const utils = trpc.useUtils();
  const { data: staffList, isLoading } = trpc.staff.list.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: branches } = trpc.branches.list.useQuery(undefined, { enabled: !!session });
  const { data: permData } = trpc.staff.allPermissions.useQuery(undefined, { enabled: !!session && isSuperAdmin });

  const allPermissions = permData?.permissions || [];
  const defaultRolePerms = permData?.defaultRolePermissions || {};

  const createMutation = trpc.staff.create.useMutation({
    onSuccess: () => { toast.success("สร้างพนักงานสำเร็จ"); utils.staff.list.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => { toast.success("อัปเดตพนักงานสำเร็จ"); utils.staff.list.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.staff.delete.useMutation({
    onSuccess: () => { toast.success("ปิดใช้งานพนักงานสำเร็จ"); utils.staff.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const branchMap = useMemo(() => {
    const map: Record<number, string> = {};
    branches?.forEach((b) => { map[b.id] = b.name; });
    return map;
  }, [branches]);

  const openCreate = () => {
    setEditId(null);
    const defaultPerms = defaultRolePerms["branch_manager"] || [];
    setForm({ ...emptyForm, permissions: [...defaultPerms] });
    setShowPermissions(false);
    setShowDialog(true);
  };

  const openEdit = (s: any) => {
    setEditId(s.id);
    setForm({
      phone: s.phone,
      password: "",
      name: s.name,
      email: s.email || "",
      employeeCode: s.employeeCode || "",
      role: s.role,
      branchId: s.branchId ? String(s.branchId) : "",
      assignedBranchIds: s.assignedBranchIds || [],
      permissions: s.permissions || [],
      commissionType: s.commissionType || "percent",
      commissionValue: s.commissionValue ? String(s.commissionType === "percent" ? s.commissionValue / 100 : s.commissionValue / 100) : "",
    });
    setShowPermissions(false);
    setShowDialog(true);
  };

  const closeDialog = () => { setShowDialog(false); setEditId(null); };

  const handleRoleChange = (role: string) => {
    const defaultPerms = defaultRolePerms[role] || [];
    setForm({ ...form, role, permissions: [...defaultPerms] });
  };

  const togglePermission = (perm: string) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const toggleBranch = (branchId: number) => {
    setForm(prev => ({
      ...prev,
      assignedBranchIds: prev.assignedBranchIds.includes(branchId)
        ? prev.assignedBranchIds.filter(id => id !== branchId)
        : [...prev.assignedBranchIds, branchId],
    }));
  };

  // Convert commission value from display to storage format
  const getCommissionStorageValue = () => {
    const val = parseFloat(form.commissionValue);
    if (isNaN(val) || val <= 0) return undefined;
    if (form.commissionType === "percent") {
      return Math.round(val * 100); // e.g. 5% → 500 basis points
    } else {
      return Math.round(val * 100); // e.g. 20 baht → 2000 satang
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("กรุณากรอกชื่อ"); return; }
    const commValue = getCommissionStorageValue();
    if (editId) {
      updateMutation.mutate({
        id: editId,
        name: form.name,
        email: form.email || undefined,
        employeeCode: form.employeeCode || null,
        role: form.role as any,
        branchId: form.branchId ? parseInt(form.branchId) : null,
        password: form.password || undefined,
        assignedBranchIds: form.assignedBranchIds,
        permissions: form.permissions,
        commissionType: form.commissionType as "percent" | "fixed" | undefined,
        commissionValue: commValue,
      });
    } else {
      if (!form.phone.trim()) { toast.error("กรุณากรอกเบอร์โทร"); return; }
      if (!form.password || form.password.length < 6) { toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return; }
      createMutation.mutate({
        phone: form.phone,
        password: form.password,
        name: form.name,
        email: form.email || undefined,
        employeeCode: form.employeeCode || undefined,
        role: form.role as any,
        branchId: form.branchId ? parseInt(form.branchId) : undefined,
        assignedBranchIds: form.assignedBranchIds,
        permissions: form.permissions,
        commissionType: form.commissionType as "percent" | "fixed" | undefined,
        commissionValue: commValue,
      });
    }
  };

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="จัดการพนักงาน" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        <Button className="w-full" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มพนักงาน / แอดมินใหม่
        </Button>

        {/* Role Legend */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(roleLabels).map(([role, label]) => (
            <span key={role} className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${roleColors[role]}`}>
              {label}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
        ) : !staffList?.length ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ยังไม่มีพนักงาน</p>
          </div>
        ) : (
          staffList.map((s: any) => (
            <Card key={s.id} className={`border-0 shadow-sm ${!s.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{s.name}</p>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${roleColors[s.role] || "bg-gray-100 text-gray-700"}`}>
                        {roleLabels[s.role] || s.role}
                      </span>
                      {!s.isActive && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">ปิดใช้งาน</span>
                      )}
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3 shrink-0" /> {s.phone}
                      </p>
                      {s.employeeCode && (
                        <p className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                          <BadgeCheck className="h-3 w-3 shrink-0" /> {s.employeeCode}
                          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(s.employeeCode); toast.success("คัดลอกรหัสพนักงานแล้ว"); }} className="ml-1 text-muted-foreground hover:text-foreground">
                            <Copy className="h-3 w-3" />
                          </button>
                        </p>
                      )}
                      {s.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" /> {s.email}
                        </p>
                      )}
                      {s.branchId && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3 shrink-0" /> {branchMap[s.branchId] || `สาขา #${s.branchId}`}
                        </p>
                      )}
                      {s.assignedBranchIds?.length > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" /> ดูแล {s.assignedBranchIds.length} สาขา
                        </p>
                      )}
                      {s.commissionType && s.commissionValue > 0 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <Coins className="h-3 w-3 shrink-0" />
                          คอม: {s.commissionType === "percent"
                            ? `${(s.commissionValue / 100).toFixed(2)}%`
                            : `฿${(s.commissionValue / 100).toFixed(0)}/ชิ้น`}
                        </p>
                      )}
                      {s.permissions?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.permissions.slice(0, 3).map((p: string) => (
                            <Badge key={p} variant="outline" className="text-[9px] px-1.5 py-0">
                              {permissionLabels[p] || p}
                            </Badge>
                          ))}
                          {s.permissions.length > 3 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              +{s.permissions.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={!!s.isActive} onCheckedChange={() => {
                      if (s.isActive) deleteMutation.mutate({ id: s.id });
                      else updateMutation.mutate({ id: s.id, name: s.name });
                    }} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน / แอดมินใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editId && (
              <div className="space-y-2">
                <Label>เบอร์โทร <span className="text-destructive">*</span></Label>
                <Input placeholder="0812345678" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label>ชื่อ <span className="text-destructive">*</span></Label>
              <Input placeholder="ชื่อพนักงาน" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{editId ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน"} {!editId && <span className="text-destructive">*</span>}</Label>
              <Input type="password" placeholder="อย่างน้อย 6 ตัวอักษร" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5" /> รหัสพนักงาน
              </Label>
              <Input
                placeholder="เช่น EMP001"
                value={form.employeeCode}
                onChange={(e) => setForm({ ...form, employeeCode: e.target.value.toUpperCase() })}
              />
              <p className="text-[10px] text-muted-foreground">ใช้สำหรับเข้าสู่ระบบหน้าพนักงาน (ไม่ซ้ำกับคนอื่น)</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="staff@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" /> บทบาท <span className="text-destructive">*</span>
              </Label>
              <Select value={form.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="branch_owner">เจ้าของสาขา — สิทธิ์เต็มในสาขาตัวเอง</SelectItem>
                  <SelectItem value="branch_manager">ผู้จัดการสาขา — ดูแลสาขาตามสิทธิ์ที่กำหนด</SelectItem>
                  <SelectItem value="branch_staff">พนักงานสาขา — สิทธิ์จำกัดตามที่กำหนด</SelectItem>
                  <SelectItem value="area_manager">เจ้าของแฟรนไชส์ — ดูแลหลายสาขา</SelectItem>
                  <SelectItem value="support_staff">เจ้าหน้าที่ซัพพอร์ต — จัดการปัญหา+ติดต่อ</SelectItem>
                  <SelectItem value="super_admin">Super Admin — เข้าถึงทุกอย่าง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch for branch roles */}
            {["branch_owner", "branch_manager", "branch_staff"].includes(form.role) && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> สาขาที่รับผิดชอบ
                </Label>
                <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Multi-branch for area_manager */}
            {form.role === "area_manager" && branches && branches.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> สาขาที่เป็นเจ้าของ (เลือกได้หลายสาขา)
                </Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto bg-muted/30">
                  {branches.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={form.assignedBranchIds.includes(b.id)}
                        onCheckedChange={() => toggleBranch(b.id)}
                      />
                      <span className="text-sm">{b.name}</span>
                    </label>
                  ))}
                </div>
                {form.assignedBranchIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">เลือกแล้ว {form.assignedBranchIds.length} สาขา</p>
                )}
              </div>
            )}

            {/* Permissions */}
            {form.role !== "super_admin" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" /> สิทธิ์การใช้งาน
                  </Label>
                  {/* Single franchisee (1 branch) cannot edit permissions themselves */}
                  {!(form.role === "area_manager" && form.assignedBranchIds.length <= 1) && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setShowPermissions(!showPermissions)}>
                      {showPermissions ? "ซ่อน" : "กำหนดเอง"}
                    </Button>
                  )}
                </div>
                {/* Single franchisee restriction note */}
                {form.role === "area_manager" && form.assignedBranchIds.length <= 1 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      เจ้าของแฟรนไชส์รายเดี่ยว (สาขาเดียว) — สิทธิ์กำหนดโดย Super Admin เท่านั้น
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.permissions.map(p => (
                        <Badge key={p} variant="secondary" className="text-[10px]">
                          {permissionLabels[p] || p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* Normal permission display/edit for non-single-franchisee */}
                {!(form.role === "area_manager" && form.assignedBranchIds.length <= 1) && (
                  <>
                    {!showPermissions ? (
                      <div className="flex flex-wrap gap-1">
                        {form.permissions.map(p => (
                          <Badge key={p} variant="secondary" className="text-[10px]">
                            {permissionLabels[p] || p}
                          </Badge>
                        ))}
                        {form.permissions.length === 0 && (
                          <p className="text-xs text-muted-foreground">ไม่มีสิทธิ์</p>
                        )}
                      </div>
                    ) : (
                      <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                        {allPermissions.map((perm: string) => (
                          <label key={perm} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={form.permissions.includes(perm)}
                              onCheckedChange={() => togglePermission(perm)}
                            />
                            <span className="text-sm">{permissionLabels[perm] || perm}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {form.role === "super_admin" && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-700 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Super Admin มีสิทธิ์เข้าถึงทุกอย่างโดยอัตโนมัติ
                </p>
              </div>
            )}

            {/* Commission Settings (for branch staff/manager) */}
            {["branch_staff", "branch_manager", "branch_owner"].includes(form.role) && (
              <div className="space-y-3 border-t pt-4">
                <Label className="flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5" /> คอมมิชชั่นพนักงาน
                </Label>
                <p className="text-[10px] text-muted-foreground -mt-2">ใช้เมื่อสาขาตั้งโหมดคอมมิชชั่น "ตามพนักงาน" (Mode B)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">ประเภท</Label>
                    <Select value={form.commissionType} onValueChange={(v) => setForm({ ...form, commissionType: v })}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">เปอร์เซ็นต์ (%)</SelectItem>
                        <SelectItem value="fixed">คงที่ (บาท/ชิ้น)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{form.commissionType === "percent" ? "อัตรา (%)" : "จำนวน (บาท/ชิ้น)"}</Label>
                    <Input
                      type="number"
                      min="0"
                      step={form.commissionType === "percent" ? "0.01" : "1"}
                      placeholder={form.commissionType === "percent" ? "เช่น 5" : "เช่น 20"}
                      value={form.commissionValue}
                      onChange={(e) => setForm({ ...form, commissionValue: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
                {form.commissionValue && parseFloat(form.commissionValue) > 0 && (
                  <p className="text-xs text-amber-600">
                    ตัวอย่าง: ขายสินค้า ฿100 → คอมมิชชั่น{" "}
                    {form.commissionType === "percent"
                      ? `฿${(100 * parseFloat(form.commissionValue) / 100).toFixed(2)}`
                      : `฿${parseFloat(form.commissionValue).toFixed(2)}`}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeDialog}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "บันทึก" : "สร้างพนักงาน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
