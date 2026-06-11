import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Coffee, CheckCircle, Copy, Loader2, AlertTriangle, Package, Droplets, Info, ClipboardCopy, Settings2, MessageSquare } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const SWEETNESS_OPTIONS = [
  { value: 0, label: "ไม่หวาน (0g)", short: "ไม่หวาน", desc: "ไม่ใส่น้ำตาล" },
  { value: 15, label: "หวานน้อย (15g)", short: "หวานน้อย", desc: "หวานเบาๆ" },
  { value: 30, label: "หวานปกติ (30g)", short: "หวานปกติ", desc: "หวานมาตรฐาน" },
  { value: 45, label: "หวานมาก (45g)", short: "หวานมาก", desc: "หวานเข้มข้น" },
];

const PACKAGING_OPTIONS = [
  { value: "ready", label: "พร้อมดื่ม", short: "พร้อมดื่ม", desc: "ผสมน้ำแข็งพร้อมดื่มทันที", icon: Coffee },
  { value: "separate", label: "แยกน้ำแข็ง", short: "แยกน้ำแข็ง", desc: "แยกน้ำแข็งออกมาต่างหาก", icon: Package },
];

/** สร้างข้อความ Copy กระชับ */
function buildCopyTextCompact(code: string, menuCode: string, menuName: string, sweetnessGrams: number, packagingType: string, remark?: string | null): string {
  const sweet = SWEETNESS_OPTIONS.find(s => s.value === sweetnessGrams)?.short ?? `${sweetnessGrams}g`;
  const pack = PACKAGING_OPTIONS.find(p => p.value === packagingType)?.short ?? packagingType;
  const lines: string[] = [];
  lines.push(`🎟 ${code}`);
  lines.push(`📦 ${menuCode} ${menuName}`);
  lines.push(`📝 ${sweet}, ${pack}`);
  if (remark) lines.push(`💬 ${remark}`);
  return lines.join("\n");
}

