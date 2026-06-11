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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Pencil, Trash2, MapPin, Loader2, Tag, Percent, Users, Key, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function BranchManagement() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [commissionMode, setCommissionMode] = useState<"product" | "staff">("product");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) { toast.error("ไม่มีสิทธิ์เข้าถึง (Super Admin เท่านั้น)"); setLocation("/admin"); }
  }, [loading, session, isSuperAdmin, setLocation]);

  const utils = trpc.useUtils();
  const { data: branches, isLoading } = trpc.branches.listAll.useQuery(undefined, { enabled: !!session && isSuperAdmin });

  const createMutation = trpc.branches.create.useMutation({
    onSuccess: () => { toast.success("สร้างสาขาสำเร็จ"); utils.branches.listAll.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.branches.update.useMutation({
    onSuccess: () => { toast.success("อัปเดตสาขาสำเร็จ"); utils.branches.listAll.invalidate(); closeDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.branches.delete.useMutation({
    onSuccess: () => { toast.success("ปิดใช้งานสาขาสำเร็จ"); utils.branches.listAll.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const openCreate = () => { setEditId(null); setName(""); setProvince(""); setAddress(""); setCommissionMode("product"); setShowDialog(true); };
  const openEdit = (b: any) => { setEditId(b.id); setName(b.name); setProvince(b.province || ""); setAddress(b.address || ""); setCommissionMode(b.commissionMode || "product"); setShowDialog(true); };
  const closeDialog = () => { setShowDialog(false); setEditId(null); setName(""); setProvince(""); setAddress(""); setCommissionMode("product"); };

  const handleSave = () => {
    if (!name.trim()) { toast.error("กรุณากรอกชื่อสาขา"); return; }
    if (editId) {
      updateMutation.mutate({ id: editId, name, province: province || undefined, address: address || undefined, commissionMode });
    } else {
      createMutation.mutate({ name, province: province || undefined, address: address || undefined });
    }
  };

  const toggleActive = (b: any) => {
    if (b.isActive) {
      deleteMutation.mutate({ id: b.id });
    } else {
      updateMutation.mutate({ id: b.id, isActive: 1 });
    }
  };

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="จัดการสาขา" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        <Button className="w-full" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มสาขาใหม่
        </Button>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
        ) : !branches?.length ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ยังไม่มีสาขา</p>
          </div>
        ) : (
          branches.map((b) => (
            <Card key={b.id} className={`border-0 shadow-sm ${!b.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{b.name}</p>
                      {!b.isActive && (
                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">ปิดใช้งาน</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {b.province && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {b.province}
                        </p>
                      )}
                      {(b as any).zoneName && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <Tag className="h-2.5 w-2.5 mr-0.5" />
                          {(b as any).zoneName}
                        </Badge>
                      )}
                      {/* Commission Mode Badge */}
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {(b as any).commissionMode === "staff" ? (
                          <><Users className="h-2.5 w-2.5 mr-0.5" />คอมฯ ตามพนักงาน</>
                        ) : (
                          <><Percent className="h-2.5 w-2.5 mr-0.5" />คอมฯ ตามสินค้า</>
                        )}
                      </Badge>
                    </div>
                    {b.address && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{b.address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={!!b.isActive} onCheckedChange={() => toggleActive(b)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {/* PIN Management shortcut */}
                <div className="mt-2 pt-2 border-t border-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 h-7 px-2"
                    onClick={() => setLocation("/pos")}
                  >
                    <Monitor className="h-3 w-3 mr-1" />
                    เปิด POS V2
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
            <DialogTitle>{editId ? "แก้ไขสาขา" : "เพิ่มสาขาใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อสาขา <span className="text-destructive">*</span></Label>
              <Input placeholder="เช่น สาขาสยาม" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>จังหวัด</Label>
              <Input placeholder="เช่น กรุงเทพมหานคร" value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>ที่อยู่</Label>
              <Textarea placeholder="ที่อยู่เต็ม..." value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
            </div>
            {editId && (
              <div className="space-y-2">
                <Label>โหมดคอมมิชชั่น</Label>
                <Select value={commissionMode} onValueChange={(v) => setCommissionMode(v as "product" | "staff")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">
                      <div className="flex items-center gap-2">
                        <Percent className="h-3.5 w-3.5" />
                        <span>ตั้งจากสินค้า</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        <span>ตั้งจากพนักงาน</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {commissionMode === "product"
                    ? "คอมมิชชั่นคำนวณจากค่าที่ตั้งไว้ในแต่ละสินค้า (% หรือ บาท)"
                    : "คอมมิชชั่นคำนวณจากค่าที่ตั้งไว้ในแต่ละพนักงาน (% หรือ บาท ของยอดขาย)"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeDialog}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editId ? "บันทึก" : "สร้างสาขา"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
