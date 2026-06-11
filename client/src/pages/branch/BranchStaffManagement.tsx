import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import BranchSelector from "@/components/BranchSelector";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useBranchSelector } from "@/hooks/useBranchSelector";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Plus, Pencil, Phone, Mail, Shield, Loader2, Key, BadgeCheck, UserX, UserCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/useMobile";

const roleLabels: Record<string, string> = {
  branch_manager: "ผู้จัดการสาขา",
  branch_staff: "พนักงานสาขา",
};

const roleColors: Record<string, string> = {
  branch_manager: "bg-blue-100 text-blue-700",
  branch_staff: "bg-sky-100 text-sky-700",
};

interface StaffForm {
  phone: string;
  password: string;
  name: string;
  email: string;
  employeeCode: string;
  role: string;
  permissions: string[];
}

const emptyForm: StaffForm = {
  phone: "", password: "", name: "", email: "", employeeCode: "",
  role: "branch_staff", permissions: [],
};

const permissionLabels: Record<string, string> = {
  approve_reviews: "อนุมัติรีวิว",
  approve_points: "อนุมัติแต้ม",
  manage_issues: "จัดการปัญหา",
  view_reports: "ดูรายงาน",
  view_customers: "ดูข้อมูลลูกค้า",
  manage_accounting: "จัดการบัญชีสาขา",
};