export default function SelectMenu() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const searchStr = useSearch();
  const params = useMemo(() => new URLSearchParams(searchStr), [searchStr]);
  const codeId = params.get("codeId") ? parseInt(params.get("codeId")!) : null;

  const [selectedMenu, setSelectedMenu] = useState<number | null>(null);
  const [sweetness, setSweetness] = useState(30);
  const [packaging, setPackaging] = useState("ready");
  const [freeTextRemark, setFreeTextRemark] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  // Option Groups selections
  const [optionSelections, setOptionSelections] = useState<Record<number, string | string[]>>({});

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isCustomer) setLocation("/branch");
  }, [loading, session, isCustomer, setLocation]);

  const { data: myCodes, refetch: refetchCodes } = trpc.freeDrinkCodes.myCodes.useQuery(undefined, { enabled: !!session && isCustomer });

  // Find the code first so we can get branchId
  const currentCode = myCodes?.find((c: any) => c.id === codeId);

  // ดึง branchId จากโค้ดเพื่อ filter เมนูเฉพาะสาขา
  const codeBranchId = currentCode?.branchId ?? null;
  const { data: menuItems } = trpc.reviewMenu.listActive.useQuery(
    codeBranchId ? { branchId: codeBranchId } : undefined,
    { enabled: !!session }
  );

  // Load option groups for the SELECTED menu item
  const { data: menuOptionGroups, isLoading: optionGroupsLoading } = trpc.optionGroups.forMenu.useQuery(
    { menuType: "review", menuId: selectedMenu! },
    { enabled: !!selectedMenu }
  );

  // Reset option selections when menu changes
  useEffect(() => {
    setOptionSelections({});
    setFreeTextRemark("");
  }, [selectedMenu]);

  const selectMenuMutation = trpc.reviewMenu.selectMenu.useMutation({
    onSuccess: (data) => {
      setResultData(data);
      setShowConfirm(false);
      setShowResult(true);
      refetchCodes();
      toast.success("เลือกเมนูสำเร็จ!");
    },
    onError: (err) => toast.error(err.message),
  });
  const selectedMenuItem = menuItems?.find((m: any) => m.id === selectedMenu);
  const sweetnessLabel = SWEETNESS_OPTIONS.find(s => s.value === sweetness)?.label || "";
  const packagingLabel = PACKAGING_OPTIONS.find(p => p.value === packaging)?.label || "";

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
    if (freeTextRemark.trim()) parts.push(freeTextRemark.trim());
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
      sweetnessGrams: sweetness,
      packagingType: packaging as "ready" | "separate",
      remark: fullRemark || undefined,
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกข้อความแล้ว! วางในช่องหมายเหตุได้เลย");
  };

  if (loading || !session) return null;

  // If no codeId or code not found
  if (!codeId || (myCodes && !currentCode)) {
    return (
      <MobileLayout title="เลือกเมนู" showBack backPath="/customer/free-drinks">
        <PremiumPageContent>
        <div className="px-4 py-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
          <p className="font-medium">ไม่พบโค้ดที่ระบุ</p>
          <p className="text-sm text-muted-foreground mt-1">กรุณากลับไปเลือกโค้ดจากหน้าโค้ดแก้วแถม</p>
          <Button className="mt-4" onClick={() => setLocation("/customer/free-drinks")}>กลับ</Button>
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  // If code already has menu selected — show summary with copy
  if (currentCode?.selectedMenuItemId) {
    const remarkText = currentCode.remark || "";
    const copyText = buildCopyTextCompact(
      currentCode.code,
      currentCode.selectedMenuCode || "",
      currentCode.selectedMenuName || "",
      currentCode.sweetnessGrams,
      currentCode.packagingType,
      remarkText
    );

    return (
      <MobileLayout title="เลือกเมนู" showBack backPath="/customer/free-drinks">
        <PremiumPageContent>
        <div className="px-4 py-6 space-y-4">
          {/* Success header */}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-5 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-emerald-700">เลือกเมนูแล้ว</p>
            </CardContent>
          </Card>

          {/* Menu summary card */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Coffee className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{currentCode.selectedMenuCode}</span>
                    <span className="font-semibold">{currentCode.selectedMenuName}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {SWEETNESS_OPTIONS.find(s => s.value === currentCode.sweetnessGrams)?.short || currentCode.sweetnessGrams + "g"}
                    {" • "}
                    {PACKAGING_OPTIONS.find(p => p.value === currentCode.packagingType)?.short || currentCode.packagingType}
                  </p>
                  {remarkText && (
                    <div className="mt-2 bg-muted/50 rounded-lg p-2">
                      <p className="text-[10px] text-muted-foreground mb-0.5 font-medium">ตัวเลือก / Remark:</p>
                      <p className="text-xs">{remarkText}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Copy text preview */}
              <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs whitespace-pre-line border border-slate-200 leading-relaxed">
                {copyText}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium"
                onClick={() => copyToClipboard(copyText)}
              >
                <ClipboardCopy className="h-3.5 w-3.5 mr-1" /> คัดลอกข้อความวางในแอป Delivery
              </Button>
            </CardContent>
          </Card>

          {/* Code display */}
          <Card className="border-dashed border-emerald-300">
            <CardContent className="p-4 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">แจ้งโค้ดนี้กับพนักงานหน้าร้าน</p>
              <p className="font-mono font-bold text-xl text-emerald-700">{currentCode.code}</p>
            </CardContent>
          </Card>

          <div className="bg-amber-50 rounded-lg p-3 flex gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">ไม่สามารถเปลี่ยนนมได้ — นมจะเป็นไปตามที่กำหนดในโค้ด ({currentCode.milkName || "ตามเมนู"})</p>
          </div>
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  // Build remark summary
  const remarkSummary = buildRemark();
  const hasOptionGroups = menuOptionGroups && menuOptionGroups.length > 0;

  return (
    <MobileLayout title="เลือกเมนู" showBack backPath="/customer/free-drinks">
      <PremiumPageContent>
      <div className="px-4 py-4 space-y-5">
        {/* Code Info - ซ่อนรหัสโค้ดจนกว่ายืนยันเลือกเมนู */}
        <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4">
            <p className="text-xs opacity-80">โค้ดแก้วแถม</p>
            <p className="font-mono font-bold text-lg opacity-50">เลือกเมนูเสร็จจึงจะแสดงรหัส</p>
            <p className="text-sm mt-1">{currentCode?.menuName} ({currentCode?.sizeName})</p>
            {currentCode?.milkName && <p className="text-xs opacity-80">นม: {currentCode.milkName}</p>}
          </CardContent>
        </Card>

        {/* Cannot change milk notice */}
        <div className="bg-amber-50 rounded-lg p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>ไม่สามารถเปลี่ยนนมได้</strong> — นมจะเป็นไปตามที่กำหนดในโค้ด ({currentCode?.milkName || "ตามเมนู"})
          </p>
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
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedMenu === item.id ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                        {selectedMenu === item.id && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Sweetness (built-in) */}
        {selectedMenu && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              ความหวาน
            </h3>
            <RadioGroup value={String(sweetness)} onValueChange={(v) => setSweetness(parseInt(v))}>
              <div className="grid grid-cols-2 gap-2">
                {SWEETNESS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${sweetness === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted hover:border-muted-foreground/30'}`}
                  >
                    <RadioGroupItem value={String(opt.value)} className="shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 3: Packaging (built-in) */}
        {selectedMenu && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              แพ็ค
            </h3>
            <RadioGroup value={packaging} onValueChange={setPackaging}>
              <div className="space-y-2">
                {PACKAGING_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${packaging === opt.value ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted hover:border-muted-foreground/30'}`}
                  >
                    <RadioGroupItem value={opt.value} className="shrink-0" />
                    <opt.icon className={`h-5 w-5 ${packaging === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Step 4: Option Groups from DB (if any) */}
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

        {/* Step 5: Additional Remark (optional) */}
        {selectedMenu && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              หมายเหตุเพิ่มเติม (ไม่บังคับ)
            </h3>
            <Textarea
              placeholder="เช่น ใส่นมข้น, ท็อปปิ้งเพิ่ม ฯลฯ"
              value={freeTextRemark}
              onChange={(e) => setFreeTextRemark(e.target.value)}
              maxLength={500}
              rows={2}
              className="resize-none"
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{freeTextRemark.length}/500</p>
          </div>
        )}

        {/* Preview before confirm */}
        {selectedMenu && selectedMenuItem && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-primary mb-1.5">ตัวอย่างข้อความที่จะ Copy (หลังยืนยัน):</p>
              <div className="bg-white rounded-lg p-2.5 font-mono text-xs whitespace-pre-line border leading-relaxed">
                {"🎟 ••••-•••• (รหัสจะแสดงหลังยืนยัน)\n" +
                 `📦 ${selectedMenuItem.code} ${selectedMenuItem.name}\n` +
                 `📝 ${SWEETNESS_OPTIONS.find(s => s.value === sweetness)?.short ?? sweetness + "g"}, ${PACKAGING_OPTIONS.find(p => p.value === packaging)?.short ?? packaging}` +
                 (remarkSummary ? `\n💬 ${remarkSummary}` : "")}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <Button
          className="w-full"
          size="lg"
          disabled={!selectedMenu}
          onClick={() => {
            if (!validateOptions()) return;
            setShowConfirm(true);
          }}
        >
          ยืนยันเลือกเมนู
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
              เมื่อยืนยันแล้วจะไม่สามารถเปลี่ยนได้
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{selectedMenuItem?.code}</span>
                  <span className="font-semibold">{selectedMenuItem?.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ความหวาน: {sweetnessLabel} • {packagingLabel}
                </p>
                {remarkSummary && (
                  <div className="bg-white/80 rounded-lg p-2 mt-2 border border-emerald-100">
                    <p className="text-xs text-emerald-800">{remarkSummary}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  นม: {currentCode?.milkName || "ตามเมนู"} (ไม่สามารถเปลี่ยนได้)
                </p>
              </CardContent>
            </Card>
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

      {/* Result Dialog — show copy text immediately */}
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
                  <p className="text-sm text-muted-foreground">
                    {SWEETNESS_OPTIONS.find(s => s.value === resultData.sweetnessGrams)?.short}
                    {" • "}
                    {PACKAGING_OPTIONS.find(p => p.value === resultData.packagingType)?.short}
                  </p>
                  {resultData.remark && (
                    <p className="text-xs text-muted-foreground mt-1">{resultData.remark}</p>
                  )}
                </CardContent>
              </Card>

              {/* Copy text */}
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">📋 คัดลอกข้อความนี้วางในช่องหมายเหตุ:</p>
                <div className="bg-white rounded p-2.5 text-xs font-mono whitespace-pre-line border leading-relaxed">
                  {buildCopyTextCompact(
                    currentCode?.code || "",
                    resultData.menuCode,
                    resultData.menuName,
                    resultData.sweetnessGrams,
                    resultData.packagingType,
                    resultData.remark
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => copyToClipboard(buildCopyTextCompact(
                    currentCode?.code || "",
                    resultData.menuCode,
                    resultData.menuName,
                    resultData.sweetnessGrams,
                    resultData.packagingType,
                    resultData.remark
                  ))}
                >
                  <ClipboardCopy className="h-3.5 w-3.5 mr-1" /> คัดลอกข้อความ
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { setShowResult(false); setLocation("/customer/free-drinks"); }} className="w-full">
              กลับหน้าโค้ดแก้วแถม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </PremiumPageContent>
    </MobileLayout>
  );
}
