import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import HowToPopup from "@/components/HowToPopup";
import HowToUsePopup from "@/components/HowToUsePopup";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QrCode, Gift, Clock, CheckCircle2, XCircle, Maximize2, Star, AlertTriangle, Tag, Coffee, ArrowRight, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/dateUtils";

const SWEETNESS_MAP: Record<number, string> = { 0: "ไม่หวาน", 15: "หวานน้อย", 30: "หวานปกติ", 45: "หวานมาก" };
const PACKAGING_MAP: Record<string, string> = { ready: "พร้อมดื่ม", separate: "แยกน้ำแข็ง" };

const codeStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  issued: { label: "พร้อมใช้งาน", color: "bg-green-100 text-green-700 border-green-200", icon: Gift },
  redeemed: { label: "ใช้แล้ว", color: "bg-gray-100 text-gray-500 border-gray-200", icon: CheckCircle2 },
  expired: { label: "หมดอายุ", color: "bg-amber-100 text-amber-600 border-amber-200", icon: Clock },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-600 border-red-200", icon: XCircle },
};

const codeTypeConfig: Record<string, { label: string; color: string; icon: any }> = {
  RV: { label: "รีวิว", color: "bg-purple-50 text-purple-700", icon: Star },
  CL: { label: "ชดเชย", color: "bg-orange-50 text-orange-700", icon: AlertTriangle },
  FR: { label: "ให้ฟรี", color: "bg-blue-50 text-blue-700", icon: Gift },
  PR: { label: "โปรโมชัน", color: "bg-pink-50 text-pink-700", icon: Tag },
};

