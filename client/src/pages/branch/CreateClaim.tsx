import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import DatePickerCE from "@/components/DatePickerCE";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, CheckCircle2, Loader2, Copy, Phone, ScanLine, Mail } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/useMobile";

const CHANNEL_OPTIONS = [
  { value: "shopee", label: "Shopee Food" },
  { value: "lineman", label: "LINE MAN" },
  { value: "grab", label: "Grab Food" },
  { value: "gpos", label: "GPOS" },
  { value: "walk_in", label: "หน้าร้าน (Walk-in)" },
] as const;

type IdentifyMethod = "phone" | "qr" | "email";

export default function CreateClaim() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff } = useHibiAuth();
  const [, setLocation] = useLocation();

  // Form state
  const [claimChannel, setClaimChannel] = useState("");
  const [claimOrderId, setClaimOrderId] = useState("");
  const [claimMenuCode, setClaimMenuCode] = useState("");
  const [claimMenuName, setClaimMenuName] = useState("");
  const [claimOrderDetail, setClaimOrderDetail] = useState("");
  const [claimError, setClaimError] = useState("");
  const [compensationMenuId, setCompensationMenuId] = useState("");
  const [compMode, setCompMode] = useState<"same" | "select" | "custom">("same"); // same=เมนูเดียวกับที่พลาด, select=เลือกจากรายการ, custom=พิมพ์เอง
  const [customCompName, setCustomCompName] = useState("");
  const [compensationRemark, setCompensationRemark] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");

  // Customer identification
  const [identifyMethod, setIdentifyMethod] = useState<IdentifyMethod>("phone");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);

  // Result state
  const [resultCode, setResultCode] = useState("");
  const [resultCopyText, setResultCopyText] = useState("");
  const [resultExpiresAt, setResultExpiresAt] = useState("");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  const branchId = session?.branchId;

  const { data: menuItems } = trpc.reviewMenu.listActive.useQuery(
    branchId ? { branchId } : undefined,
    { enabled: !!session && !!branchId }
  );

  const selectedCompMenu = useMemo(() => {
    if (!compensationMenuId || !menuItems) return null;
    return menuItems.find((m: any) => String(m.id) === compensationMenuId);
  }, [compensationMenuId, menuItems]);

  const createMutation = trpc.claims.create.useMutation({
    onSuccess: (data) => {
      setResultCode(data.code);
      setResultCopyText(data.copyText);
      setResultExpiresAt(data.expiresAt);
      toast.success("สร้างโค้ดชดเชยสำเร็จ!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!claimChannel) return toast.error("กรุณาเลือกช่องทาง");
    if (claimChannel !== "walk_in" && !claimOrderId.trim()) return toast.error("กรุณากรอกเลขออเดอร์");
    if (!claimError.trim()) return toast.error("กรุณาระบุความผิดพลาด");
    if (!customerPhone && !customerEmail && !customerId) {
      return toast.error("กรุณาระบุลูกค้า (เบอร์โทร / อีเมล / สแกน QR)");
    }

    // Determine compensation menu based on mode
    let finalCompCode: string | undefined;
    let finalCompName: string | undefined;
    if (compMode === "same") {
      finalCompCode = claimMenuCode || undefined;
      finalCompName = claimMenuName || undefined;
    } else if (compMode === "select" && selectedCompMenu) {
      finalCompCode = selectedCompMenu.code;
      finalCompName = selectedCompMenu.name;
    } else if (compMode === "custom" && customCompName.trim()) {
      finalCompName = customCompName.trim();
    }

    createMutation.mutate({
      branchId: branchId || undefined,
      claimChannel: claimChannel as any,
      claimOrderId: claimOrderId || undefined,
      claimMenuCode: claimMenuCode || undefined,
      claimMenuName: claimMenuName || undefined,
      claimOrderDetail: claimOrderDetail || undefined,
      claimError,
      compensationMenuCode: finalCompCode,
      compensationMenuName: finalCompName,
      compensationRemark: compensationRemark.trim() || undefined,
      orderDate: orderDate || undefined,
      customerId: customerId || undefined,
      customerPhone: customerPhone || undefined,
      email: customerEmail || undefined,
      expiryDays: parseInt(expiryDays) || 30,
    });
  };

  const resetForm = () => {
    setClaimChannel("");
    setClaimOrderId("");
    setClaimMenuCode("");
    setClaimMenuName("");
    setClaimOrderDetail("");
    setClaimError("");
    setCompensationMenuId("");
    setCompMode("same");
    setCustomCompName("");
    setCompensationRemark("");
    setOrderDate("");
    setExpiryDays("30");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerId(null);
    setResultCode("");
    setResultCopyText("");
    setResultExpiresAt("");
  };

  if (loading || !session) return null;

  return (
    <MobileLayout title="สร้างโค้ดชดเชย" showBack backPath="/branch">
      <PremiumPageContent>
        {resultCode ? (
          /* ── Success State ── */
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="font-bold text-lg">สร้างโค้ดสำเร็จ!</h2>
              <p className="text-sm text-muted-foreground mt-1">โค้ดชดเชย 1 โค้ดถูกสร้างเรียบร้อย</p>
            </div>

            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <QRCodeDisplay code={resultCode} size={160} showActions={true} />
              </CardContent>
            </Card>

            {/* Copy text */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">ข้อความสำหรับส่งลูกค้า</p>
                  <Button variant="ghost" size={isMobile ? "default" : "sm"} onClick={() => { navigator.clipboard.writeText(resultCopyText); toast.success("คัดลอกแล้ว!"); }}>
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-3 text-sm font-mono break-all">
                  {resultCopyText}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-blue-50">
              <CardContent className="p-4 space-y-1">
                {customerPhone && <p className="text-sm text-blue-700"><strong>เบอร์:</strong> {customerPhone}</p>}
                {customerEmail && <p className="text-sm text-blue-700"><strong>อีเมล:</strong> {customerEmail}</p>}
                {customerId && <p className="text-sm text-blue-700"><strong>รหัสสมาชิก:</strong> {customerId}</p>}
                <p className="text-xs text-blue-600 mt-1">
                  โค้ดมีอายุ {expiryDays} วัน (หมดอายุ {formatDate(resultExpiresAt)}) ใช้ได้ครั้งเดียว
                </p>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(resultCode); toast.success("คัดลอกโค้ดแล้ว!"); }}>
                <Copy className="h-4 w-4 mr-2" /> Copy โค้ด
              </Button>
              <Button className="flex-1" onClick={resetForm}>
                สร้างโค้ดใหม่
              </Button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <div className="space-y-4">
            {/* ข้อมูลออเดอร์ */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">ข้อมูลออเดอร์ที่ผิดพลาด</p>
                    <p className="text-xs text-muted-foreground">กรอกรายละเอียดให้ครบ</p>
                  </div>
                </div>

                {/* ช่องทาง */}
                <div className="space-y-2">
                  <Label className="text-sm">ช่องทางสั่งซื้อ <span className="text-destructive">*</span></Label>
                  <Select value={claimChannel} onValueChange={setClaimChannel}>
                    <SelectTrigger><SelectValue placeholder="เลือกช่องทาง" /></SelectTrigger>
                    <SelectContent>
                      {CHANNEL_OPTIONS.map((ch) => (
                        <SelectItem key={ch.value} value={ch.value}>{ch.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* เลขออเดอร์ */}
                <div className="space-y-2">
                  <Label className="text-sm">เลขออเดอร์ {claimChannel && claimChannel !== "walk_in" && <span className="text-destructive">*</span>}</Label>
                  <Input placeholder="เช่น GF-677, LM-12345" value={claimOrderId} onChange={(e) => setClaimOrderId(e.target.value)} />
                </div>

                {/* วันที่สั่งซื้อ */}
                <div className="space-y-2">
                  <Label className="text-sm">วันที่สั่งซื้อ</Label>
                  <DatePickerCE value={orderDate} onChange={setOrderDate} placeholder="เลือกวันที่" maxDate={new Date()} />
                </div>

                {/* รหัสเมนูที่ผิด */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-sm">รหัสเมนูที่ผิด</Label>
                    <Input placeholder="เช่น M01" value={claimMenuCode} onChange={(e) => setClaimMenuCode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">ชื่อเมนูที่ผิด</Label>
                    <Input placeholder="เช่น Matcha Latte" value={claimMenuName} onChange={(e) => setClaimMenuName(e.target.value)} />
                  </div>
                </div>

                {/* รายละเอียดการสั่ง */}
                <div className="space-y-2">
                  <Label className="text-sm">รายละเอียดการสั่ง</Label>
                  <Textarea placeholder="เช่น Matcha Latte หวานน้อย เย็น ไซส์ L" value={claimOrderDetail} onChange={(e) => setClaimOrderDetail(e.target.value)} rows={2} />
                </div>

                {/* ความผิดพลาด */}
                <div className="space-y-2">
                  <Label className="text-sm">ความผิดพลาด <span className="text-destructive">*</span></Label>
                  <Textarea placeholder="เช่น ทำผิดเมนู, ใส่น้ำตาลผิด..." value={claimError} onChange={(e) => setClaimError(e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* เมนูชดเชย */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm">เมนูที่ชดเชย</h3>
                <p className="text-xs text-muted-foreground -mt-2">เลือกว่าจะชดเชยเมนูอะไรให้ลูกค้า</p>

                {/* Mode selector */}
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                  <button className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${compMode === "same" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`} onClick={() => { setCompMode("same"); setCompensationMenuId(""); setCustomCompName(""); }}>
                    ทำแก้วที่พลาดคืน
                  </button>
                  <button className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${compMode === "select" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`} onClick={() => { setCompMode("select"); setCustomCompName(""); }}>
                    เลือกจากรายการ
                  </button>
                  <button className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${compMode === "custom" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`} onClick={() => { setCompMode("custom"); setCompensationMenuId(""); }}>
                    พิมพ์เอง
                  </button>
                </div>

                {compMode === "same" && (
                  <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                    <p className="font-medium">ชดเชยเมนูเดิมที่พลาด</p>
                    <p className="text-xs mt-1">ระบบจะใช้ชื่อเมนูที่ผิดพลาดด้านบนเป็นเมนูชดเชย (ทำแก้วที่พลาดส่งคืน)</p>
                    {claimMenuName && <p className="text-xs mt-1 font-medium">ชดเชย: {claimMenuCode ? `${claimMenuCode} - ` : ""}{claimMenuName}</p>}
                    {!claimMenuName && <p className="text-xs mt-1 text-blue-500">กรุณากรอกชื่อเมนูที่ผิดด้านบนก่อน</p>}
                  </div>
                )}

                {compMode === "select" && (
                  <div className="space-y-2">
                    <Label className="text-sm">เลือกเมนูชดเชย</Label>
                    <Select value={compensationMenuId} onValueChange={setCompensationMenuId}>
                      <SelectTrigger><SelectValue placeholder="เลือกเมนูชดเชย" /></SelectTrigger>
                      <SelectContent>
                        {menuItems?.map((m: any) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.code} - {m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCompMenu && (
                      <p className="text-xs text-muted-foreground">ชดเชย: {selectedCompMenu.code} - {selectedCompMenu.name}</p>
                    )}
                  </div>
                )}

                {compMode === "custom" && (
                  <div className="space-y-2">
                    <Label className="text-sm">พิมพ์ชื่อเมนูชดเชย</Label>
                    <Input placeholder="เช่น Matcha Latte เย็น ไซส์ L" value={customCompName} onChange={(e) => setCustomCompName(e.target.value)} />
                    <p className="text-xs text-muted-foreground">พิมพ์ชื่อเมนูที่ต้องการชดเชยได้เลย ไม่จำเป็นต้องอยู่ในรายการ</p>
                  </div>
                )}

                {/* Remark สำหรับหน้าร้าน */}
                <div className="space-y-2">
                  <Label className="text-sm">หมายเหตุสำหรับหน้าร้าน</Label>
                  <Input placeholder="เช่น หวานน้อย เย็น ไซส์ L, ใส่นมสด" value={compensationRemark} onChange={(e) => setCompensationRemark(e.target.value)} />
                  <p className="text-xs text-muted-foreground">ระบุรายละเอียดเพิ่มเติมเพื่อให้หน้าร้านทำได้ถูกต้อง</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">อายุโค้ด (วัน)</Label>
                  <Select value={expiryDays} onValueChange={setExpiryDays}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 วัน</SelectItem>
                      <SelectItem value="14">14 วัน</SelectItem>
                      <SelectItem value="30">30 วัน</SelectItem>
                      <SelectItem value="60">60 วัน</SelectItem>
                      <SelectItem value="90">90 วัน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* ระบุลูกค้า */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm">ระบุลูกค้า</h3>

                <div className="flex gap-1 bg-muted rounded-lg p-1">
                  <button className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${identifyMethod === "phone" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`} onClick={() => setIdentifyMethod("phone")}>
                    <Phone className="h-3.5 w-3.5" /> เบอร์โทร
                  </button>
                  <button className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${identifyMethod === "qr" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`} onClick={() => setIdentifyMethod("qr")}>
                    <ScanLine className="h-3.5 w-3.5" /> สแกน QR
                  </button>
                  <button className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${identifyMethod === "email" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`} onClick={() => setIdentifyMethod("email")}>
                    <Mail className="h-3.5 w-3.5" /> อีเมล
                  </button>
                </div>

                {identifyMethod === "phone" && (
                  <div className="space-y-2">
                    <Label className="text-sm">เบอร์โทรลูกค้า</Label>
                    <Input placeholder="0812345678" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))} type="tel" inputMode="numeric" maxLength={15} />
                    <p className="text-xs text-muted-foreground">ถ้าเป็นสมาชิก ระบบจะผูกโค้ดเข้าบัญชีอัตโนมัติ</p>
                  </div>
                )}
                {identifyMethod === "qr" && (
                  <div className="space-y-2">
                    <Label className="text-sm">รหัสสมาชิก (Customer ID)</Label>
                    <Input placeholder="กรอกรหัสจากหน้าจอลูกค้า" value={customerId ? String(customerId) : ""} onChange={(e) => { const v = parseInt(e.target.value); setCustomerId(isNaN(v) ? null : v); }} type="number" />
                    <p className="text-xs text-muted-foreground">ให้ลูกค้าเปิดหน้า "โค้ดของฉัน" แล้วกรอกรหัสสมาชิก</p>
                  </div>
                )}
                {identifyMethod === "email" && (
                  <div className="space-y-2">
                    <Label className="text-sm">อีเมลลูกค้า</Label>
                    <Input placeholder="customer@email.com" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} type="email" />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
              <p className="font-medium">หมายเหตุ</p>
              <p className="text-xs mt-1">ระบบจะสร้าง 1 โค้ดชดเชย (HIBI-CL-XXXXXX) มีอายุ {expiryDays} วัน ใช้ได้ครั้งเดียว</p>
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />}
              สร้างโค้ดชดเชย (1 โค้ด)
            </Button>
          </div>
        )}
      </PremiumPageContent>
    </MobileLayout>
  );
}
