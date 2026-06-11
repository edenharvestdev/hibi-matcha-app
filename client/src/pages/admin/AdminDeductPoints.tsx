import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MinusCircle, CheckCircle2, User, Phone, Loader2, Leaf, RotateCcw, AlertTriangle, Store,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MANAGER_ROLES = ["branch_manager", "branch_owner", "area_manager", "super_admin"];

export default function AdminDeductPoints() {
  const { session, loading, isAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  const [phoneInput, setPhoneInput] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [pointsToDeduct, setPointsToDeduct] = useState("");
  const [reason, setReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deductSuccess, setDeductSuccess] = useState<any>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
    if (!loading && session && !MANAGER_ROLES.includes(session.role)) setLocation("/admin");
  }, [loading, session, isAdmin, setLocation]);

  // Fetch branches list
  const { data: branches } = trpc.branches.list.useQuery(undefined, { enabled: !!session });

  // Lookup customer
  const { data: customerData, isLoading: isSearching } = trpc.loyalty.lookupCustomer.useQuery(
    { phone: searchPhone || undefined, customerId: customerId || undefined },
    { enabled: (!!searchPhone || !!customerId) && !!session }
  );

  // Fetch branch-specific points when customer + branch selected
  const { data: branchPointsData } = trpc.loyalty.getCustomerBranchPoints.useQuery(
    { customerId: customerData?.id ?? 0, branchId: parseInt(selectedBranchId) || 0 },
    { enabled: !!customerData && !!selectedBranchId && parseInt(selectedBranchId) > 0 }
  );

  const deductMutation = trpc.loyalty.deductPoints.useMutation({
    onSuccess: (data) => {
      setDeductSuccess(data);
      setShowConfirm(false);
      toast.success(`หักแต้มสำเร็จ! -${data.pointsDeducted} แต้ม`);
    },
    onError: (err) => {
      setShowConfirm(false);
      toast.error(err.message);
    },
  });

  const handlePhoneSearch = () => {
    if (!phoneInput.trim()) { toast.error("กรุณากรอกเบอร์โทร"); return; }
    setCustomerId(null);
    setDeductSuccess(null);
    setSelectedBranchId("");
    setSearchPhone(phoneInput.trim());
  };

  const branchAvailablePoints = branchPointsData?.available ?? 0;
  const selectedBranchName = branches?.find(b => b.id === parseInt(selectedBranchId))?.name || "";

  const handleDeductPoints = () => {
    if (!customerData) return;
    if (!selectedBranchId) { toast.error("กรุณาเลือกสาขาที่ต้องการหักแต้ม"); return; }
    const pts = parseInt(pointsToDeduct);
    if (isNaN(pts) || pts < 1) { toast.error("กรุณาใส่จำนวนแต้มที่ถูกต้อง (ขั้นต่ำ 1)"); return; }
    if (!reason.trim()) { toast.error("กรุณาระบุเหตุผลในการหักแต้ม"); return; }
    if (pts > branchAvailablePoints) {
      toast.error(`แต้มสาขา "${selectedBranchName}" ไม่เพียงพอ (มี ${branchAvailablePoints} แต้ม)`);
      return;
    }
    setShowConfirm(true);
  };

  const confirmDeduct = () => {
    if (!customerData) return;
    deductMutation.mutate({
      customerId: customerData.id,
      points: parseInt(pointsToDeduct),
      reason: reason.trim(),
      branchId: parseInt(selectedBranchId),
    });
  };

  const resetForm = () => {
    setPhoneInput("");
    setSearchPhone("");
    setCustomerId(null);
    setSelectedBranchId("");
    setPointsToDeduct("");
    setReason("");
    setDeductSuccess(null);
    setShowConfirm(false);
  };

  if (loading || !session) return null;
  if (!MANAGER_ROLES.includes(session.role)) return null;

  return (
    <AdminPageWrapper title="หักแต้มลูกค้า" backPath="/admin">
      <div className="space-y-4">
        {/* Search Section */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <MinusCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">หักแต้ม / เพิกถอนแต้ม</p>
                <p className="text-xs text-muted-foreground">ใช้สำหรับแก้ไขกรณีให้แต้มผิด หรือยกเลิกรายการ</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">ค้นหาเบอร์โทรลูกค้า</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="เช่น 0812345678"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()}
                  maxLength={15}
                />
              </div>
              <Button className="w-full" onClick={handlePhoneSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                ค้นหาลูกค้า
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Not Found */}
        {(searchPhone || customerId) && !isSearching && !customerData && (
          <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
            <CardContent className="p-4 text-center">
              <User className="h-10 w-10 text-red-400 mx-auto mb-2" />
              <p className="font-medium text-red-700">ไม่พบลูกค้า</p>
              <p className="text-xs text-muted-foreground mt-1">กรุณาตรวจสอบเบอร์โทร</p>
            </CardContent>
          </Card>
        )}

        {/* Customer Found - Deduct Form */}
        {customerData && !deductSuccess && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{customerData.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /><span>{customerData.phone}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50">
                    <Leaf className="h-3 w-3" />Hibi Member
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{customerData.availablePoints?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">แต้มรวมทั้งหมด</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-muted-foreground">{customerData.lifetimePoints?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">สะสมตลอดชีพ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Branch Selection */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Store className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">เลือกสาขาที่ต้องการหักแต้ม <span className="text-red-500">*</span></Label>
                </div>
                <Select value={selectedBranchId} onValueChange={(v) => { setSelectedBranchId(v); setPointsToDeduct(""); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="-- เลือกสาขา --" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Branch-specific points display */}
                {selectedBranchId && branchPointsData !== undefined && (
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-700/70">แต้มสาขา "{selectedBranchName}"</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{branchAvailablePoints.toLocaleString()} <span className="text-sm font-normal">แต้ม</span></p>
                    <p className="text-[10px] text-amber-600/60 mt-1">หักได้สูงสุดไม่เกินจำนวนนี้</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deduct Form - only show when branch is selected */}
            {selectedBranchId && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <Label className="text-sm font-medium">จำนวนแต้มที่ต้องการหัก</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="เช่น 56"
                    value={pointsToDeduct}
                    onChange={(e) => setPointsToDeduct(e.target.value)}
                    className="text-center text-2xl font-bold h-14"
                    min={1}
                    max={branchAvailablePoints}
                  />
                  {pointsToDeduct && parseInt(pointsToDeduct) >= 1 && (
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">แต้มที่จะถูกหัก (สาขา {selectedBranchName})</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">
                        -{parseInt(pointsToDeduct)} แต้ม
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        คงเหลือสาขานี้: {(branchAvailablePoints - parseInt(pointsToDeduct)).toLocaleString()} แต้ม
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">เหตุผลในการหักแต้ม <span className="text-red-500">*</span></Label>
                    <Textarea
                      placeholder="เช่น ให้แต้มผิดสาขา ต้องย้ายไปสาขาที่ถูกต้อง"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    variant="destructive"
                    className="w-full h-14 text-base"
                    onClick={handleDeductPoints}
                    disabled={deductMutation.isPending || !pointsToDeduct || !reason.trim() || !selectedBranchId}
                  >
                    {deductMutation.isPending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <MinusCircle className="h-5 w-5 mr-2" />}
                    หักแต้ม
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Confirmation Dialog */}
        {showConfirm && customerData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-sm border-0 shadow-xl">
              <CardContent className="p-5 space-y-4">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                  <p className="font-bold text-lg">ยืนยันการหักแต้ม</p>
                  <p className="text-sm text-muted-foreground mt-1">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ลูกค้า:</span>
                    <span className="font-medium">{customerData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">สาขา:</span>
                    <span className="font-medium text-primary">{selectedBranchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">หักแต้ม:</span>
                    <span className="font-bold text-red-600">-{pointsToDeduct} แต้ม</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">คงเหลือสาขานี้:</span>
                    <span className="font-medium">{(branchAvailablePoints - parseInt(pointsToDeduct)).toLocaleString()} แต้ม</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">เหตุผล:</span>
                    <p className="mt-1 text-sm">{reason}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={deductMutation.isPending}>
                    ยกเลิก
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={confirmDeduct} disabled={deductMutation.isPending}>
                    {deductMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    ยืนยันหักแต้ม
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Success */}
        {deductSuccess && (
          <>
            <Card className="border-0 shadow-sm bg-green-50">
              <CardContent className="p-5 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-lg text-green-700">หักแต้มสำเร็จ!</p>
                <p className="text-sm text-green-600 mt-1">{deductSuccess.customerName}</p>
                <p className="text-xs text-muted-foreground mt-1">สาขา: {selectedBranchName}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-200">
                  <div>
                    <p className="text-2xl font-bold text-red-600">-{deductSuccess.pointsDeducted}</p>
                    <p className="text-xs text-red-600/70">แต้มที่หัก</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{deductSuccess.newBalance?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">แต้มรวมคงเหลือ</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button className="w-full" onClick={resetForm}>
              <RotateCcw className="h-4 w-4 mr-2" /> ดำเนินการรายการถัดไป
            </Button>
          </>
        )}
      </div>
    </AdminPageWrapper>
  );
}
