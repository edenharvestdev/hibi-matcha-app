import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import HowToPopup from "@/components/HowToPopup";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Camera, X, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// ── Validation constants (same as ClaimPoints) ──
// Grab: Booking ID = A- + 14 alphanumeric = 16 total
const BOOKING_ID_REGEX = /^A-[A-Z0-9]{14}$/;
const BOOKING_ID_LENGTH = 16;

// Shopee: Order ID = 16-20 digits
const SHOPEE_ORDER_ID_REGEX = /^\d{16,20}$/;
const SHOPEE_ORDER_ID_MIN = 16;
const SHOPEE_ORDER_ID_MAX = 20;

// LINE MAN: Order ID = LMF-YYMMDD-XXXXXXXXX
const LINEMAN_ORDER_ID_REGEX = /^LMF-\d{6}-\d{6,12}$/;

// GPOS: Receipt number = 13 digits
const GPOS_RECEIPT_REGEX = /^\d{13}$/;

export default function SubmitReview() {
  const { session, loading } = useHibiAuth();
  const [, setLocation] = useLocation();



  // Common fields
  const [branchId, setBranchId] = useState("");
  const [deliveryApp, setDeliveryApp] = useState("");

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

  // GPOS field
  const [gposReceipt, setGposReceipt] = useState("");
  const [gposReceiptError, setGposReceiptError] = useState("");

  // Image
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageType, setImageType] = useState<string>("image/jpeg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
  }, [loading, session, setLocation]);

  const { data: branchesList } = trpc.branches.list.useQuery();

  const submitMutation = trpc.reviews.submit.useMutation({
    onSuccess: () => {
      toast.success("ส่งรีวิวสำเร็จ! รอการอนุมัติ 2-4 วันทำการ");
      setLocation("/customer/my-requests");
    },
    onError: (err) => toast.error(err.message || "⚠️ เกิดข้อผิดพลาด — กรุณาลองใหม่อีกครั้ง"),
  });

  const isGrab = deliveryApp === "grab";
  const isShopee = deliveryApp === "shopee";
  const isLineman = deliveryApp === "lineman";
  const isGpos = deliveryApp === "gpos";

  // ── Grab: Booking ID validation ──
  const handleBookingIdChange = useCallback((val: string) => {
    const cleaned = val.toUpperCase().trim();
    setBookingId(cleaned);
    if (!cleaned) { setBookingIdError(""); return; }
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

  // ── Shopee: Order ID validation ──
  const handleShopeeOrderIdChange = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setShopeeOrderId(cleaned);
    if (!cleaned) { setShopeeOrderIdError(""); return; }
    if (cleaned.length < SHOPEE_ORDER_ID_MIN) {
      setShopeeOrderIdError(`กรอกแล้ว ${cleaned.length} หลัก (ต้องมีอย่างน้อย ${SHOPEE_ORDER_ID_MIN} หลัก)`);
    } else if (cleaned.length > SHOPEE_ORDER_ID_MAX) {
      setShopeeOrderIdError(`เกิน! กรอก ${cleaned.length} หลัก (สูงสุด ${SHOPEE_ORDER_ID_MAX} หลัก)`);
    } else {
      setShopeeOrderIdError("");
    }
  }, []);

  // ── LINE MAN: Order ID validation ──
  const handleLinemanOrderIdChange = useCallback((val: string) => {
    let cleaned = val.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setLinemanOrderId(cleaned);
    if (!cleaned) { setLinemanOrderIdError(""); return; }
    if (!cleaned.startsWith("LMF-")) {
      setLinemanOrderIdError("ต้องขึ้นต้นด้วย LMF-");
    } else {
      const parts = cleaned.split("-");
      if (parts.length < 3) {
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

  // ── GPOS: Receipt validation ──
  const handleGposReceiptChange = useCallback((val: string) => {
    const cleaned = val.replace(/\D/g, "");
    setGposReceipt(cleaned);
    if (!cleaned) { setGposReceiptError(""); return; }
    if (cleaned.length < 13) {
      setGposReceiptError(`กรอกแล้ว ${cleaned.length}/13 หลัก (ยังขาด ${13 - cleaned.length} หลัก)`);
    } else if (cleaned.length > 13) {
      setGposReceiptError(`เกิน! กรอก ${cleaned.length}/13 หลัก`);
    } else {
      setGposReceiptError("");
    }
  }, []);

  // Reset fields when switching app
  useEffect(() => {
    setGfNumber(""); setBookingId(""); setBookingIdError("");
    setShopeeOrderNumber(""); setShopeeOrderId(""); setShopeeOrderIdError("");
    setLinemanOrderNumber(""); setLinemanOrderId(""); setLinemanOrderIdError("");
    setGposReceipt(""); setGposReceiptError("");
  }, [deliveryApp]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("รูปภาพต้องมีขนาดไม่เกิน 5MB"); return; }
    setImageType(file.type);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  // ── Compute whether form is valid (for disabling submit button) ──
  const isFormValid = (() => {
    if (!branchId || !deliveryApp) return false;
    if (isGrab) {
      if (!gfNumber.trim()) return false;
      if (!bookingId || bookingId.length !== BOOKING_ID_LENGTH || !BOOKING_ID_REGEX.test(bookingId)) return false;
    } else if (isShopee) {
      if (!shopeeOrderNumber.trim()) return false;
      if (!shopeeOrderId || !SHOPEE_ORDER_ID_REGEX.test(shopeeOrderId)) return false;
    } else if (isLineman) {
      if (!linemanOrderNumber.trim()) return false;
      if (!linemanOrderId || !LINEMAN_ORDER_ID_REGEX.test(linemanOrderId)) return false;
    } else if (isGpos) {
      if (!gposReceipt || !GPOS_RECEIPT_REGEX.test(gposReceipt)) return false;
    }
    if (!imageBase64) return false;
    return true;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error("⚠️ กรุณากรอกข้อมูลและแนบรูปภาพรีวิวให้ครบ — ต้องมีรูปหน้าจอยอดซื้อประกอบด้วย");
      return;
    }

    // Build orderId (primary key for display)
    let orderId: string;
    if (isGrab) orderId = gfNumber.trim();
    else if (isShopee) orderId = shopeeOrderNumber.trim();
    else if (isLineman) orderId = linemanOrderNumber.trim();
    else orderId = gposReceipt;

    submitMutation.mutate({
      branchId: parseInt(branchId),
      deliveryApp: deliveryApp as "shopee" | "lineman" | "grab" | "gpos",
      orderId,
      gfNumber: isGrab ? gfNumber.trim() : undefined,
      bookingId: isGrab ? bookingId : undefined,
      shopeeOrderNumber: isShopee ? shopeeOrderNumber.trim() : undefined,
      shopeeOrderId: isShopee ? shopeeOrderId : undefined,
      linemanOrderNumber: isLineman ? linemanOrderNumber.trim() : undefined,
      linemanOrderId: isLineman ? linemanOrderId : undefined,
      imageBase64: imageBase64!,
      imageType: imageType,
    });
  };

  if (loading || !session) return null;

  return (
    <MobileLayout title="ส่งรีวิว" showBack backPath="/customer">
      <PremiumPageContent>
        {/* Popup วิธีรีวิว */}
        <HowToPopup
          contentKey="review_howto_image"
          storageKey="hibi_review_howto_seen"
          fallbackUrl="https://d2xsxph8kpxj0f.cloudfront.net/310419663029164707/Vnv2Yn9Lbgw8vJ5BLPM68j/review-howto-infographic_db5605b0.jpg"
          dismissLabel="เข้าใจแล้ว เริ่มส่งรีวิว"
          linkLabel="วิธีรีวิวที่ถูกต้อง (อ่านก่อนส่ง)"
        />

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Branch */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">สาขาที่สั่ง</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="เลือกสาขา" /></SelectTrigger>
                  <SelectContent>
                    {branchesList?.filter(b => b.isActive).map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery App */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">แอปเดลิเวอรี</Label>
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

              {/* ── Grab: GF Number + Booking ID ── */}
              {isGrab && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">เลข GF (เลขออเดอร์สั้น) <span className="text-red-500">*</span></Label>
                    <Input
                      value={gfNumber}
                      onChange={(e) => setGfNumber(e.target.value)}
                      placeholder="เช่น GF-677"
                      className="font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">ดูจากหน้า History ของ Grab (เช่น GF-677, GF-132)</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Booking ID (รหัสยืนยัน 16 ตัว) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        value={bookingId}
                        onChange={(e) => handleBookingIdChange(e.target.value)}
                        placeholder="เช่น A-949862QGXXISAV"
                        maxLength={20}
                        className={`font-mono text-sm tracking-wider pr-16 ${
                          bookingIdError ? "border-red-400 focus-visible:ring-red-400" :
                          bookingId.length === BOOKING_ID_LENGTH && !bookingIdError ? "border-green-400 focus-visible:ring-green-400" : ""
                        }`}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
                        bookingId.length === BOOKING_ID_LENGTH && !bookingIdError ? "text-green-500" :
                        bookingId.length > BOOKING_ID_LENGTH ? "text-red-500" : "text-muted-foreground"
                      }`}>
                        {bookingId.length}/{BOOKING_ID_LENGTH}
                      </span>
                    </div>
                    {bookingIdError ? (
                      <p className="text-[10px] text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />{bookingIdError}
                      </p>
                    ) : bookingId.length === BOOKING_ID_LENGTH ? (
                      <p className="text-[10px] text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />รูปแบบถูกต้อง
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        คัดลอกจากแอป Grab → รายละเอียดออเดอร์ → Booking ID (ขึ้นต้น A- ตามด้วย 14 ตัว)
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ── Shopee: Order Number + Order ID ── */}
              {isShopee && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">เลขออเดอร์สั้น <span className="text-red-500">*</span></Label>
                    <Input
                      value={shopeeOrderNumber}
                      onChange={(e) => setShopeeOrderNumber(e.target.value)}
                      placeholder="เช่น #212"
                      className="font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">ดูจากหน้ารายละเอียดคำสั่งซื้อ (เช่น #212, #305)</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">เลขคำสั่งซื้อ ({SHOPEE_ORDER_ID_MIN}-{SHOPEE_ORDER_ID_MAX} หลัก) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input
                        value={shopeeOrderId}
                        onChange={(e) => handleShopeeOrderIdChange(e.target.value)}
                        placeholder="เช่น 3011303289058816525"
                        inputMode="numeric"
                        className={`font-mono text-sm tracking-wider pr-16 ${
                          shopeeOrderIdError ? "border-red-400 focus-visible:ring-red-400" :
                          shopeeOrderId.length >= SHOPEE_ORDER_ID_MIN && !shopeeOrderIdError ? "border-green-400 focus-visible:ring-green-400" : ""
                        }`}
                      />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
                        shopeeOrderId.length >= SHOPEE_ORDER_ID_MIN && shopeeOrderId.length <= SHOPEE_ORDER_ID_MAX ? "text-green-500" :
                        shopeeOrderId.length > SHOPEE_ORDER_ID_MAX ? "text-red-500" : "text-muted-foreground"
                      }`}>
                        {shopeeOrderId.length} หลัก
                      </span>
                    </div>
                    {shopeeOrderIdError ? (
                      <p className="text-[10px] text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />{shopeeOrderIdError}
                      </p>
                    ) : shopeeOrderId.length >= SHOPEE_ORDER_ID_MIN ? (
                      <p className="text-[10px] text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />รูปแบบถูกต้อง
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        คัดลอกจาก Shopee Food → รายละเอียดคำสั่งซื้อ → เลขคำสั่งซื้อ (ตัวเลข {SHOPEE_ORDER_ID_MIN}-{SHOPEE_ORDER_ID_MAX} หลัก)
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ── LINE MAN: Order Number + Order ID ── */}
              {isLineman && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">เลขออเดอร์สั้น <span className="text-red-500">*</span></Label>
                    <Input
                      value={linemanOrderNumber}
                      onChange={(e) => setLinemanOrderNumber(e.target.value)}
                      placeholder="เช่น #5175"
                      className="font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">ดูจากหน้าข้อมูลออเดอร์ (เช่น #5175, #3201)</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">รหัสใบสั่งซื้อ <span className="text-red-500">*</span></Label>
                    <Input
                      value={linemanOrderId}
                      onChange={(e) => handleLinemanOrderIdChange(e.target.value)}
                      placeholder="เช่น LMF-260321-538845175"
                      className={`font-mono text-sm tracking-wider ${
                        linemanOrderIdError ? "border-red-400 focus-visible:ring-red-400" :
                        linemanOrderId && !linemanOrderIdError ? "border-green-400 focus-visible:ring-green-400" : ""
                      }`}
                    />
                    {linemanOrderIdError ? (
                      <p className="text-[10px] text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 shrink-0" />{linemanOrderIdError}
                      </p>
                    ) : linemanOrderId && LINEMAN_ORDER_ID_REGEX.test(linemanOrderId) ? (
                      <p className="text-[10px] text-green-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 shrink-0" />รูปแบบถูกต้อง
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground">
                        คัดลอกจาก LINE MAN → ข้อมูลออเดอร์ → รหัสใบสั่งซื้อ (LMF-YYMMDD-XXXXXXXXX)
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* ── GPOS: Receipt Number ── */}
              {isGpos && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">เลขที่ใบเสร็จ (13 หลัก) <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      value={gposReceipt}
                      onChange={(e) => handleGposReceiptChange(e.target.value)}
                      placeholder="เช่น 0105536123457"
                      inputMode="numeric"
                      maxLength={15}
                      className={`font-mono text-sm tracking-wider pr-16 ${
                        gposReceiptError ? "border-red-400 focus-visible:ring-red-400" :
                        gposReceipt.length === 13 && !gposReceiptError ? "border-green-400 focus-visible:ring-green-400" : ""
                      }`}
                    />
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${
                      gposReceipt.length === 13 ? "text-green-500" :
                      gposReceipt.length > 13 ? "text-red-500" : "text-muted-foreground"
                    }`}>
                      {gposReceipt.length}/13
                    </span>
                  </div>
                  {gposReceiptError ? (
                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />{gposReceiptError}
                    </p>
                  ) : gposReceipt.length === 13 ? (
                    <p className="text-[10px] text-green-500 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />รูปแบบถูกต้อง
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">
                      เลขที่ใบเสร็จ 13 หลักจากระบบ GPOS
                    </p>
                  )}
                </div>
              )}

              {/* Image */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">รูปภาพรีวิว <span className="text-red-500">*</span></Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageBase64(null); }}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Camera className="h-8 w-8" />
                    <span className="text-sm">แตะเพื่อเลือกรูป</span>
                  </button>
                )}
              </div>

              {/* Submit Button - disabled until form is valid */}
              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={!isFormValid || submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังส่ง...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />ส่งรีวิว</>
                )}
              </Button>

              {/* Hint when button is disabled */}
              {!isFormValid && deliveryApp && (
                <p className="text-[11px] text-center text-muted-foreground">
                  กรุณากรอกข้อมูลให้ครบถูกต้องก่อนกดส่ง
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </PremiumPageContent>
    </MobileLayout>
  );
}
