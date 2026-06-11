import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import QRScanner from "@/components/QRScanner";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Search, CheckCircle2, XCircle, Clock, AlertTriangle, Loader2, Camera, UtensilsCrossed, FileText, Pencil, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/useMobile";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  issued: { label: "ใช้งานได้", color: "text-green-700", bgColor: "bg-green-100", icon: CheckCircle2 },
  redeemed: { label: "ใช้แล้ว", color: "text-gray-700", bgColor: "bg-gray-100", icon: XCircle },
  expired: { label: "หมดอายุ", color: "text-red-700", bgColor: "bg-red-100", icon: Clock },
  cancelled: { label: "ยกเลิก", color: "text-red-700", bgColor: "bg-red-100", icon: AlertTriangle },
};

export default function RedeemCode() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [codeInput, setCodeInput] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  const { data: codeData, isLoading: isSearching, refetch } = trpc.codes.lookup.useQuery(
    { code: searchCode },
    { enabled: !!searchCode && !!session }
  );

  const redeemMutation = trpc.codes.redeem.useMutation({
    onSuccess: () => {
      setRedeemSuccess(true);
      toast.success("ใช้โค้ดสำเร็จ!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // PT code redeem via loyalty.useRedemption
  const redeemPTMutation = trpc.loyalty.useRedemption.useMutation({
    onSuccess: () => {
      setRedeemSuccess(true);
      toast.success("ใช้โค้ดรางวัลสำเร็จ!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSearch = () => {
    if (!codeInput.trim()) { toast.error("กรุณากรอกโค้ด"); return; }
    setRedeemSuccess(false);
    setSearchCode(codeInput.trim().toUpperCase());
  };

  const handleRedeem = () => {
    if (!searchCode) return;
    // PT codes use loyalty.useRedemption, RV/CL use codes.redeem
    if (cd && (cd as any).codeSource === "redemption") {
      redeemPTMutation.mutate({ code: searchCode });
    } else {
      redeemMutation.mutate({ code: searchCode });
    }
  };

  const resetForm = () => {
    setCodeInput("");
    setSearchCode("");
    setRedeemSuccess(false);
  };

  const handleQRScan = (scannedCode: string) => {
    setShowScanner(false);
    const code = scannedCode.trim().toUpperCase();
    setCodeInput(code);
    setRedeemSuccess(false);
    setSearchCode(code);
    toast.success("สแกน QR Code สำเร็จ!");
  };

  if (loading || !session) return null;

  // Cast to any to handle union type (codes vs redemption) - fields are checked with optional chaining in template
  const cd = codeData as any;
  const isExpired = cd && cd.expiresAt && new Date() > new Date(cd.expiresAt);
  const canRedeem = cd && (cd.status === "issued" || cd.status === "pending") && !isExpired;
  const isPTCode = cd?.codeSource === "redemption";

  return (
    <MobileLayout title="ใช้โค้ด (Redeem)" showBack backPath="/branch">
      <PremiumPageContent>
        {/* Search Input */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">ตรวจสอบและใช้โค้ด</p>
                <p className="text-xs text-muted-foreground">สแกน QR Code หรือกรอกโค้ด</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* QR Scanner Button */}
              <Button
                variant="outline"
                className="w-full h-14 border-dashed border-2 border-green-300 bg-green-50/50 hover:bg-green-50 text-green-700"
                onClick={() => setShowScanner(true)}
              >
                <Camera className="h-5 w-5 mr-2" />
                <span className="font-medium">สแกน QR Code ด้วยกล้อง</span>
              </Button>

              <div className="relative flex items-center">
                <div className="flex-1 border-t border-gray-200" />
                <span className="px-3 text-xs text-muted-foreground">หรือ</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">กรอกรหัสโค้ด</Label>
                <Input
                  placeholder="HIBI-RV-XXXXXX หรือ HIBI-CL-XXXXXX"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  className="font-mono text-center text-lg tracking-wider"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button className="w-full" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                ค้นหาโค้ด
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Code Result */}
        {searchCode && !isSearching && (
          <>
            {!cd ? (
              <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
                <CardContent className="p-4 text-center">
                  <XCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                  <p className="font-medium text-red-700">ไม่พบโค้ดนี้ในระบบ</p>
                  <p className="text-xs text-muted-foreground mt-1">กรุณาตรวจสอบโค้ดอีกครั้ง</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Code Details */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-mono font-bold text-lg text-primary">{cd.code}</p>
                      {(() => {
                        const status = isExpired && cd.status === "issued" ? "expired" : cd.status;
                        const config = statusConfig[status] || statusConfig.issued;
                        const StatusIcon = config.icon;
                        return (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </span>
                        );
                      })()}
                    </div>

                    {/* ═══ PT Reward Info ═══ */}
                    {isPTCode && cd.rewardName && (
                      <div className="bg-purple-50 rounded-xl p-4 space-y-2 border-2 border-purple-300 shadow-sm">
                        <div className="flex items-center gap-2 text-purple-800">
                          <UtensilsCrossed className="h-5 w-5" />
                          <p className="font-bold text-base">รางวัลแลกคะแนน</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-purple-200">
                          <p className="font-bold text-purple-900 text-lg">{cd.rewardName}</p>
                          <p className="text-sm text-purple-600 mt-1">ใช้ {cd.pointsSpent} คะแนน</p>
                        </div>
                      </div>
                    )}
                    {/* ═══ เมนูที่ลูกค้าเลือก — แสดงเด่นชัดที่สุด ═══ */}
                    {cd.selectedMenuName && (
                      <div className="bg-emerald-50 rounded-xl p-4 space-y-2 border-2 border-emerald-300 shadow-sm">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <UtensilsCrossed className="h-5 w-5" />
                          <p className="font-bold text-base">เมนูที่ลูกค้าเลือก</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 border border-emerald-200">
                          <p className="font-bold text-emerald-900 text-lg">
                            {cd.selectedMenuCode && <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded mr-2 text-sm">{cd.selectedMenuCode}</span>}
                            {cd.selectedMenuName}
                          </p>
                        </div>
                        {cd.remark && (
                          <div className="bg-white/80 rounded-lg p-3 border border-emerald-100">
                            <p className="text-emerald-700 text-xs font-medium mb-1">Remark จากลูกค้า:</p>
                            <p className="text-sm text-emerald-900 font-semibold">{cd.remark}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ═══ เมนูข้อมูล — เห็นเฉพาะพนักงานตอนสแกน ═══ */}

                    {/* Menu Info - Claim/Compensation */}
                    {cd.type === "CL" && (cd.claimMenuCode || cd.claimMenuName || cd.compensationMenuCode || cd.compensationMenuName) && (
                      <div className="bg-amber-50 rounded-lg p-3 space-y-2 border border-amber-200">
                        <div className="flex items-center gap-2 text-amber-800">
                          <UtensilsCrossed className="h-4 w-4" />
                          <p className="font-semibold text-sm">ข้อมูลเมนู (เฉพาะพนักงาน)</p>
                        </div>
                        {(cd.claimMenuCode || cd.claimMenuName) && (
                          <div className="text-sm">
                            <p className="text-amber-700 text-xs font-medium">เมนูที่ผิดพลาด</p>
                            <p className="font-bold text-amber-900">
                              {cd.claimMenuCode && <span className="font-mono bg-amber-100 px-1 rounded mr-1">{cd.claimMenuCode}</span>}
                              {cd.claimMenuName || "-"}
                            </p>
                          </div>
                        )}
                        {(cd.compensationMenuCode || cd.compensationMenuName) && (
                          <div className="text-sm">
                            <p className="text-green-700 text-xs font-medium">เมนูชดเชย (ต้องทำ)</p>
                            <p className="font-bold text-green-800">
                              {cd.compensationMenuCode && <span className="font-mono bg-green-100 px-1 rounded mr-1">{cd.compensationMenuCode}</span>}
                              {cd.compensationMenuName || "-"}
                            </p>
                          </div>
                        )}
                        {cd.compensationRemark && (
                          <div className="text-sm">
                            <p className="text-amber-700 text-xs font-medium">หมายเหตุ</p>
                            <p className="text-amber-900 font-medium">{cd.compensationRemark}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Review menu info */}
                    {cd.type === "RV" && (cd.compensationMenuCode || cd.compensationMenuName) && (
                      <div className="bg-green-50 rounded-lg p-3 space-y-2 border border-green-200">
                        <div className="flex items-center gap-2 text-green-800">
                          <UtensilsCrossed className="h-4 w-4" />
                          <p className="font-semibold text-sm">เมนูที่ได้รับ (เฉพาะพนักงาน)</p>
                        </div>
                        <p className="font-bold text-green-800 text-sm">
                          {cd.compensationMenuCode && <span className="font-mono bg-green-100 px-1 rounded mr-1">{cd.compensationMenuCode}</span>}
                          {cd.compensationMenuName || "-"}
                        </p>
                      </div>
                    )}

                    {/* Order info */}
                    {(cd.claimOrderId || cd.orderDate) && (
                      <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                        <div className="flex items-center gap-2 text-blue-800">
                          <FileText className="h-4 w-4" />
                          <p className="font-semibold text-sm">ข้อมูลออเดอร์</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {cd.claimOrderId && (
                            <div>
                              <p className="text-blue-600 text-xs">เลขออเดอร์</p>
                              <p className="font-mono font-bold text-blue-900">{cd.claimOrderId}</p>
                            </div>
                          )}
                          {cd.orderDate && (
                            <div>
                              <p className="text-blue-600 text-xs">วันที่สั่ง</p>
                              <p className="font-medium text-blue-900">{formatDate(cd.orderDate)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground text-xs">ประเภท</p>
                        <p className="font-medium">{cd.type === "RV" ? "Review Reward" : cd.type === "CL" ? "Claim Compensation" : "Point Redemption"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">สาขา</p>
                        <p className="font-medium">{cd.branchName || `#${cd.branchId}`}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">ออกเมื่อ</p>
                        <p className="font-medium">{formatDate(cd.issuedAt)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">หมดอายุ</p>
                        <p className={`font-medium ${isExpired ? "text-red-600" : ""}`}>
                          {formatDate(cd.expiresAt)}
                        </p>
                      </div>
                      {cd.redeemedAt && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs">ใช้เมื่อ</p>
                          <p className="font-medium">{formatDateTime(cd.redeemedAt)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ═══ เมนูที่ลูกค้าเลือก (duplicate removed — moved inside card above) ═══ */}

                {/* ═══ Redeem Button — ต้องกดเพื่อป้องกันโค้ดค้าง ═══ */}
                {canRedeem && !redeemSuccess && (
                  <Card className="border-2 border-red-200 bg-red-50/50 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="h-5 w-5 text-red-600" />
                        <p className="font-semibold text-sm text-red-800">ต้องกดยืนยันเพื่อป้องกันโค้ดค้าง</p>
                      </div>
                      <p className="text-xs text-red-700 mb-3">
                        กรุณาตรวจสอบเมนูด้านบนแล้วกดปุ่ม "ยืนยันใช้โค้ด" เพื่อ mark โค้ดเป็นใช้แล้ว
                      </p>
                      <Button
                        className="w-full h-14 text-base bg-red-600 hover:bg-red-700"
                        onClick={handleRedeem}
                        disabled={redeemMutation.isPending}
                      >
                        {redeemMutation.isPending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                        ยืนยันใช้โค้ด
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Redeem Success */}
                {redeemSuccess && (
                  <Card className="border-0 shadow-sm bg-green-50">
                    <CardContent className="p-4">
                      <div className="text-center mb-3">
                        <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-2" />
                        <p className="font-bold text-green-700 text-lg">ใช้โค้ดสำเร็จ!</p>
                        <p className="text-xs text-green-600 mt-1">โค้ดถูกบันทึกเป็น "ใช้แล้ว"</p>
                      </div>

                      {/* สรุปเมนูที่ต้องทำ */}
                      {cd && (cd.selectedMenuName || cd.compensationMenuName) && (
                        <div className="bg-white rounded-xl p-4 mt-3 border border-green-200 shadow-sm">
                          <p className="text-xs text-green-700 font-semibold mb-2 flex items-center gap-1.5">
                            <UtensilsCrossed className="h-3.5 w-3.5" />
                            สรุปเมนูที่ต้องทำให้ลูกค้า
                          </p>
                          {cd.selectedMenuName && (
                            <div className="mb-2">
                              <p className="font-bold text-green-900 text-base">
                                {cd.selectedMenuCode && <span className="font-mono bg-green-100 px-1.5 py-0.5 rounded mr-1.5 text-xs">{cd.selectedMenuCode}</span>}
                                {cd.selectedMenuName}
                              </p>
                            </div>
                          )}
                          {!cd.selectedMenuName && cd.compensationMenuName && (
                            <div className="mb-2">
                              <p className="font-bold text-green-900 text-base">
                                {cd.compensationMenuCode && <span className="font-mono bg-green-100 px-1.5 py-0.5 rounded mr-1.5 text-xs">{cd.compensationMenuCode}</span>}
                                {cd.compensationMenuName}
                              </p>
                            </div>
                          )}
                          {cd.remark && (
                            <div className="bg-green-50 rounded-lg p-2.5 mt-2 border border-green-100">
                              <p className="text-[10px] text-green-600 font-medium mb-0.5">ตัวเลือก / Remark:</p>
                              <p className="text-sm text-green-900 font-semibold">{cd.remark}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  {cd && (
                    <Button variant="outline" className="flex-1" onClick={() => setLocation(`/branch/edit-code/${cd.id}`)}>
                      <Pencil className="h-4 w-4 mr-1" /> แก้ไขโค้ด
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1" onClick={resetForm}>
                    ค้นหาโค้ดใหม่
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </PremiumPageContent>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </MobileLayout>
  );
}
