import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import HowToPopup from "@/components/HowToPopup";
import DatePickerCE from "@/components/DatePickerCE";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, CheckCircle2, Clock, XCircle, Loader2, Copy, AlertCircle } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";

const APP_LABELS: Record<string, string> = { shopee: "Shopee Food", lineman: "LINE MAN", grab: "Grab Food", gpos: "GPOS (หน้าร้าน)" };
const ORDER_ID_HINTS: Record<string, string> = {
  shopee: "เลขออเดอร์สั้น เช่น #212 (ดูจากหน้ารายละเอียดคำสั่งซื้อ)",
  lineman: "เลขออเดอร์สั้น เช่น #5175 (ดูจากหน้าข้อมูลออเดอร์)",
  grab: "เลข GF สั้น เช่น GF-677 (ดูจากหน้า History ของ Grab)",
  gpos: "เลขที่ใบเสร็จ 13 หลัก เช่น 0105536123457",
};
const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  pending: { label: "รอตรวจสอบ", icon: Clock, color: "text-amber-500 bg-amber-50" },
  approved: { label: "อนุมัติแล้ว", icon: CheckCircle2, color: "text-green-500 bg-green-50" },
  rejected: { label: "ปฏิเสธ", icon: XCircle, color: "text-red-500 bg-red-50" },
};

// Booking ID format: A- followed by exactly 14 alphanumeric chars = 16 total
const BOOKING_ID_REGEX = /^A-[A-Z0-9]{14}$/;
const BOOKING_ID_LENGTH = 16;

// Shopee Order ID format: all digits, 16-20 chars
const SHOPEE_ORDER_ID_REGEX = /^\d{16,20}$/;
const SHOPEE_ORDER_ID_MIN = 16;
const SHOPEE_ORDER_ID_MAX = 20;

// LINE MAN Order ID format: LMF-YYMMDD-XXXXXXXXX
const LINEMAN_ORDER_ID_REGEX = /^LMF-\d{6}-\d{6,12}$/;

