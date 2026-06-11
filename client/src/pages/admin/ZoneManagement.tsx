import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Pencil, Loader2, Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ZoneManagement() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expandedZone, setExpandedZone] = useState<number | null>(null);

  // Assign branch to zone
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignBranchId, setAssignBranchId] = useState<string>("");
  const [assignZoneId, setAssignZoneId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) {
      toast.error("ไม่มีสิทธิ์เข้าถึง (Super Admin เท่านั้น)");
      setLocation("/admin");
    }
  }, [loading, session, isSuperAdmin, setLocation]);

  const utils = trpc.useUtils();
  const { data: zones, isLoading } = trpc.zones.list.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: allBranches } = trpc.branches.listAll.useQuery(undefined, { enabled: !!session && isSuperAdmin });

  const createMutation = trpc.zones.create.useMutation({
    onSuccess: () => { toast.success("สร้างเขตบริการสำเร็จ"); utils.zones.list.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.zones.update.useMutation({
    onSuccess: () => { toast.success("อัปเดตเขตบริการสำเร็จ"); utils.zones.list.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });
  const assignBranchMutation = trpc.zones.assignBranch.useMutation({
    onSuccess: () => {
      toast.success("กำหนดสาขาเข้าเขตบริการสำเร็จ");
      utils.zones.list.invalidate();
      utils.branches.listAll.invalidate();
      setShowAssignDialog(false);
      setAssignBranchId("");
    },
    onError: (err) => toast.error(err.message),
  });
  const removeBranchMutation = trpc.zones.assignBranch.useMutation({
    onSuccess: () => {
      toast.success("นำสาขาออกจากเขตบริการสำเร็จ");
      utils.zones.list.invalidate();
      utils.branches.listAll.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openCreate = () => { setEditId(null); setName(""); setDescription(""); setShowDialog(true); };
  const openEdit = (z: any) => { setEditId(z.id); setName(z.name); setDescription(z.description || ""); setShowDialog(true); };
  const closeDialog = () => { setShowDialog(false); setEditId(null); setName(""); setDescription(""); };

  const handleSave = () => {
    if (!name.trim()) { toast.error("กรุณากรอกชื่อเขตบริการ"); return; }
    if (editId) {
      updateMutation.mutate({ id: editId, name, description: description || undefined });
    } else {
      createMutation.mutate({ name, description: description || undefined });
    }
  };

  const openAssign = (zoneId: number) => {
    setAssignZoneId(zoneId);
    setAssignBranchId("");
    setShowAssignDialog(true);
  };

  const handleAssign = () => {
    if (!assignBranchId || !assignZoneId) return;
    assignBranchMutation.mutate({ branchId: Number(assignBranchId), zoneId: assignZoneId });
  };

  // Get branches not in any zone (or in a different zone)
  const unassignedBranches = allBranches?.filter((b: any) => !b.zoneId || b.zoneId !== assignZoneId) ?? [];

  // Group branches by zone
  const getBranchesInZone = (zoneId: number) => {
    return allBranches?.filter((b: any) => b.zoneId === zoneId) ?? [];
  };

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="จัดการเขตบริการ" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        <Button className="w-full" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มเขตบริการใหม่
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !zones?.length ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ยังไม่มีเขตบริการ</p>
            <p className="text-muted-foreground text-xs mt-1">สร้างเขตบริการเพื่อจัดกลุ่มสาขา</p>
          </div>
        ) : (
          zones.map((zone: any) => {
            const zoneBranches = getBranchesInZone(zone.id);
            const isExpanded = expandedZone === zone.id;
            return (
              <Card key={zone.id} className={`border-0 shadow-sm ${!zone.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedZone(isExpanded ? null : zone.id)}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <p className="font-medium text-sm">{zone.name}</p>
                        {!zone.isActive && (
                          <Badge variant="secondary" className="text-[10px]">ปิดใช้งาน</Badge>
                        )}
                      </div>
                      {zone.description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">{zone.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 ml-6">
                        <Badge variant="outline" className="text-[10px]">
                          <Building2 className="h-3 w-3 mr-1" />
                          {zoneBranches.length} สาขา
                        </Badge>
                        {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(zone)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Expanded: show branches in this zone */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {zoneBranches.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">ยังไม่มีสาขาในเขตนี้</p>
                      ) : (
                        zoneBranches.map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-sm font-medium">{b.name}</p>
                              {b.province && <p className="text-xs text-muted-foreground">{b.province}</p>}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-destructive h-7"
                              onClick={() => removeBranchMutation.mutate({ branchId: b.id, zoneId: null })}
                            >
                              นำออก
                            </Button>
                          </div>
                        ))
                      )}
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => openAssign(zone.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        เพิ่มสาขาเข้าเขตนี้
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Zone Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "แก้ไขเขตบริการ" : "เพิ่มเขตบริการใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อเขตบริการ <span className="text-destructive">*</span></Label>
              <Input placeholder="เช่น เขตกรุงเทพเหนือ" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Textarea placeholder="รายละเอียดเขตบริการ..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Branch Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>เพิ่มสาขาเข้าเขตบริการ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>เลือกสาขา</Label>
              <Select value={assignBranchId} onValueChange={setAssignBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสาขา..." />
                </SelectTrigger>
                <SelectContent>
                  {unassignedBranches.map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name} {b.zoneId ? "(ย้ายจากเขตอื่น)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleAssign} disabled={!assignBranchId || assignBranchMutation.isPending}>
              {assignBranchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              เพิ่มสาขา
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