export default function BranchStaffManagement() {
  const isMobile = useIsMobile();
  const { session, loading, isBranchOwner, isAreaManager } = useHibiAuth();
  const { selectedBranchId, setSelectedBranchId, currentBranchName, branchIdParam, needsSelector, managedBranches } = useBranchSelector();
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<StaffForm>({ ...emptyForm });
  const [showPermissions, setShowPermissions] = useState(false);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isBranchOwner && !isAreaManager) {
      toast.error("เฉพาะเจ้าของสาขา/เจ้าของแฟรนไชส์เท่านั้น");
      setLocation("/branch");
    }
  }, [loading, session, isBranchOwner, isAreaManager, setLocation]);

  const utils = trpc.useUtils();
  const canManage = isBranchOwner || isAreaManager;
  const { data: staffList, isLoading } = trpc.branchStaff.list.useQuery({ branchId: branchIdParam }, { enabled: !!session && canManage });
  const { data: permData } = trpc.branchStaff.allPermissions.useQuery(undefined, { enabled: !!session && canManage });

  const allPermissions = permData?.permissions || [];
  const defaultRolePerms = permData?.defaultRolePermissions || {};

  const createMutation = trpc.branchStaff.create.useMutation({
    onSuccess: () => { toast.success("สร้างพนักงานสำเร็จ"); utils.branchStaff.list.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.branchStaff.update.useMutation({
    onSuccess: () => { toast.success("อัปเดตพนักงานสำเร็จ"); utils.branchStaff.list.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.branchStaff.delete.useMutation({
    onSuccess: () => { toast.success("ปิดใช้งานพนักงานสำเร็จ"); utils.branchStaff.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const reactivateMutation = trpc.branchStaff.reactivate.useMutation({
    onSuccess: () => { toast.success("เปิดใช้งานพนักงานกลับสำเร็จ"); utils.branchStaff.list.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditId(null);
    const defaultPerms = defaultRolePerms["branch_staff"] || [];
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
      permissions: s.permissions || [],
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

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("กรุณากรอกชื่อ"); return; }
    if (editId) {
      updateMutation.mutate({
        id: editId,
        name: form.name,
        email: form.email || undefined,
        employeeCode: form.employeeCode || null,
        role: form.role as "branch_manager" | "branch_staff",
        password: form.password || undefined,
        permissions: form.permissions,
      });
    } else {
      if (!form.phone.trim()) { toast.error("กรุณากรอกเบอร์โทร"); return; }
      if (!form.password || form.password.length < 6) { toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัว"); return; }
      createMutation.mutate({
        phone: form.phone,
        password: form.password,
        name: form.name,
        email: form.email || undefined,
        employeeCode: form.employeeCode || undefined,
        role: form.role as "branch_manager" | "branch_staff",
        permissions: form.permissions,
        branchId: branchIdParam,
      });
    }
  };

  const activeStaff = useMemo(() => staffList?.filter(s => s.isActive) || [], [staffList]);
  const inactiveStaff = useMemo(() => staffList?.filter(s => !s.isActive) || [], [staffList]);

  if (loading || !session) return null;

  return (
    <MobileLayout title={`จัดการพนักงาน${currentBranchName ? ` - ${currentBranchName}` : ""}`} showBack backPath="/branch">
      <PremiumPageContent>
        {/* Branch Selector for Franchise Owner */}
        <BranchSelector
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          managedBranches={managedBranches}
          needsSelector={needsSelector}
        />
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              พนักงานในสาขา
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentBranchName || session.branchName || "สาขาของคุณ"} — {activeStaff.length} คน
            </p>
          </div>
          <Button size={isMobile ? "default" : "sm"} onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            เพิ่ม
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : activeStaff.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">ยังไม่มีพนักงานในสาขา</p>
              <Button variant="outline" size={isMobile ? "default" : "sm"} className="mt-3" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> เพิ่มพนักงานคนแรก
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeStaff.map((s: any) => (
              <Card key={s.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{s.name}</p>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${roleColors[s.role] || ""}`}>
                          {roleLabels[s.role] || s.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {s.phone}
                      </div>
                      {s.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {s.email}
                        </div>
                      )}
                      {s.employeeCode && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BadgeCheck className="h-3 w-3" /> {s.employeeCode}
                        </div>
                      )}
                      {s.permissions && s.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {s.permissions.map((p: string) => (
                            <span key={p} className="text-[9px] px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground">
                              {permissionLabels[p] || p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`ปิดใช้งาน ${s.name}?`)) deleteMutation.mutate({ id: s.id });
                        }}
                      >
                        <UserX className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Inactive staff */}
        {inactiveStaff.length > 0 && (
          <div className="space-y-2 mt-6">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <UserX className="h-4 w-4" /> ปิดใช้งาน ({inactiveStaff.length})
            </h3>
            {inactiveStaff.map((s: any) => (
              <Card key={s.id} className="border-0 shadow-sm opacity-60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium line-through">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.phone}</p>
                      {s.role && (
                        <Badge variant="secondary" className={`text-[9px] px-1 py-0 mt-1 ${roleColors[s.role] || ""}`}>
                          {roleLabels[s.role] || s.role}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        className="h-7 text-xs gap-1 border-green-200 text-green-600 hover:bg-green-50"
                        onClick={() => {
                          if (confirm(`เปิดใช้งาน ${s.name} กลับ?`)) reactivateMutation.mutate({ id: s.id });
                        }}
                        disabled={reactivateMutation.isPending}
                      >
                        <UserCheck className="h-3 w-3" />
                        เปิดใช้งาน
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editId ? "แก้ไขพนักงาน" : "เพิ่มพนักงานใหม่"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Phone - only for create */}
              {!editId && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> เบอร์โทร <span className="text-destructive">*</span>
                  </Label>
                  <Input placeholder="08XXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5" /> รหัสผ่าน {!editId && <span className="text-destructive">*</span>}
                </Label>
                <Input type="password" placeholder={editId ? "เว้นว่างไว้ถ้าไม่เปลี่ยน" : "อย่างน้อย 6 ตัว"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label>ชื่อ <span className="text-destructive">*</span></Label>
                <Input placeholder="ชื่อพนักงาน" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> อีเมล
                </Label>
                <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>

              {/* Employee Code */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <BadgeCheck className="h-3.5 w-3.5" /> รหัสพนักงาน
                </Label>
                <Input placeholder="เช่น HB-001" value={form.employeeCode} onChange={e => setForm({ ...form, employeeCode: e.target.value })} />
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
                    <SelectItem value="branch_manager">ผู้จัดการสาขา — ดูแลสาขาตามสิทธิ์</SelectItem>
                    <SelectItem value="branch_staff">พนักงานสาขา — สิทธิ์จำกัด</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <button
                  type="button"
                  className="text-sm text-primary font-medium flex items-center gap-1"
                  onClick={() => setShowPermissions(!showPermissions)}
                >
                  <Shield className="h-3.5 w-3.5" />
                  {showPermissions ? "ซ่อนสิทธิ์" : "กำหนดสิทธิ์เพิ่มเติม"}
                </button>
                {showPermissions && (
                  <div className="space-y-2 pl-1 border-l-2 border-primary/20 ml-1">
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
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={closeDialog}>ยกเลิก</Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {editId ? "บันทึก" : "สร้าง"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PremiumPageContent>
    </MobileLayout>
  );
}
