import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Settings, Percent, DollarSign, Loader2, Building } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatPrice(satang: number) {
  return (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

export default function AdminCommissions() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: branches } = trpc.branches.list.useQuery();
  const { data: settings, isLoading } = trpc.commissions.settings.useQuery();

  const [showDialog, setShowDialog] = useState(false);
  const [editBranchId, setEditBranchId] = useState<string>("");
  const [commissionRate, setCommissionRate] = useState("10");

  const upsertMutation = trpc.commissions.upsert.useMutation({
    onSuccess: () => {
      toast.success("บันทึกอัตราคอมมิชชันแล้ว");
      utils.commissions.settings.invalidate();
      setShowDialog(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (loading) return null;
  if (!session || !isSuperAdmin) {
    setLocation("/admin");
    return null;
  }

  const openAdd = () => {
    setEditBranchId("");
    setCommissionRate("10");
    setShowDialog(true);
  };
  const openEdit = (s: any) => {
    setEditBranchId(String(s.branchId));
    setCommissionRate(String(s.commissionRate));
    setShowDialog(true);
  };

  return (
    <AdminPageWrapper title="คอมมิชชัน" backPath="/admin" loading={isLoading}>
      <div className="p-4 pb-8 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Settings className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">สาขาที่ตั้งค่า</p>
              <p className="text-xl font-bold">{settings?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Percent className="w-6 h-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">อัตราเฉลี่ย</p>
              <p className="text-xl font-bold">
                {settings && settings.length > 0
                  ? (settings.reduce((a: number, b: any) => a + b.commissionRate, 0) / settings.length).toFixed(1)
                  : "0"}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Settings */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">อัตราคอมมิชชันสาขา</CardTitle>
              <Button size="sm" onClick={openAdd} className="gap-1">
                <Settings className="w-3 h-3" /> ตั้งค่า
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
            ) : !settings || settings.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">ยังไม่ได้ตั้งค่าคอมมิชชัน</p>
                <p className="text-xs mt-1">กดปุ่ม "ตั้งค่า" เพื่อกำหนดอัตราคอมมิชชันให้แต่ละสาขา</p>
              </div>
            ) : (
              <div className="space-y-2">
                {settings.map((s: any) => {
                  const branch = branches?.find((b) => b.id === s.branchId);
                  return (
                    <div
                      key={s.branchId}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => openEdit(s)}
                    >
                      <div>
                        <p className="font-medium text-sm">{branch?.name || `สาขา #${s.branchId}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-lg">{s.commissionRate}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3 text-sm space-y-1">
            <p className="font-medium text-primary">วิธีการทำงานของคอมมิชชัน</p>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
              <li>เมื่อลูกค้าสั่งซื้อผ่านโค้ดของสาขา ระบบจะคำนวณคอมมิชชันอัตโนมัติ</li>
              <li>คอมมิชชันจะถูกบันทึกเมื่อคำสั่งซื้อสถานะ "ได้รับสินค้าแล้ว"</li>
              <li>สามารถตั้งค่าอัตราคอมมิชชันแตกต่างกันได้ในแต่ละสาขา</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Upsert Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ตั้งค่าคอมมิชชัน</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>สาขา</Label>
              <Select value={editBranchId} onValueChange={setEditBranchId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
                <SelectContent>
                  {branches?.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>อัตราคอมมิชชัน (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
            <Button
              disabled={!editBranchId || upsertMutation.isPending}
              onClick={() => {
                upsertMutation.mutate({
                  branchId: parseInt(editBranchId),
                  commissionRate: commissionRate || "10",
                });
              }}
            >
              {upsertMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
