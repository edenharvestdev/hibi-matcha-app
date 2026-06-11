import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Coffee, CheckCircle, Loader2, AlertTriangle, MessageSquare, QrCode, ArrowRight, Copy, Check, Settings2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function SelectMenuCode() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const params = useMemo(() => new URLSearchParams(searchStr), [searchStr]);
  const codeId = params.get("codeId") ? parseInt(params.get("codeId")!) : null;

  const [selectedMenu, setSelectedMenu] = useState<number | null>(null);
  const [remark, setRemark] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Option Groups selections
  const [optionSelections, setOptionSelections] = useState<Record<number, string | string[]>>({});

  // CL code auto-confirm state
  const [clRemark, setClRemark] = useState("");
  const [showClConfirm, setShowClConfirm] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success("คัดลอกโค้ดแล้ว!");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("ไม่สามารถคัดลอกได้"));
  };

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isCustomer) setLocation("/branch");
  }, [loading, session, isCustomer, setLocation]);

  // Load my codes (codes table - RV/CL)
  const { data: myCodes, refetch: refetchCodes } = trpc.reviews.myCodes.useQuery(undefined, { enabled: !!session && isCustomer });

  // Find the current code
  const currentCode = myCodes?.find((c: any) => c.id === codeId);

  // Determine if this is a CL code with compensation menu (auto-fill flow)
  const isCLAutoFill = currentCode?.type === "CL" && !!currentCode?.compensationMenuCode && !!currentCode?.compensationMenuName;

  // Load menu items filtered by branch that issued this code (only for non-CL codes)
  const codeBranchId = currentCode?.branchId ?? null;
  const { data: menuItems } = trpc.reviewMenu.listActive.useQuery(
    codeBranchId ? { branchId: codeBranchId } : undefined,
    { enabled: !!session && !!codeBranchId && !isCLAutoFill }
  );

  // Load option groups for the SELECTED menu item (not all groups) - only for non-CL
  const { data: menuOptionGroups, isLoading: optionGroupsLoading } = trpc.optionGroups.forMenu.useQuery(
    { menuType: "review", menuId: selectedMenu! },
    { enabled: !!selectedMenu && !isCLAutoFill }
  );

  // Reset option selections when menu changes
  useEffect(() => {
    setOptionSelections({});
  }, [selectedMenu]);

  // Use selectMenuForCode mutation (for non-CL codes)
  const selectMenuMutation = trpc.reviewMenu.selectMenuForCode.useMutation({
    onSuccess: (data) => {
      setResultData(data);
      setShowConfirm(false);
      setShowResult(true);
      refetchCodes();
      toast.success("เลือกเมนูสำเร็จ! แสดง QR Code ให้พนักงานสแกน");
    },
    onError: (err) => toast.error(err.message),
  });

  // Use autoSelectForCLCode mutation (for CL codes)
  const autoSelectCLMutation = trpc.reviewMenu.autoSelectForCLCode.useMutation({
    onSuccess: (data) => {
      setResultData(data);
      setShowClConfirm(false);
      setShowResult(true);
      refetchCodes();
      toast.success("ยืนยันใช้โค้ดชดเชยสำเร็จ! แสดง QR Code ให้พนักงานสแกน");
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedMenuItem = menuItems?.find((m: any) => m.id === selectedMenu);

  // Build remark from option selections + free text
  const buildRemark = () => {
    const parts: string[] = [];
    if (menuOptionGroups && menuOptionGroups.length > 0) {
      for (const group of menuOptionGroups) {
        const sel = optionSelections[group.id];
        if (!sel) continue;
        if (Array.isArray(sel)) {
          if (sel.length > 0) parts.push(`${group.name}: ${sel.join(", ")}`);
        } else if (sel) {
          parts.push(`${group.name}: ${sel}`);
        }
      }
    }
    if (remark.trim()) parts.push(remark.trim());
    return parts.join(" | ");
  };

  // Validate required option groups
  const validateOptions = () => {
    if (!menuOptionGroups) return true;
    for (const group of menuOptionGroups) {
      if (group.isRequired) {
        const sel = optionSelections[group.id];
        if (!sel || (Array.isArray(sel) && sel.length === 0)) {
          toast.error(`กรุณาเลือก "${group.name}"`);
          return false;
        }
      }
    }
    return true;
  };

  const handleConfirm = () => {
    if (!codeId || !selectedMenu) return;
    const fullRemark = buildRemark();
    selectMenuMutation.mutate({
      codeId,
      menuItemId: selectedMenu,
      remark: fullRemark || undefined,
    });
  };

  const handleCLConfirm = () => {
    if (!codeId) return;
    autoSelectCLMutation.mutate({
      codeId,
      remark: clRemark.trim() || undefined,
    });
  };

  const handleSingleSelect = (groupId: number, value: string) => {
    setOptionSelections(prev => ({ ...prev, [groupId]: value }));
  };

  const handleMultiToggle = (groupId: number, itemName: string) => {
    setOptionSelections(prev => {
      const current = (prev[groupId] as string[]) || [];
      const updated = current.includes(itemName)
        ? current.filter(n => n !== itemName)
        : [...current, itemName];
      return { ...prev, [groupId]: updated };
    });
  };

  if (loading || !session) return null;

  // If no codeId or code not found
  if (!codeId || (myCodes && !currentCode)) {
    return (
      <MobileLayout title="เลือกเมนู" showBack backPath="/customer/my-codes">
        <PremiumPageContent>
        <div className="px-4 py-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <p className="font-medium">ไม่พบโค้ดที่ระบุ</p>
          <p className="text-sm text-muted-foreground mt-1">กรุณากลับไปเลือกโค้ดจากหน้าโค้ดของฉัน</p>
          <Button className="mt-4" onClick={() => setLocation("/customer/my-codes")}>กลับ</Button>
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  // If code already has menu selected and activated today — show QR
  if (currentCode?.selectedMenuItemId && currentCode?.activatedAt) {
    const activated = new Date(currentCode.activatedAt);
    const isToday = activated.toDateString() === new Date().toDateString();

    if (isToday) {
      return (
        <MobileLayout title="QR Code ใช้โค้ด" showBack backPath="/customer/my-codes">
          <PremiumPageContent>
          <div className="px-4 py-6 space-y-4">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-5 text-center">
                <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                <p className="font-semibold text-emerald-700">
                  {isCLAutoFill ? "ยืนยันโค้ดชดเชยแล้ว — แสดง QR ให้พนักงาน" : "เลือกเมนูแล้ว — แสดง QR ให้พนักงาน"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Coffee className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{currentCode.selectedMenuCode}</span>
                      <span className="font-semibold">{currentCode.selectedMenuName}</span>
                    </div>
                    {isCLAutoFill && (
                      <p className="text-[10px] text-orange-600 font-medium">เมนูชดเชย (แก้วที่ทำพลาด)</p>
                    )}
                  </div>
                </div>
                {currentCode.remark && (
                  <div className="mt-2 bg-muted/50 rounded-lg p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">ตัวเลือก / Remark:</p>
                    <p className="text-xs">{currentCode.remark}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <QRCodeDisplay code={currentCode.code} size={200} showActions={false} />
              <p className="text-[11px] text-muted-foreground mt-3 text-center">
                พนักงานจะสแกน QR Code นี้เพื่อดูเมนูที่คุณเลือกและยืนยันการใช้โค้ด
              </p>
            </div>

            {/* Copy Code Button */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleCopyCode(currentCode.code)}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "คัดลอกแล้ว!" : "คัดลอกโค้ด เพื่อวางในแอปเดลิเวอรี่"}
            </Button>

            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <p className="text-xs text-amber-700 text-center font-medium">
                ต้องใช้ภายในวันนี้! หากไม่ใช้ สามารถเลือกเมนูใหม่ได้ในวันถัดไป
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setLocation("/customer/my-codes")}>
              กลับหน้าโค้ดของฉัน
            </Button>
          </div>
                  </PremiumPageContent>
        </MobileLayout>
      );
    }
  }

  // If code is not "issued" status
  if (currentCode?.status !== "issued") {
    return (
      <MobileLayout title="เลือกเมนู" showBack backPath="/customer/my-codes">
        <PremiumPageContent>
        <div className="px-4 py-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <p className="font-medium">โค้ดนี้ไม่สามารถใช้ได้</p>
          <p className="text-sm text-muted-foreground mt-1">โค้ดอาจถูกใช้แล้ว หมดอายุ หรือถูกยกเลิก</p>
          <Button className="mt-4" onClick={() => setLocation("/customer/my-codes")}>กลับ</Button>
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // CL CODE AUTO-FILL FLOW: ลูกค้าไม่ต้องเลือกเมนู — ระบบดึงเมนูที่ผิดพลาดมาอัตโนมัติ
  // ═══════════════════════════════════════════════════════════════════
  if (isCLAutoFill) {
    return (
      <MobileLayout title="ยืนยันโค้ดชดเชย" showBack backPath="/customer/my-codes">
        <PremiumPageContent>
        <div className="px-4 py-4 space-y-5">
          {/* Code Info */}
          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white border-0">
            <CardContent className="p-4">
              <p className="text-xs opacity-80">โค้ดชดเชย (แก้วทำพลาด)</p>
              <p className="font-mono font-bold text-lg tracking-wider mt-1">
                รหัสจะแสดงหลังยืนยัน
              </p>
              <p className="text-xs opacity-80 mt-1">
                โค้ดชดเชย
              </p>
            </CardContent>
          </Card>

          {/* Auto-filled compensation menu */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Coffee className="h-4 w-4 text-orange-600" />
              เมนูชดเชย (ทำแก้วที่พลาดส่งคืน)
            </h3>
            <Card className="border-orange-200 ring-2 ring-orange-200/50 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <Coffee className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                        {currentCode.compensationMenuCode}
                      </span>
                      <p className="text-sm font-semibold text-orange-800">{currentCode.compensationMenuName}</p>
                    </div>
                    <p className="text-[10px] text-orange-600 mt-1">
                      ระบบใช้เมนูที่ผิดพลาดเป็นเมนูชดเชยอัตโนมัติ
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-orange-500 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CL claim info */}
          {(currentCode.claimError || currentCode.claimChannel) && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              {currentCode.claimError && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">เหตุผล:</span> {currentCode.claimError}
                </p>
              )}
              {currentCode.claimChannel && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">ช่องทาง:</span> {currentCode.claimChannel === "walk_in" ? "หน้าร้าน" : currentCode.claimChannel.toUpperCase()}
                </p>
              )}
            </div>
          )}

          {/* Important notice */}
          <div className="bg-amber-50 rounded-lg p-3 flex gap-2 border border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-amber-700 font-medium">เมื่อยืนยันแล้ว ต้องใช้โค้ดภายในวันนี้!</p>
              <p className="text-[10px] text-amber-600 mt-0.5">หากไม่ใช้ สามารถยืนยันใหม่ได้ในวันถัดไป</p>
            </div>
          </div>

          {/* Optional remark */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              หมายเหตุเพิ่มเติม (ไม่บังคับ)
            </h3>
            <Textarea
              placeholder="เช่น ต้องการเปลี่ยนความหวาน ฯลฯ"
              value={clRemark}
              onChange={(e) => setClRemark(e.target.value)}
              maxLength={500}
              rows={2}
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{clRemark.length}/500</p>
          </div>

          {/* Submit - Auto confirm */}
          <Button
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            size="lg"
            onClick={() => setShowClConfirm(true)}
          >
            <QrCode className="h-4 w-4 mr-1" />
            ยืนยันใช้โค้ดชดเชย — รับ QR Code
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* CL Confirm Dialog */}
        <Dialog open={showClConfirm} onOpenChange={setShowClConfirm}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center">
                <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                ยืนยันใช้โค้ดชดเชย
              </DialogTitle>
              <DialogDescription className="text-center">
                เมื่อยืนยันแล้ว ต้องใช้โค้ดภายในวันนี้!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">
                      {currentCode.compensationMenuCode}
                    </span>
                    <span className="font-semibold">{currentCode.compensationMenuName}</span>
                  </div>
                  <p className="text-[10px] text-orange-600">เมนูชดเชย (ทำแก้วที่พลาดส่งคืน)</p>
                  {clRemark.trim() && (
                    <div className="bg-white/80 rounded-lg p-2 mt-2 border border-orange-100">
                      <p className="text-xs text-orange-800">{clRemark.trim()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                <p className="text-[11px] text-amber-700 text-center">
                  หลังยืนยัน ระบบจะแสดง QR Code ให้พนักงานสแกนเพื่อรีดีม
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowClConfirm(false)} className="flex-1">ยกเลิก</Button>
              <Button onClick={handleCLConfirm} disabled={autoSelectCLMutation.isPending} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                {autoSelectCLMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                ยืนยัน
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Result Dialog — show QR Code */}
        <Dialog open={showResult} onOpenChange={setShowResult}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                ยืนยันโค้ดชดเชยสำเร็จ!
              </DialogTitle>
            </DialogHeader>
            {resultData && (
              <div className="space-y-3">
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs font-mono bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">{resultData.menuCode}</span>
                      <span className="font-semibold text-lg">{resultData.menuName}</span>
                    </div>
                    <p className="text-[10px] text-orange-600">เมนูชดเชย (ทำแก้วที่พลาดส่งคืน)</p>
                    {resultData.remark && (
                      <p className="text-sm text-muted-foreground">
                        {resultData.remark}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <QRCodeDisplay code={resultData.code || currentCode?.code || ""} size={180} showActions={false} />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    แสดง QR Code นี้ให้พนักงานสแกนเพื่อรีดีม
                  </p>
                </div>

                {/* Copy Code Button */}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleCopyCode(resultData.code || currentCode?.code || "")}
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? "คัดลอกแล้ว!" : "คัดลอกโค้ด เพื่อวางในแอปเดลิเวอรี่"}
                </Button>

                <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                  <p className="text-[11px] text-amber-700 text-center font-medium">
                    ต้องใช้ภายในวันนี้!
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => { setShowResult(false); setLocation("/customer/my-codes"); }} className="w-full">
                กลับหน้าโค้ดของฉัน
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // NORMAL FLOW (RV/FR/PR codes): ลูกค้าเลือกเมนูเอง
  // ═══════════════════════════════════════════════════════════════════

  // Build summary text for confirm dialog
  const optionsSummary = buildRemark();

  // Check if option groups exist for selected menu
  const hasOptionGroups = menuOptionGroups && menuOptionGroups.length > 0;

  return (
    <MobileLayout title="เลือกเมนู" showBack backPath="/customer/my-codes">
      <PremiumPageContent>
      <div className="px-4 py-4 space-y-5">
        {/* Code Info - ซ่อนรหัสโค้ดจนกว่าจะยืนยันเลือกเมนู */}
        <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4">
            <p className="text-xs opacity-80">โค้ดของคุณ</p>
            <p className="font-mono font-bold text-lg tracking-wider mt-1">
              รหัสจะแสดงหลังยืนยัน
            </p>
            <p className="text-xs opacity-80 mt-1">
              {currentCode?.type === "RV" ? "โค้ดรีวิว" : currentCode?.type === "CL" ? "โค้ดชดเชย" : "โค้ด"}
            </p>
          </CardContent>
        </Card>

        {/* Important notice */}
        <div className="bg-amber-50 rounded-lg p-3 flex gap-2 border border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-amber-700 font-medium">เมื่อยืนยันแล้ว ต้องใช้โค้ดภายในวันนี้!</p>
            <p className="text-[10px] text-amber-600 mt-0.5">หากไม่ใช้ สามารถเลือกเมนูใหม่ได้ในวันถัดไป</p>
          </div>
        </div>

        {/* Step 1: Select Menu */}
        <div>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Coffee className="h-4 w-4 text-primary" />
            เลือกเมนู
          </h3>
          {!menuItems?.length ? (
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground">ยังไม่มีเมนูให้เลือก</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {menuItems.map((item: any) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all ${selectedMenu === item.id ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-0 shadow-sm hover:shadow-md'}`}
                  onClick={() => setSelectedMenu(item.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedMenu === item.id ? 'bg-primary text-white' : 'bg-muted'}`}>
                        <Coffee className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono bg-primary/10 text-primary px-1 py-0.5 rounded">{item.code}</span>
                          <p className="text-sm font-medium">{item.name}</p>
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{item.description}</p>}
                      </div>
                      {selectedMenu === item.id && <CheckCircle className="h-5 w-5 text-primary shrink-0" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Option Groups for selected menu */}
        {selectedMenu && optionGroupsLoading && (
          <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">กำลังโหลดตัวเลือก...</span>
          </div>
        )}

        {selectedMenu && hasOptionGroups && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              ตัวเลือกเพิ่มเติม
            </h3>
            {menuOptionGroups!.map((group: any) => (
              <Card key={group.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm font-semibold">{group.name}</p>
                    {group.isRequired ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">จำเป็น</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">ไม่จำเป็น</span>
                    )}
                  </div>

                  {group.type === "single" ? (
                    <RadioGroup
                      value={(optionSelections[group.id] as string) || ""}
                      onValueChange={(val) => handleSingleSelect(group.id, val)}
                      className="space-y-2"
                    >
                      {group.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                          <RadioGroupItem value={item.name} id={`opt-${group.id}-${item.id}`} />
                          <Label htmlFor={`opt-${group.id}-${item.id}`} className="text-sm cursor-pointer flex-1">{item.name}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      {group.items?.map((item: any) => {
                        const checked = ((optionSelections[group.id] as string[]) || []).includes(item.name);
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                            <Checkbox
                              id={`opt-${group.id}-${item.id}`}
                              checked={checked}
                              onCheckedChange={() => handleMultiToggle(group.id, item.name)}
                            />
                            <Label htmlFor={`opt-${group.id}-${item.id}`} className="text-sm cursor-pointer flex-1">{item.name}</Label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Step 3: Additional Remark (optional) */}
        {selectedMenu && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              หมายเหตุเพิ่มเติม (ไม่บังคับ)
            </h3>
            <Textarea
              placeholder="เช่น ใส่นมข้น, ท็อปปิ้งเพิ่ม ฯลฯ"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={500}
              rows={2}
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{remark.length}/500</p>
          </div>
        )}

        {/* Submit */}
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          size="lg"
          disabled={!selectedMenu}
          onClick={() => {
            if (!validateOptions()) return;
            setShowConfirm(true);
          }}
        >
          <QrCode className="h-4 w-4 mr-1" />
          ยืนยันเลือกเมนู — รับ QR Code
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              ยืนยันเลือกเมนู
            </DialogTitle>
            <DialogDescription className="text-center">
              เมื่อยืนยันแล้ว ต้องใช้โค้ดภายในวันนี้!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{selectedMenuItem?.code}</span>
                  <span className="font-semibold">{selectedMenuItem?.name}</span>
                </div>
                {optionsSummary && (
                  <div className="bg-white/80 rounded-lg p-2 mt-2 border border-emerald-100">
                    <p className="text-xs text-emerald-800">{optionsSummary}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200">
              <p className="text-[11px] text-amber-700 text-center">
                หลังยืนยัน ระบบจะแสดง QR Code ให้พนักงานสแกนเพื่อรีดีม
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">ยกเลิก</Button>
            <Button onClick={handleConfirm} disabled={selectMenuMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {selectMenuMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog — show QR Code */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
              เลือกเมนูสำเร็จ!
            </DialogTitle>
          </DialogHeader>
          {resultData && (
            <div className="space-y-3">
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{resultData.menuCode}</span>
                    <span className="font-semibold text-lg">{resultData.menuName}</span>
                  </div>
                  {resultData.remark && (
                    <p className="text-sm text-muted-foreground">
                      {resultData.remark}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* QR Code */}
              <div className="flex flex-col items-center">
                <QRCodeDisplay code={resultData.code || currentCode?.code || ""} size={180} showActions={false} />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  แสดง QR Code นี้ให้พนักงานสแกนเพื่อรีดีม
                </p>
              </div>

              {/* Copy Code Button */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => handleCopyCode(resultData.code || currentCode?.code || "")}
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "คัดลอกแล้ว!" : "คัดลอกโค้ด เพื่อวางในแอปเดลิเวอรี่"}
              </Button>

              <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200">
                <p className="text-[11px] text-amber-700 text-center font-medium">
                  ต้องใช้ภายในวันนี้!
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setShowResult(false); setLocation("/customer/my-codes"); }} className="w-full">
              กลับหน้าโค้ดของฉัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </PremiumPageContent>
    </MobileLayout>
  );
}