export default function MyCodes() {
  const { session, loading } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success("คัดลอกโค้ดแล้ว!");
      setTimeout(() => setCopiedCode(null), 2000);
    }).catch(() => toast.error("ไม่สามารถคัดลอกได้"));
  };

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
  }, [loading, session, setLocation]);

  const { data: codes, isLoading } = trpc.reviews.myCodes.useQuery(undefined, { enabled: !!session });

  if (loading || !session) return null;

  // Check for expired codes
  const processedCodes = codes?.map((c: any) => {
    if (c.status === "issued" && new Date(c.expiresAt) < new Date()) {
      return { ...c, status: "expired" as const };
    }
    return c;
  });

  // Check if activated code has expired (activated today only)
  const isActivatedToday = (activatedAt: string | Date | null) => {
    if (!activatedAt) return false;
    const activated = new Date(activatedAt);
    const now = new Date();
    return activated.toDateString() === now.toDateString();
  };

  return (
    <MobileLayout title="โค้ดของฉัน" showBack backPath="/customer">
      <PremiumPageContent>
      <div className="px-4 py-6 space-y-3">
        {/* Popup วิธีใช้โค้ด - auto popup ครั้งแรก */}
        <HowToUsePopup context="codes" />
        <HowToPopup
          contentKey="redeem_howto_image"
          storageKey="hibi_redeem_howto_seen"
          dismissLabel="เข้าใจแล้ว"
          linkLabel="วิธีใช้โค้ด (รูปแนะนำ)"
        />
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
        ) : !processedCodes?.length ? (
          <div className="text-center py-12">
            <QrCode className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ยังไม่มีโค้ด</p>
            <button onClick={() => setLocation("/customer/submit-review")} className="text-primary text-sm font-medium mt-2 hover:underline">
              ส่งรีวิวเพื่อรับโค้ด →
            </button>
          </div>
        ) : (
          processedCodes.map((code: any) => {
            const config = codeStatusConfig[code.status] || codeStatusConfig.issued;
            const StatusIcon = config.icon;
            const typeConf = codeTypeConfig[code.type] || codeTypeConfig.RV;
            const TypeIcon = typeConf.icon;
            const isActive = code.status === "issued";
            const hasSelectedMenu = !!code.selectedMenuItemId;
            const isActivatedAndValid = hasSelectedMenu && isActivatedToday(code.activatedAt);
            const isActivatedButExpired = hasSelectedMenu && code.activatedAt && !isActivatedToday(code.activatedAt);
            // CL code with compensation menu = auto-fill flow (skip menu selection)
            const isCLAutoFill = code.type === "CL" && !!code.compensationMenuCode && !!code.compensationMenuName;

            return (
              <Card key={code.id} className={`border shadow-sm ${isActive ? "border-primary/20" : "opacity-70"}`}>
                <CardContent className="p-4">
                  {/* Header: status + type */}
                  <div className="flex items-start justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border ${config.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {isActivatedButExpired ? "เลือกเมนูแล้ว (หมดเวลาวันนี้)" : config.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded ${typeConf.color}`}>
                      <TypeIcon className="h-3 w-3" />
                      {typeConf.label}
                    </span>
                  </div>

                  {/* ข้อมูลช่องทาง (CL codes) */}
                  {code.type === "CL" && (code.claimError || code.claimChannel) && (
                    <div className="mb-3 bg-muted/50 rounded-lg p-2.5 space-y-1">
                      {code.claimError && (
                        <p className="text-xs text-muted-foreground">
                          เหตุผล: {code.claimError}
                        </p>
                      )}
                      {code.claimChannel && (
                        <p className="text-xs text-muted-foreground">
                          ช่องทาง: {code.claimChannel === "walk_in" ? "หน้าร้าน" : code.claimChannel.toUpperCase()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* === FLOW: Active code that has been activated (menu selected + today) → Show QR === */}
                  {isActive && isActivatedAndValid && (
                    <div className="flex flex-col items-center">
                      <div className="bg-emerald-50 rounded-lg p-2 mb-2 w-full text-center">
                        <p className="text-xs font-medium text-emerald-700 flex items-center justify-center gap-1">
                          <Coffee className="h-3 w-3" />
                          {code.selectedMenuName}
                          {code.sweetnessGrams !== null && ` • ${SWEETNESS_MAP[code.sweetnessGrams] || code.sweetnessGrams + "g"}`}
                          {code.packagingType && ` • ${PACKAGING_MAP[code.packagingType] || code.packagingType}`}
                        </p>
                      </div>
                      <button onClick={() => setShowQRModal(code.code)} className="relative group">
                        <QRCodeDisplay code={code.code} size={140} showActions={false} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-2xl transition-colors flex items-center justify-center">
                          <Maximize2 className="h-5 w-5 text-primary opacity-0 group-hover:opacity-60 transition-opacity" />
                        </div>
                      </button>
                      <button onClick={() => setShowQRModal(code.code)} className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline px-3 py-1.5 rounded-full bg-primary/5 mt-2">
                        <Maximize2 className="h-3 w-3" />
                        ขยาย QR
                      </button>
                      <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        แสดง QR Code นี้ให้พนักงานสแกนเพื่อยืนยันการใช้โค้ด
                      </p>
                      {/* Copy Code Button */}
                      <Button
                        variant="outline"
                        className="w-full gap-2 mt-2"
                        onClick={() => handleCopyCode(code.code)}
                      >
                        {copiedCode === code.code ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        {copiedCode === code.code ? "คัดลอกแล้ว!" : "คัดลอกโค้ด เพื่อวางในแอปเดลิเวอรี่"}
                      </Button>
                      <div className="mt-2 bg-amber-50 rounded-lg p-2 w-full border border-amber-100">
                        <p className="text-[10px] text-amber-700 text-center font-medium">
                          ต้องใช้ภายในวันนี้! หากไม่ใช้ สามารถเลือกเมนูใหม่ได้ในวันถัดไป
                        </p>
                      </div>
                    </div>
                  )}

                  {/* === FLOW: Active code, menu selected but expired (not today) → Can re-select === */}
                  {isActive && isActivatedButExpired && (
                    <div className="flex flex-col items-center">
                      <div className="bg-amber-50 rounded-lg p-3 w-full text-center mb-3 border border-amber-200">
                        <p className="text-xs text-amber-700">
                          {isCLAutoFill ? "ยืนยันโค้ดชดเชยไว้แต่ไม่ได้ใช้ภายในวัน" : (<>เลือกเมนู <strong>{code.selectedMenuName}</strong> ไว้แต่ไม่ได้ใช้ภายในวัน</>)}
                        </p>
                        <p className="text-[10px] text-amber-600 mt-1">{isCLAutoFill ? "สามารถยืนยันใหม่ได้" : "สามารถเลือกเมนูใหม่ได้"}</p>
                      </div>
                      <Button
                        className={`w-full ${isCLAutoFill ? "bg-orange-600 hover:bg-orange-700" : "bg-primary hover:bg-primary/90"}`}
                        onClick={() => setLocation(`/customer/select-menu-code?codeId=${code.id}`)}
                      >
                        <Coffee className="h-4 w-4 mr-1" />
                        {isCLAutoFill ? "ยืนยันโค้ดชดเชยใหม่" : "เลือกเมนูใหม่"}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}

                  {/* === FLOW: Active code, no menu selected yet === */}
                  {isActive && !hasSelectedMenu && (
                    <div className="flex flex-col items-center">
                      {isCLAutoFill ? (
                        /* CL code: แสดงเมนูชดเชยอัตโนมัติ + ปุ่มยืนยัน */
                        <>
                          <div className="rounded-xl p-4 text-center bg-orange-50 border border-orange-200 w-full mb-3">
                            <Coffee className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-orange-800">
                              เมนูชดเชย: {code.compensationMenuName}
                            </p>
                            <p className="text-[10px] text-orange-600 mt-1">
                              ระบบจะทำแก้วที่พลาดส่งคืนให้ กดยืนยันเพื่อรับ QR Code
                            </p>
                          </div>
                          <Button
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            size="lg"
                            onClick={() => setLocation(`/customer/select-menu-code?codeId=${code.id}`)}
                          >
                            <Coffee className="h-4 w-4 mr-1" />
                            ยืนยันใช้โค้ดชดเชย
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </>
                      ) : (
                        /* Non-CL code: ต้องเลือกเมนูก่อน */
                        <>
                          <div className="rounded-xl p-4 text-center bg-amber-50 border border-amber-200 w-full mb-3">
                            <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-amber-800">
                              กรุณาเลือกเมนูก่อนใช้โค้ด
                            </p>
                            <p className="text-[11px] text-amber-600 mt-1">
                              ต้องกดเลือกเมนูในระบบก่อน จึงจะเห็นรหัสโค้ดและ QR Code
                            </p>
                          </div>
                          <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            size="lg"
                            onClick={() => setLocation(`/customer/select-menu-code?codeId=${code.id}`)}
                          >
                            <Coffee className="h-4 w-4 mr-1" />
                            เลือกเมนูเพื่อใช้โค้ด
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}

                  {/* === FLOW: Inactive code (redeemed/expired/cancelled) → Show code with strikethrough === */}
                  {!isActive && (
                    <div className="rounded-xl p-4 text-center bg-muted/50">
                      <p className="font-mono text-xl font-bold tracking-wider text-muted-foreground line-through">
                        {code.code}
                      </p>
                      {code.selectedMenuName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          เมนู: {code.selectedMenuName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Dates */}
                  <div className="mt-3 flex justify-between text-[11px] text-muted-foreground">
                    <span>ออกเมื่อ: {formatDate(code.issuedAt, { shortYear: true })}</span>
                    <span className={!isActive && code.status === "expired" ? "text-amber-600 font-medium" : ""}>
                      หมดอายุ: {formatDate(code.expiresAt)}
                    </span>
                  </div>

                  {/* Usage hint for active codes without menu */}
                  {isActive && !hasSelectedMenu && (
                    <div className={`mt-3 rounded-lg p-2.5 border ${isCLAutoFill ? "bg-orange-50 border-orange-100" : "bg-amber-50 border-amber-100"}`}>
                      <p className={`text-[11px] ${isCLAutoFill ? "text-orange-700" : "text-amber-700"}`}>
                        {isCLAutoFill
                          ? "กดปุ่ม \"ยืนยันใช้โค้ดชดเชย\" → ระบบจะแสดง QR Code ให้พนักงานสแกน (ไม่ต้องเลือกเมนู)"
                          : "กดปุ่ม \"เลือกเมนูเพื่อใช้โค้ด\" → เลือกเมนูเสร็จ → ระบบจะแสดงรหัสโค้ดและ QR Code ให้พนักงานสแกน"
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* QR Code Full Screen Modal */}
      <Dialog open={!!showQRModal} onOpenChange={() => setShowQRModal(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-sm rounded-2xl p-6">
          <div className="text-center">
            <h3 className="font-bold text-lg text-primary mb-1">Hibi Matcha</h3>
            <p className="text-xs text-muted-foreground mb-4">แสดง QR Code นี้ให้พนักงานสแกน</p>
            {showQRModal && (
              <QRCodeDisplay code={showQRModal} size={220} showActions={false} />
            )}
            <p className="text-[11px] text-muted-foreground mt-4">
              พนักงานจะสแกน QR Code เพื่อดูเมนูที่คุณเลือกและยืนยันการใช้โค้ด
            </p>
          </div>
        </DialogContent>
      </Dialog>
          </PremiumPageContent>
    </MobileLayout>
  );
}
