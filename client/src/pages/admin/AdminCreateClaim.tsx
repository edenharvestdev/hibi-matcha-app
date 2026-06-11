import AdminPageWrapper from "@/components/AdminPageWrapper";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Loader2, CheckCircle2, Copy, ScanLine, Phone, Mail, History } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";
import DateRangePickerModal from "@/components/common/DateRangePickerModal";

const CHANNEL_OPTIONS = [
  { value: "shopee", label: "Shopee Food" },
  { value: "lineman", label: "LINE MAN" },
  { value: "grab", label: "Grab Food" },
  { value: "gpos", label: "GPOS" },
  { value: "walk_in", label: "หน้าร้าน (Walk-in)" },
] as const;

type IdentifyMethod = "phone" | "qr" | "email";

export default function AdminCreateClaim() {
  const { session, loading, isAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  // Form state
  const [branchId, setBranchId] = useState("");
  const [claimChannel, setClaimChannel] = useState("");
  const [claimOrderId, setClaimOrderId] = useState("");
  const [claimMenuCode, setClaimMenuCode] = useState("");
  const [claimMenuName, setClaimMenuName] = useState("");
  const [claimOrderDetail, setClaimOrderDetail] = useState("");
  const [claimError, setClaimError] = useState("");
  const [compensationMenuId, setCompensationMenuId] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");

  // Customer identification
  const [identifyMethod, setIdentifyMethod] = useState<IdentifyMethod>("phone");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");

  // Result state
  const [resultCode, setResultCode] = useState("");
  const [resultCopyText, setResultCopyText] = useState("");
  const [resultExpiresAt, setResultExpiresAt] = useState("");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
  }, [loading, session, isAdmin, setLocation]);

  const { data: branches } = trpc.branches.list.useQuery(undefined, { enabled: !!session });
  const { data: menuItems } = trpc.reviewMenu.listActive.useQuery(
    branchId ? { branchId: parseInt(branchId) } : undefined,
    { enabled: !!session }
  );

  // When selecting a compensation menu, auto-fill code + name
  const selectedCompMenu = useMemo(() => {
    if (!compensationMenuId || !menuItems) return null;
    return menuItems.find((m: any) => String(m.id) === compensationMenuId);
  }, [compensationMenuId, menuItems]);

  const createClaimMutation = trpc.claims.create.useMutation({
    onSuccess: (data: { success: boolean; code: string; copyText: string; expiresAt: string }) => {
      setResultCode(data.code);
      setResultCopyText(data.copyText);
      setResultExpiresAt(data.expiresAt);
      toast.success("สร้างโค้ดชดเชยสำเร็จ!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (loading || !session) return null;

  const handleSubmit = () => {
    if (!branchId) return toast.error("กรุณาเลือกสาขา");
    if (!claimChannel) return toast.error("กรุณาเลือกช่องทาง");
    if (!claimError.trim()) return toast.error("กรุณาระบุความผิดพลาด");
    if (!customerPhone && !customerEmail && !customerId) {
      return toast.error("กรุณาระบุลูกค้า (เบอร์โทร / อีเมล / สแกน QR)");
    }

    createClaimMutation.mutate({
      branchId: parseInt(branchId),
      claimChannel: claimChannel as any,
      claimOrderId: claimOrderId || undefined,
      claimMenuCode: claimMenuCode || undefined,
      claimMenuName: claimMenuName || undefined,
      claimOrderDetail: claimOrderDetail || undefined,
      claimError: claimError,
      compensationMenuCode: selectedCompMenu?.code || undefined,
      compensationMenuName: selectedCompMenu?.name || undefined,
      customerId: customerId || undefined,
      customerPhone: customerPhone || undefined,
      email: customerEmail || undefined,
      expiryDays: parseInt(expiryDays) || 30,
    });
  };

  const handleReset = () => {
    setBranchId("");
    setClaimChannel("");
    setClaimOrderId("");
    setClaimMenuCode("");
    setClaimMenuName("");
    setClaimOrderDetail("");
    setClaimError("");
    setCompensationMenuId("");
    setExpiryDays("30");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerId(null);
    setCustomerName("");
    setResultCode("");
    setResultCopyText("");
    setResultExpiresAt("");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(resultCopyText);
    toast.success("คัดลอกแล้ว!");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(resultCode);
    toast.success("คัดลอกโค้ดแล้ว!");
  };

  return (
    <AdminPageWrapper title="สร้างโค้ดชดเชย" backPath="/admin">
      <div className="space-y-4">
        {resultCode ? (
          <>
            {/* ── Success State ── */}
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-lg font-bold">สร้างโค้ดสำเร็จ!</h2>
              <p className="text-sm text-muted-foreground mt-1">สร้าง 1 โค้ดชดเชยเรียบร้อย</p>
            </div>

            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <QRCodeDisplay code={resultCode} size={160} showActions={true} />
              </CardContent>
            </Card>

            {/* Copy text block */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">ข้อความสำหรับส่งลูกค้า</p>
                  <Button variant="ghost" size="sm" onClick={handleCopyText}>
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
              <Button variant="outline" className="flex-1" onClick={handleCopyCode}>
                <Copy className="h-4 w-4 mr-2" /> Copy โค้ด
              </Button>
              <Button className="flex-1" onClick={handleReset}>
                สร้างโค้ดใหม่
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* ── Form: ข้อมูลออเดอร์ ── */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">ข้อมูลออเดอร์ที่ผิดพลาด</h3>
                </div>

                {/* สาขา */}
                <div className="space-y-2">
                  <Label>สาขา *</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
                    <SelectContent>
                      {branches?.filter((b: any) => b.isActive).map((b: any) => (
                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ช่องทาง */}
                <div className="space-y-2">
                  <Label>ช่องทางสั่งซื้อ *</Label>
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
                  <Label>เลขออเดอร์</Label>
                  <Input
                    placeholder="เช่น GF-677, LM-12345"
                    value={claimOrderId}
                    onChange={(e) => setClaimOrderId(e.target.value)}
                  />
                </div>

                {/* รหัสเมนูที่ผิดพลาด */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>รหัสเมนูที่ผิด</Label>
                    <Input
                      placeholder="เช่น M01"
                      value={claimMenuCode}
                      onChange={(e) => setClaimMenuCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ชื่อเมนูที่ผิด</Label>
                    <Input
                      placeholder="เช่น Matcha Latte"
                      value={claimMenuName}
                      onChange={(e) => setClaimMenuName(e.target.value)}
                    />
                  </div>
                </div>

                {/* รายละเอียดการสั่ง */}
                <div className="space-y-2">
                  <Label>รายละเอียดการสั่ง</Label>
                  <Textarea
                    placeholder="เช่น Matcha Latte หวานน้อย เย็น ไซส์ L"
                    value={claimOrderDetail}
                    onChange={(e) => setClaimOrderDetail(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* ความผิดพลาด */}
                <div className="space-y-2">
                  <Label>ความผิดพลาด *</Label>
                  <Textarea
                    placeholder="เช่น ทำผิดเมนู, ใส่น้ำตาลผิด, หกระหว่างทาง..."
                    value={claimError}
                    onChange={(e) => setClaimError(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ── Form: เมนูที่ชดเชย ── */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">เมนูที่ชดเชย</h3>
                <div className="space-y-2">
                  <Label>เลือกเมนูชดเชย</Label>
                  <Select value={compensationMenuId} onValueChange={setCompensationMenuId}>
                    <SelectTrigger><SelectValue placeholder="เลือกเมนูชดเชย (หรือเมนูเดียวกัน)" /></SelectTrigger>
                    <SelectContent>
                      {menuItems?.map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.code} - {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCompMenu && (
                    <p className="text-xs text-muted-foreground">
                      ชดเชย: {selectedCompMenu.code} - {selectedCompMenu.name}
                    </p>
                  )}
                </div>

                {/* กำหนดวันหมดอายุ */}
                <div className="space-y-2">
                  <Label>อายุโค้ด (วัน)</Label>
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

            {/* ── Form: ระบุลูกค้า ── */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold">ระบุลูกค้า</h3>

                {/* Tabs: phone / qr / email */}
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                  <button
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${identifyMethod === "phone" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                    onClick={() => setIdentifyMethod("phone")}
                  >
                    <Phone className="h-3.5 w-3.5" /> เบอร์โทร
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${identifyMethod === "qr" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                    onClick={() => setIdentifyMethod("qr")}
                  >
                    <ScanLine className="h-3.5 w-3.5" /> สแกน QR
                  </button>
                  <button
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-medium transition-colors ${identifyMethod === "email" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                    onClick={() => setIdentifyMethod("email")}
                  >
                    <Mail className="h-3.5 w-3.5" /> อีเมล
                  </button>
                </div>

                {identifyMethod === "phone" && (
                  <div className="space-y-2">
                    <Label>เบอร์โทรลูกค้า</Label>
                    <Input
                      placeholder="0812345678"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                      type="tel"
                      inputMode="numeric"
                      maxLength={15}
                    />
                    <p className="text-xs text-muted-foreground">ถ้าเป็นสมาชิก ระบบจะผูกโค้ดเข้าบัญชีอัตโนมัติ</p>
                  </div>
                )}

                {identifyMethod === "qr" && (
                  <div className="space-y-2">
                    <Label>รหัสสมาชิก (Customer ID)</Label>
                    <Input
                      placeholder="กรอกรหัสจากหน้าจอลูกค้า"
                      value={customerId ? String(customerId) : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setCustomerId(isNaN(val) ? null : val);
                      }}
                      type="number"
                    />
                    <p className="text-xs text-muted-foreground">ให้ลูกค้าเปิดหน้า "โค้ดของฉัน" แล้วกรอกรหัสสมาชิก</p>
                  </div>
                )}

                {identifyMethod === "email" && (
                  <div className="space-y-2">
                    <Label>อีเมลลูกค้า</Label>
                    <Input
                      placeholder="customer@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      type="email"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* หมายเหตุ */}
            <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
              <p className="font-medium">หมายเหตุ</p>
              <p className="text-xs mt-1">ระบบจะสร้าง 1 โค้ดชดเชย (HIBI-CL-XXXXXX) มีอายุ {expiryDays} วัน ใช้ได้ครั้งเดียว</p>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={createClaimMutation.isPending}
            >
              {createClaimMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              สร้างโค้ดชดเชย (1 โค้ด)
            </Button>
          </>
        )}
      </div>

      {/* ประวัติการสร้างโค้ด */}
      <CompensationCodeHistory />
    </AdminPageWrapper>
  );
}

function CompensationCodeHistory() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const queryInput = useMemo(() => ({
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }), [dateFrom, dateTo]);
  const { data: allCodes, isLoading } = trpc.codes.branchCodes.useQuery(queryInput);
  const clCodes = useMemo(() => (allCodes || []).filter((c: any) => c.type === "CL").slice(0, 30), [allCodes]);
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[#3D7A3A]" />
          <h3 className="text-sm font-semibold">ประวัติการสร้างโค้ดชดเชย</h3>
        </div>
        <DateRangePickerModal
          dateFrom={dateFrom}
          dateTo={dateTo}
          onApply={(f, t) => { setDateFrom(f); setDateTo(t); }}
          onClear={() => { setDateFrom(""); setDateTo(""); }}
        />
      </div>
      {isLoading ? (
        <div className="text-center py-6 text-muted-foreground text-sm">กำลังโหลด...</div>
      ) : !clCodes.length ? (
        <div className="text-center py-6 text-muted-foreground text-sm">ยังไม่มีประวัติ</div>
      ) : (
        <div className="space-y-2">
          {clCodes.map((code: any) => (
            <Card key={code.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono font-medium">{code.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {code.claimMenuName || "ไม่ระบุเมนู"} • {code.claimChannel || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(code.issuedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}{" "}
                      {new Date(code.issuedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      code.status === "issued" ? "bg-green-100 text-green-700" :
                      code.status === "redeemed" ? "bg-blue-100 text-blue-700" :
                      code.status === "expired" ? "bg-gray-100 text-gray-500" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {code.status === "issued" ? "ใช้ได้" : code.status === "redeemed" ? "ใช้แล้ว" : code.status === "expired" ? "หมดอายุ" : "ยกเลิก"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