export default function ClaimPoints() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [branchId, setBranchId] = useState<string>("");
  const [deliveryApp, setDeliveryApp] = useState<string>("");
  const [orderId, setOrderId] = useState("");
  // Grab fields
  const [gfNumber, setGfNumber] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [bookingIdError, setBookingIdError] = useState("");
  // Shopee fields
  const [shopeeOrderNumber, setShopeeOrderNumber] = useState("");
  const [shopeeOrderId, setShopeeOrderId] = useState("");
  const [shopeeOrderIdError, setShopeeOrderIdError] = useState("");
  // LINE MAN fields
  const [linemanOrderNumber, setLinemanOrderNumber] = useState("");
  const [linemanOrderId, setLinemanOrderId] = useState("");
  const [linemanOrderIdError, setLinemanOrderIdError] = useState("");

  const [orderAmount, setOrderAmount] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [screenshot, setScreenshot] = useState<{ base64: string; type: string; preview: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isCustomer) setLocation("/branch");
  }, [loading, session, isCustomer, setLocation]);

  const { data: branches } = trpc.branches.list.useQuery(undefined, { enabled: !!session });
  const { data: myClaims, refetch: refetchClaims } = trpc.loyalty.myClaims.useQuery(undefined, { enabled: !!session && isCustomer });
  const submitClaim = trpc.loyalty.submitClaim.useMutation();

  const isGrab = deliveryApp === "grab";
  const isShopee = deliveryApp === "shopee";
  const isLineman = deliveryApp === "lineman";

  // Validate booking ID format in real-time (Grab)
  const handleBookingIdChange = useCallback((val: string) => {
    const cleaned = val.toUpperCase().trim();
    setBookingId(cleaned);

    if (!cleaned) {
      setBookingIdError("");
      return;
    }

    if (!cleaned.startsWith("A-")) {
      setBookingIdError("ต้องขึ้นต้นด้วย A-");
    } else if (cleaned.length < BOOKING_ID_LENGTH) {
      setBookingIdError(`กรอกแล้ว ${cleaned.length}/${BOOKING_ID_LENGTH} ตัว (ยังขาด ${BOOKING_ID_LENGTH - cleaned.length} ตัว)`);
    } else if (cleaned.length > BOOKING_ID_LENGTH) {
      setBookingIdError(`เกิน! กรอก ${cleaned.length}/${BOOKING_ID_LENGTH} ตัว (เกิน ${cleaned.length - BOOKING_ID_LENGTH} ตัว)`);
    } else if (!BOOKING_ID_REGEX.test(cleaned)) {
      setBookingIdError("รูปแบบไม่ถูกต้อง ต้องเป็น A- ตามด้วยตัวอักษร/ตัวเลข 14 ตัว");
    } else {
      setBookingIdError("");
    }
  }, []);

  // Validate Shopee Order ID format in real-time
  const handleShopeeOrderIdChange = useCallback((val: string) => {
    // Only allow digits
    const cleaned = val.replace(/\D/g, "");
    setShopeeOrderId(cleaned);

    if (!cleaned) {
      setShopeeOrderIdError("");
      return;
    }

    if (cleaned.length < SHOPEE_ORDER_ID_MIN) {
      setShopeeOrderIdError(`กรอกแล้ว ${cleaned.length} หลัก (ต้องมีอย่างน้อย ${SHOPEE_ORDER_ID_MIN} หลัก)`);
    } else if (cleaned.length > SHOPEE_ORDER_ID_MAX) {
      setShopeeOrderIdError(`เกิน! กรอก ${cleaned.length} หลัก (สูงสุด ${SHOPEE_ORDER_ID_MAX} หลัก)`);
    } else {
      setShopeeOrderIdError("");
    }
  }, []);

  // Validate LINE MAN Order ID format in real-time with locked dashes
  const handleLinemanOrderIdChange = useCallback((val: string) => {
    // Auto-format: LMF-YYMMDD-XXXXXXXXX
    let cleaned = val.toUpperCase();
    
    // If user types only digits/letters, auto-insert LMF- prefix and dashes
    // Allow pasting full format or typing character by character
    // Remove any characters that aren't alphanumeric or dash
    cleaned = cleaned.replace(/[^A-Z0-9-]/g, "");
    
    // Auto-prefix LMF- if user starts typing without it
    if (cleaned.length > 0 && !cleaned.startsWith("L") && !cleaned.startsWith("LM") && !cleaned.startsWith("LMF")) {
      // User might be pasting just the number part
    }
    
    setLinemanOrderId(cleaned);

    if (!cleaned) {
      setLinemanOrderIdError("");
      return;
    }

    if (!cleaned.startsWith("LMF-")) {
      setLinemanOrderIdError("ต้องขึ้นต้นด้วย LMF-");
    } else {
      // Check format: LMF-YYMMDD-XXXXXXXXX
      const parts = cleaned.split("-");
      if (parts.length < 3) {
        // Still typing the date part
        const afterLMF = cleaned.substring(4);
        if (afterLMF.length < 6) {
          setLinemanOrderIdError(`กรอกวันที่ต่อ: LMF-${afterLMF}... (ต้องมี 6 หลัก YYMMDD)`);
        } else {
          setLinemanOrderIdError("ต้องมีขีด - หลังวันที่ (LMF-YYMMDD-...)");
        }
      } else if (parts.length === 3) {
        const datePart = parts[1];
        const numPart = parts[2];
        
        if (datePart.length !== 6 || !/^\d{6}$/.test(datePart)) {
          setLinemanOrderIdError("วันที่ต้องเป็นตัวเลข 6 หลัก (YYMMDD)");
        } else if (numPart.length === 0) {
          setLinemanOrderIdError("กรุณากรอกเลขท้ายต่อ");
        } else if (!/^\d+$/.test(numPart)) {
          setLinemanOrderIdError("ส่วนท้ายต้องเป็นตัวเลขเท่านั้น");
        } else if (numPart.length < 6) {
          setLinemanOrderIdError(`กรอกแล้ว ${numPart.length} หลัก (ต้องมีอย่างน้อย 6 หลัก)`);
        } else if (numPart.length > 12) {
          setLinemanOrderIdError(`เกิน! ${numPart.length} หลัก (สูงสุด 12 หลัก)`);
        } else {
          setLinemanOrderIdError("");
        }
      } else {
        setLinemanOrderIdError("รูปแบบไม่ถูกต้อง ต้องเป็น LMF-YYMMDD-XXXXXXXXX");
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ใหญ่เกิน 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setScreenshot({ base64, type: file.type, preview: URL.createObjectURL(file) });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async () => {
    // Common validation
    if (!branchId || !deliveryApp || !orderAmount) {
      toast.error("⚠️ กรุณากรอกข้อมูลให้ครบ — เลือกสาขา, แอปสั่งอาหาร, และยอดซื้อ");
      return;
    }

    // Grab-specific validation
    if (isGrab) {
      if (!gfNumber.trim()) {
        toast.error("⚠️ กรุณากรอกเลข GF — ดูจากหน้า History ของ Grab (เช่น GF-677)");
        return;
      }
      if (!bookingId.trim()) {
        toast.error("⚠️ กรุณากรอก Booking ID — รหัสยืนยัน 16 ตัว (เช่น A-949862QGXXISAV)");
        return;
      }
      if (bookingId.length !== BOOKING_ID_LENGTH || !BOOKING_ID_REGEX.test(bookingId)) {
        toast.error(`❌ Booking ID ต้องมี ${BOOKING_ID_LENGTH} ตัวพอดี (A- + 14 ตัวอักษร) — กรุณาตรวจสอบอีกครั้ง`);
        return;
      }
    } else if (isShopee) {
      // Shopee-specific validation
      if (!shopeeOrderNumber.trim()) {
        toast.error("⚠️ กรุณากรอกเลขออเดอร์สั้น — ดูจากหน้ารายละเอียดคำสั่งซื้อ Shopee (เช่น #212)");
        return;
      }
      if (!shopeeOrderId.trim()) {
        toast.error("⚠️ กรุณากรอกเลขคำสั่งซื้อยาว — ตัวเลข 16-20 หลัก (เช่น 3011303289058816525)");
        return;
      }
      if (!SHOPEE_ORDER_ID_REGEX.test(shopeeOrderId)) {
        toast.error(`❌ เลขคำสั่งซื้อไม่ถูกต้อง — ต้องเป็นตัวเลข ${SHOPEE_ORDER_ID_MIN}-${SHOPEE_ORDER_ID_MAX} หลัก กรุณาตรวจสอบอีกครั้ง`);
        return;
      }
    } else if (isLineman) {
      // LINE MAN-specific validation
      if (!linemanOrderNumber.trim()) {
        toast.error("⚠️ กรุณากรอกเลขออเดอร์สั้น — ดูจากหน้ารายละเอียด LINE MAN (เช่น #5175)");
        return;
      }
      if (!linemanOrderId.trim()) {
        toast.error("⚠️ กรุณากรอกรหัสใบสั่งซื้อ — รูปแบบ LMF-YYMMDD-XXXXXXXXX (เช่น LMF-260321-538845175)");
        return;
      }
      if (!LINEMAN_ORDER_ID_REGEX.test(linemanOrderId)) {
        toast.error("❌ รหัสไม่ถูกรูปแบบ — ต้องเป็น LMF-YYMMDD-XXXXXXXXX (เช่น LMF-260321-538845175)");
        return;
      }
    } else {
      if (!orderId) {
        toast.error("⚠️ กรุณากรอก Order ID");
        return;
      }
    }

    const amount = parseInt(orderAmount);
    if (isNaN(amount) || amount < 1) { toast.error("❌ ยอดซื้อไม่ถูกต้อง — กรุณาใส่ยอดซื้อเป็นตัวเลข (เช่น 150)"); return; }
    setSubmitting(true);
    try {
      await submitClaim.mutateAsync({
        branchId: parseInt(branchId),
        deliveryApp: deliveryApp as "shopee" | "lineman" | "grab" | "gpos",
        orderId: isGrab ? gfNumber.trim() : isShopee ? shopeeOrderNumber.trim() : isLineman ? linemanOrderNumber.trim() : orderId,
        gfNumber: isGrab ? gfNumber.trim() : undefined,
        bookingId: isGrab ? bookingId : undefined,
        shopeeOrderNumber: isShopee ? shopeeOrderNumber.trim() : undefined,
        shopeeOrderId: isShopee ? shopeeOrderId : undefined,
        linemanOrderNumber: isLineman ? linemanOrderNumber.trim() : undefined,
        linemanOrderId: isLineman ? linemanOrderId : undefined,
        orderAmount: amount,
        orderDate: orderDate || undefined,
        screenshotBase64: screenshot?.base64,
        screenshotType: screenshot?.type,
      });
      toast.success("ส่งคำขอสะสมแต้มแล้ว! รอการตรวจสอบ");
      setBranchId(""); setDeliveryApp(""); setOrderId(""); setGfNumber(""); setBookingId(""); setBookingIdError(""); setOrderDate("");
      setShopeeOrderNumber(""); setShopeeOrderId(""); setShopeeOrderIdError("");
      setLinemanOrderNumber(""); setLinemanOrderId(""); setLinemanOrderIdError("");
      setOrderAmount(""); setScreenshot(null);
      setShowForm(false);
      refetchClaims();
    } catch (err: any) {
      toast.error(err.message || "⚠️ เกิดข้อผิดพลาด — กรุณาลองใหม่อีกครั้ง หากยังไม่ได้ กรุณาติดต่อร้านค้า");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset fields when switching app
  useEffect(() => {
    setGfNumber("");
    setBookingId("");
    setBookingIdError("");
    setShopeeOrderNumber("");
    setShopeeOrderId("");
    setShopeeOrderIdError("");
    setLinemanOrderNumber("");
    setLinemanOrderId("");
    setLinemanOrderIdError("");
    setOrderId("");
  }, [deliveryApp]);

  if (loading || !session) return null;

  const hasShopeeError = isShopee && !!shopeeOrderIdError && shopeeOrderId.length > 0;
  const hasGrabError = isGrab && !!bookingIdError && bookingId.length > 0;
  const hasLinemanError = isLineman && !!linemanOrderIdError && linemanOrderId.length > 0;

  return (
    <MobileLayout title="สะสมแต้ม" showBack backPath="/customer/my-points">
      <PremiumPageContent>
        {/* Popup วิธีสะสมแต้ม */}
        <HowToPopup
          contentKey="loyalty_howto_image"
          storageKey="hibi_loyalty_howto_seen"
          dismissLabel="เข้าใจแล้ว"
          linkLabel="วิธีสะสมแต้ม"
        />
        {/* Toggle */}
        <div className="flex gap-2">
          <Button variant={showForm ? "default" : "outline"} size="sm" onClick={() => setShowForm(true)} className="flex-1 text-xs">
            ส่งคำขอใหม่
          </Button>
          <Button variant={!showForm ? "default" : "outline"} size="sm" onClick={() => setShowForm(false)} className="flex-1 text-xs">
            คำขอของฉัน ({myClaims?.length ?? 0})
          </Button>
        </div>

        {showForm ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div>
                <Label className="text-xs font-medium mb-1.5 block">สาขาที่สั่ง</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
                  <SelectContent>
                    {branches?.filter(b => b.isActive).map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">แอปเดลิเวอรี</Label>
                <Select value={deliveryApp} onValueChange={setDeliveryApp}>
                  <SelectTrigger><SelectValue placeholder="เลือกแอป" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpos">GPOS (หน้าร้าน)</SelectItem>
                    <SelectItem value="shopee">Shopee Food</SelectItem>
                    <SelectItem value="lineman">LINE MAN</SelectItem>
                    <SelectItem value="grab">Grab Food</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grab: dual input - GF number + Booking ID */}
              {isGrab ? (
                <>
                  {/* GF Number */}
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">
                      เลข GF (เลขออเดอร์สั้น)
                    </Label>
                    <Input
                      value={gfNumber}
                      onChange={(e) => setGfNumber(e.target.value)}
                      placeholder="เช่น GF-677"
                      className="font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ดูจากหน้า History ของ Grab (เช่น GF-677, GF-132)
                    </p>
                  </div>

                  {/* Booking ID */}
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">
                      Booking ID (รหัสยืนยัน 16 ตัว)
                    </Label>
                    <div className="relative">
                      <Input
                        value={bookingId}
                        onChange={(e) => handleBookingIdChange(e.target.value)}
                        placeholder="เช่น A-949862QGXXISAV"
                        maxLength={20}
                        className={`font-mono text-sm tracking-wider pr-10 ${
                          bookingIdError ? "border-red-400 focus-visible:ring-red-400" :
                          bookingId.length === BOOKING_ID_LENGTH && !bookingIdError ? "border-green-400 focus-visible:ring-green-400" : ""
                        }`}
                      />
                      {/* Character counter badge */}
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
                        bookingId.length === BOOKING_ID_LENGTH && !bookingIdError ? "text-green-500" :
                        bookingId.length > BOOKING_ID_LENGTH ? "text-red-500" : "text-muted-foreground"
                      }`}>
                        {bookingId.length}/{BOOKING_ID_LENGTH}
                      </span>
                    </div>

                    {/* Error/hint message */}
                    {bookingIdError ? (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {bookingIdError}
                      </p>
                    ) : bookingId.length === BOOKING_ID_LENGTH ? (
                      <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        รูปแบบถูกต้อง
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        คัดลอกจากแอป Grab → รายละเอียดออเดอร์ → Booking ID (ขึ้นต้น A- ตามด้วย 14 ตัว)
                      </p>
                    )}
                  </div>
                </>
              ) : isShopee ? (
                <>
                  {/* Shopee Order Number (short) */}
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">
                      เลขออเดอร์สั้น (เช่น #212)
                    </Label>
                    <Input
                      value={shopeeOrderNumber}
                      onChange={(e) => setShopeeOrderNumber(e.target.value)}
                      placeholder="เช่น #212"
                      className="font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ดูจากหน้ารายละเอียดคำสั่งซื้อ Shopee (ตัวเลขด้านบน เช่น #212)
                    </p>
                  </div>

                  {/* Shopee Order ID (long) */}
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">
                      เลขคำสั่งซื้อ (ตัวเลขยาว)
                    </Label>
                    <div className="relative">
                      <Input
                        value={shopeeOrderId}
                        onChange={(e) => handleShopeeOrderIdChange(e.target.value)}
                        placeholder="เช่น 3011303289058816525"
                        maxLength={22}
                        inputMode="numeric"
                        className={`font-mono text-sm tracking-wider pr-12 ${
                          shopeeOrderIdError ? "border-red-400 focus-visible:ring-red-400" :
                          shopeeOrderId.length >= SHOPEE_ORDER_ID_MIN && shopeeOrderId.length <= SHOPEE_ORDER_ID_MAX && !shopeeOrderIdError ? "border-green-400 focus-visible:ring-green-400" : ""
                        }`}
                      />
                      {/* Digit counter badge */}
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
                        shopeeOrderId.length >= SHOPEE_ORDER_ID_MIN && shopeeOrderId.length <= SHOPEE_ORDER_ID_MAX && !shopeeOrderIdError ? "text-green-500" :
                        shopeeOrderId.length > SHOPEE_ORDER_ID_MAX ? "text-red-500" : "text-muted-foreground"
                      }`}>
                        {shopeeOrderId.length} หลัก
                      </span>
                    </div>

                    {/* Error/hint message */}
                    {shopeeOrderIdError ? (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {shopeeOrderIdError}
                      </p>
                    ) : shopeeOrderId.length >= SHOPEE_ORDER_ID_MIN && shopeeOrderId.length <= SHOPEE_ORDER_ID_MAX ? (
                      <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        รูปแบบถูกต้อง
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        คัดลอกจากแอป Shopee → รายละเอียดคำสั่งซื้อ → เลขที่คำสั่งซื้อ (กดปุ่มคัดลอก)
                      </p>
                    )}
                  </div>
                </>
              ) : isLineman ? (
                <>
                  {/* LINE MAN Order Number (short) */}
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">
                      เลขออเดอร์สั้น (เช่น #5175)
                    </Label>
                    <Input
                      value={linemanOrderNumber}
                      onChange={(e) => setLinemanOrderNumber(e.target.value)}
                      placeholder="เช่น #5175"
                      className="font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ดูจากหน้าข้อมูลออเดอร์ LINE MAN (ตัวเลขด้านบน เช่น #5175)
                    </p>
                  </div>

                  {/* LINE MAN Order ID (long - LMF format) */}
                  <div>
                    <Label className="text-xs font-medium mb-1.5 block">
                      รหัสใบสั่งซื้อ (เช่น LMF-260321-538845175)
                    </Label>
                    <div className="relative">
                      <Input
                        value={linemanOrderId}
                        onChange={(e) => handleLinemanOrderIdChange(e.target.value)}
                        placeholder="LMF-YYMMDD-XXXXXXXXX"
                        maxLength={25}
                        className={`font-mono text-sm tracking-wider pr-10 ${
                          linemanOrderIdError ? "border-red-400 focus-visible:ring-red-400" :
                          LINEMAN_ORDER_ID_REGEX.test(linemanOrderId) ? "border-green-400 focus-visible:ring-green-400" : ""
                        }`}
                      />
                      {/* Status indicator */}
                      {linemanOrderId.length > 0 && (
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
                          LINEMAN_ORDER_ID_REGEX.test(linemanOrderId) ? "text-green-500" :
                          linemanOrderIdError ? "text-red-500" : "text-muted-foreground"
                        }`}>
                          {LINEMAN_ORDER_ID_REGEX.test(linemanOrderId) ? "✓" : "..."}
                        </span>
                      )}
                    </div>

                    {/* Error/hint message */}
                    {linemanOrderIdError ? (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {linemanOrderIdError}
                      </p>
                    ) : LINEMAN_ORDER_ID_REGEX.test(linemanOrderId) ? (
                      <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        รูปแบบถูกต้อง
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        คัดลอกจากแอป LINE MAN → ข้อมูลออเดอร์ → รหัสใบสั่งซื้อ (เช่น LMF-260321-538845175)
                      </p>
                    )}
                  </div>
                </>
              ) : (
                /* GPOS or other: single order ID */
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">{deliveryApp === "gpos" ? "เลขที่ใบเสร็จ" : "Order ID / หมายเลขออเดอร์"}</Label>
                  <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder={ORDER_ID_HINTS[deliveryApp] || "กรอกรหัสสั่งซื้อ"} />
                  {deliveryApp && <p className="text-[10px] text-muted-foreground mt-1">{ORDER_ID_HINTS[deliveryApp]}</p>}
                </div>
              )}

              <div>
                <Label className="text-xs font-medium mb-1.5 block">วันที่สั่งซื้อ</Label>
                <DatePickerCE
                  value={orderDate}
                  onChange={setOrderDate}
                  placeholder="เลือกวันที่สั่งซื้อ"
                  maxDate={new Date()}
                />
                <p className="text-[10px] text-muted-foreground mt-1">วันที่ที่สั่งซื้อจริง (ไม่ใช่วันที่ส่งคำขอ)</p>
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">ยอดซื้อ (บาท)</Label>
                <Input type="number" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} placeholder="เช่น 150" />
                {orderAmount && parseInt(orderAmount) >= 10 && (
                  <p className="text-xs text-primary mt-1">
                    จะได้รับประมาณ {Math.floor(parseInt(orderAmount) / 10)} แต้ม (อัตรา Green)
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium mb-1.5 block">ภาพหน้าจอยอดซื้อ (ถ้ามี)</Label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {screenshot ? (
                  <div className="relative">
                    <img src={screenshot.preview} alt="Screenshot" className="w-full h-40 object-cover rounded-xl border" />
                    <button onClick={() => setScreenshot(null)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-muted-foreground/20 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/40 transition-colors"
                  >
                    <Camera className="h-6 w-6 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground">แตะเพื่อเลือกรูป</span>
                  </button>
                )}
              </div>

              <Button onClick={handleSubmit} disabled={submitting || hasGrabError || hasShopeeError || hasLinemanError} className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                ส่งคำขอสะสมแต้ม
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {!myClaims?.length ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">ยังไม่มีคำขอสะสมแต้ม</p>
                </CardContent>
              </Card>
            ) : (
              myClaims.map((claim: any) => {
                const statusCfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                const isGrabClaim = claim.deliveryApp === "grab";
                const isShopeeClaim = claim.deliveryApp === "shopee";
                const isLinemanClaim = claim.deliveryApp === "lineman";
                return (
                  <Card key={claim.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{APP_LABELS[claim.deliveryApp] || claim.deliveryApp}</p>
                          {isGrabClaim && claim.gfNumber ? (
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground font-mono">#{claim.gfNumber}</p>
                              {claim.bookingId && (
                                <div className="flex items-center gap-1">
                                  <p className="text-[10px] text-muted-foreground font-mono">ID: {claim.bookingId}</p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(claim.bookingId);
                                      toast.success("คัดลอก Booking ID แล้ว");
                                    }}
                                    className="text-muted-foreground/50 hover:text-primary"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : isShopeeClaim && claim.shopeeOrderNumber ? (
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground font-mono">#{claim.shopeeOrderNumber}</p>
                              {claim.shopeeOrderId && (
                                <div className="flex items-center gap-1">
                                  <p className="text-[10px] text-muted-foreground font-mono">เลขคำสั่งซื้อ: {claim.shopeeOrderId}</p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(claim.shopeeOrderId);
                                      toast.success("คัดลอกเลขคำสั่งซื้อแล้ว");
                                    }}
                                    className="text-muted-foreground/50 hover:text-primary"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : isLinemanClaim && claim.linemanOrderNumber ? (
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground font-mono">#{claim.linemanOrderNumber}</p>
                              {claim.linemanOrderId && (
                                <div className="flex items-center gap-1">
                                  <p className="text-[10px] text-muted-foreground font-mono">รหัส: {claim.linemanOrderId}</p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(claim.linemanOrderId);
                                      toast.success("คัดลอกรหัสใบสั่งซื้อแล้ว");
                                    }}
                                    className="text-muted-foreground/50 hover:text-primary"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">#{claim.orderId}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>ยอด: {claim.orderAmount} บาท</span>
                        {claim.pointsAwarded && <span className="text-primary font-medium">+{claim.pointsAwarded} แต้ม</span>}
                      </div>
                      {claim.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">เหตุผล: {claim.rejectionReason}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDate(claim.createdAt, { shortYear: true })}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </PremiumPageContent>
    </MobileLayout>
  );
}
