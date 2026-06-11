import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import BranchSelector from "@/components/BranchSelector";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useBranchSelector } from "@/hooks/useBranchSelector";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Settings, Save, Loader2, Banknote, Bell, Users, Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useMobile";

export default function PettyCashSettings() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff, isBranchOwner, isBranchManager, isAreaManager, isSuperAdmin } = useHibiAuth();
  const { selectedBranchId, setSelectedBranchId, currentBranchName, branchIdParam, needsSelector, managedBranches } = useBranchSelector();
  const [, setLocation] = useLocation();

  const [alertThreshold, setAlertThreshold] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [promptPayId, setPromptPayId] = useState("");
  const [allowedRole, setAllowedRole] = useState("branch_manager");
  const [isActive, setIsActive] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
    const canAccess = isBranchOwner || isBranchManager || session?.role === "area_manager" || session?.role === "super_admin";
    if (!loading && session && !canAccess) {
      toast.error("ไม่มีสิทธิ์ตั้งค่าระบบเงินสดย่อย");
      setLocation("/branch");
    }
  }, [loading, session, isStaff, isBranchOwner, isBranchManager, setLocation]);

  const { data: settings, isLoading } = trpc.pettyCash.getSettings.useQuery({ branchId: branchIdParam }, {
    enabled: !!session && (isBranchOwner || isBranchManager || isAreaManager || session.role === "super_admin"),
  });

  useEffect(() => {
    if (settings && !initialized) {
      setAlertThreshold(String(settings.alertThreshold ?? 1000));
      setBankName(settings.bankName || "");
      setBankAccountNumber(settings.bankAccountNumber || "");
      setBankAccountName(settings.bankAccountName || "");
      setPromptPayId(settings.promptPayId || "");
      setAllowedRole(settings.allowedRole || "branch_manager");
      setIsActive(!!settings.isActive);
      setInitialized(true);
    }
  }, [settings, initialized]);

  const utils = trpc.useUtils();
  const updateMut = trpc.pettyCash.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("บันทึกการตั้งค่าเรียบร้อย");
      utils.pettyCash.getSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    const threshold = parseInt(alertThreshold);
    if (isNaN(threshold) || threshold < 0) {
      toast.error("กรุณากรอกยอดแจ้งเตือนที่ถูกต้อง");
      return;
    }
    updateMut.mutate({
      alertThreshold: threshold,
      bankName: bankName || undefined,
      bankAccountNumber: bankAccountNumber || undefined,
      bankAccountName: bankAccountName || undefined,
      promptPayId: promptPayId || undefined,
      allowedRole: allowedRole as "branch_manager" | "branch_staff" | "both",
      isActive: isActive ? 1 : 0,
      branchId: branchIdParam,
    });
  };

  if (loading || !session) return null;

  return (
    <MobileLayout title={`ตั้งค่าเงินสดย่อย${currentBranchName ? ` - ${currentBranchName}` : ""}`} showBack backPath="/branch/petty-cash">
      <PremiumPageContent>
        <BranchSelector
          selectedBranchId={selectedBranchId}
          onBranchChange={(id) => { setSelectedBranchId(id); setInitialized(false); }}
          managedBranches={managedBranches}
          needsSelector={needsSelector}
        />
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <>
            {/* Active Toggle */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">เปิดใช้งานระบบ</p>
                      <p className="text-xs text-muted-foreground">เปิด/ปิดระบบเบิกจ่ายเงินสดของสาขา</p>
                    </div>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            {/* Alert Threshold */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Bell className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-medium">การแจ้งเตือน</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">แจ้งเตือนเมื่อยอดคงเหลือต่ำกว่า (บาท)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    placeholder="1000"
                    className="mt-1"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    เมื่อยอดคงเหลือต่ำกว่าจำนวนนี้ ระบบจะแจ้งเตือนเจ้าของสาขาอัตโนมัติ
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Allowed Role */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-medium">สิทธิ์การลงรายจ่าย</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ใครสามารถลงรายจ่ายได้</Label>
                  <Select value={allowedRole} onValueChange={setAllowedRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branch_manager">เฉพาะผู้จัดการ</SelectItem>
                      <SelectItem value="branch_staff">เฉพาะพนักงาน</SelectItem>
                      <SelectItem value="both">ทั้งผู้จัดการและพนักงาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Bank Account Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium">ข้อมูลบัญชีธนาคาร</p>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  ข้อมูลนี้จะแสดงให้พนักงานเห็น เพื่อใช้ในการขอโอนเงินเติม
                </p>
                <div>
                  <Label className="text-xs text-muted-foreground">ชื่อธนาคาร</Label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="เช่น กสิกรไทย, กรุงเทพ"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">เลขบัญชี</Label>
                  <Input
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="xxx-x-xxxxx-x"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ชื่อบัญชี</Label>
                  <Input
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    placeholder="ชื่อเจ้าของบัญชี"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">PromptPay ID</Label>
                  <Input
                    value={promptPayId}
                    onChange={(e) => setPromptPayId(e.target.value)}
                    placeholder="เบอร์โทรหรือเลขบัตรประชาชน"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={updateMut.isPending}
              onClick={handleSave}
            >
              {updateMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              บันทึกการตั้งค่า
            </Button>
          </>
        )}
      </PremiumPageContent>
    </MobileLayout>
  );
}
