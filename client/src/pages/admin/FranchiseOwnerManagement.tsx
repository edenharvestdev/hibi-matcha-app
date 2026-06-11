import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Handshake, Plus, Pencil, Loader2, Building2, Phone, Mail, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function FranchiseOwnerManagement() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Branch assignment dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) { toast.error("ไม่มีสิทธิ์เข้าถึง"); setLocation("/admin"); }
  }, [loading, session, isSuperAdmin, setLocation]);

  const utils = trpc.useUtils();
  const { data: owners, isLoading } = trpc.franchiseOwners.list.useQuery(
    { activeOnly: false },
    { enabled: !!session && isSuperAdmin }
  );
  const { data: allBranches } = trpc.branches.listAll.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: ownerBranches } = trpc.franchiseOwners.branches.useQuery(
    { franchiseOwnerId: selectedOwnerId! },
    { enabled: !!selectedOwnerId }
  );

  const createMutation = trpc.franchiseOwners.create.useMutation({
    onSuccess: () => { toast.success("สร้างเจ้าของแฟรนไชส์สำเร็จ"); utils.franchiseOwners.list.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.franchiseOwners.update.useMutation({
    onSuccess: () => { toast.success("อัปเดตสำเร็จ"); utils.franchiseOwners.list.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const assignMutation = trpc.franchiseOwners.assignBranch.useMutation({
    onSuccess: () => {
      toast.success("ผูกสาขาสำเร็จ");
      utils.franchiseOwners.branches.invalidate();
      utils.branches.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditId(null); setName(""); setCompanyName(""); setPhone(""); setEmail("");
    setShowDialog(true);
  };

  const openEdit = (o: any) => {
    setEditId(o.id); setName(o.name); setCompanyName(o.companyName || "");
    setPhone(o.phone || ""); setEmail(o.email || "");
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false); setEditId(null);
    setName(""); setCompanyName(""); setPhone(""); setEmail("");
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error("กรุณากรอกชื่อ"); return; }
    if (editId) {
      updateMutation.mutate({
        id: editId, name,
        companyName: companyName || null,
        phone: phone || null,
        email: email || null,
      });
    } else {
      createMutation.mutate({
        name,
        companyName: companyName || undefined,
        phone: phone || undefined,
        email: email || undefined,
      });
    }
  };

  const toggleActive = (o: any) => {
    updateMutation.mutate({ id: o.id, isActive: o.isActive ? 0 : 1 });
  };

  const openAssign = (ownerId: number) => {
    setSelectedOwnerId(ownerId);
    setShowAssignDialog(true);
  };

  const handleAssign = (branchId: number, currentOwnerId: number | null) => {
    if (currentOwnerId === selectedOwnerId) {
      // Remove assignment
      assignMutation.mutate({ branchId, franchiseOwnerId: null });
    } else {
      assignMutation.mutate({ branchId, franchiseOwnerId: selectedOwnerId });
    }
  };

  if (loading || !session) return null;

  const ownerBranchIds = new Set((ownerBranches || []).map((b: any) => b.id));

  return (
    <AdminPageWrapper title="เจ้าของแฟรนไชส์" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        <Button className="w-full" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มเจ้าของแฟรนไชส์
        </Button>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
        ) : !owners?.length ? (
          <div className="text-center py-12">
            <Handshake className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ยังไม่มีเจ้าของแฟรนไชส์</p>
          </div>
        ) : (
          owners.map((o: any) => (
            <Card key={o.id} className={`border-0 shadow-sm ${!o.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{o.name}</p>
                      {!o.isActive && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">ปิดใช้งาน</span>
                      )}
                    </div>
                    {o.companyName && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Briefcase className="h-3 w-3" />
                        {o.companyName}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {o.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {o.phone}
                        </p>
                      )}
                      {o.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {o.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={!!o.isActive} onCheckedChange={() => toggleActive(o)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {/* Branch assignment button */}
                <div className="mt-3 pt-3 border-t">
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => openAssign(o.id)}>
                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                    จัดการสาขา
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "แก้ไขเจ้าของแฟรนไชส์" : "เพิ่มเจ้าของแฟรนไชส์"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อ <span className="text-destructive">*</span></Label>
              <Input placeholder="ชื่อเจ้าของ" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>ชื่อบริษัท</Label>
              <Input placeholder="ชื่อบริษัท/ห้างหุ้นส่วน" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>เบอร์โทร</Label>
              <Input placeholder="0812345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeDialog}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Branch Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ผูกสาขากับเจ้าของแฟรนไชส์</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-3">
            กดเลือกสาขาที่ต้องการผูก กดอีกครั้งเพื่อยกเลิก
          </p>
          <div className="space-y-2">
            {allBranches?.map((b: any) => {
              const isAssigned = ownerBranchIds.has(b.id);
              const assignedToOther = b.franchiseOwnerId && b.franchiseOwnerId !== selectedOwnerId;
              const otherOwner = assignedToOther ? owners?.find((o: any) => o.id === b.franchiseOwnerId) : null;
              return (
                <Card
                  key={b.id}
                  className={`cursor-pointer transition-all border ${isAssigned ? "border-primary bg-primary/5" : assignedToOther ? "border-orange-200 bg-orange-50/50" : "border-border"}`}
                  onClick={() => !assignedToOther && handleAssign(b.id, isAssigned ? selectedOwnerId : null)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{b.name}</p>
                      {b.province && <p className="text-xs text-muted-foreground">{b.province}</p>}
                      {assignedToOther && otherOwner && (
                        <Badge variant="outline" className="text-[10px] mt-1 text-orange-600 border-orange-300">
                          ผูกกับ: {(otherOwner as any).name}
                        </Badge>
                      )}
                    </div>
                    {isAssigned && (
                      <Badge className="bg-primary text-primary-foreground text-[10px]">ผูกแล้ว</Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
