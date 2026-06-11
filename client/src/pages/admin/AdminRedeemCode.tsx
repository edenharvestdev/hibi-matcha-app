import AdminPageWrapper from "@/components/AdminPageWrapper";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import QRScanner from "@/components/QRScanner";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { QrCode, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, Camera, UtensilsCrossed, FileText, Pencil, ShieldAlert, History } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDate, formatDateTime } from "@/lib/dateUtils";
import DateRangePickerModal from "@/components/common/DateRangePickerModal";

export default function AdminRedeemCode() {
  const { session, loading, isAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [code, setCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
  }, [loading, session, isAdmin, setLocation]);

  const lookupQuery = trpc.codes.lookup.useQuery(
    { code: searchCode },
    { enabled: searchCode.length >= 6, retry: false }
  );

  const redeemMutation = trpc.codes.redeem.useMutation({
    onSuccess: () => {
      toast.success("ใช้โค้ดสำเร็จ!");
      setSearchCode(code.trim().toUpperCase()); // re-trigger lookup
    },
    onError: (err) => toast.error(err.message),
  });

  const redeemPTMutation = trpc.loyalty.useRedemption.useMutation({
    onSuccess: () => {
      toast.success("ใช้โค้ดรางวัลสำเร็จ!");
      setSearchCode(code.trim().toUpperCase());
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading || !session) return null;

  const handleLookup = () => {
    if (!code.trim()) return toast.error("กรุณากรอกโค้ด");
    setSearchCode(code.trim().toUpperCase());
  };

  const handleReset = () => {
    setCode("");
    setSearchCode("");
  };

  const handleQRScan = (scannedCode: string) => {
    setShowScanner(false);
    const trimmed = scannedCode.trim().toUpperCase();
    setCode(trimmed);
    setSearchCode(trimmed);
    toast.success("สแกน QR Code สำเร็จ!");
  };

  const codeData = lookupQuery.data as any;
  const isExpired = codeData && codeData.expiresAt && new Date() > new Date(codeData.expiresAt);
  const canRedeem = codeData && (codeData.status === "issued" || codeData.status === "pending") && !isExpired;
  const isPTCode = codeData?.codeSource === "redemption";

  return (
    <AdminPageWrapper title="ใช้โค้ด" backPath="/admin" loading={false}>
      <div className="space-y-4">
        {/* Search */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">ตรวจสอบโค้ด</h3>
            </div>

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

            <div className="flex gap-2">
              <Input
                placeholder="HIBI-RV-XXXXXX"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); }}
                className="font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              />
              <Button onClick={handleLookup} disabled={lookupQuery.isLoading}>
                {lookupQuery.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ค้นหา"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {searchCode && !lookupQuery.isLoading && (
          <>
            {!codeData ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                  <p className="font-medium text-red-600">ไม่พบโค้ดนี้</p>
                  <p className="text-sm text-muted-foreground mt-1">กรุณาตรวจสอบโค้ดอีกครั้ง</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold font-mono text-primary">{codeData.code}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${
                      (codeData.status === "issued" || codeData.status === "pending") && !isExpired ? "bg-blue-100 text-blue-700" :
                      codeData.status === "redeemed" ? "bg-green-100 text-green-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {(codeData.status === "issued" || codeData.status === "pending") && !isExpired ? <Clock className="h-3 w-3" /> :
                       codeData.status === "redeemed" ? <CheckCircle2 className="h-3 w-3" /> :
                       <AlertTriangle className="h-3 w-3" />}
                      {(codeData.status === "issued" || codeData.status === "pending") && !isExpired ? "พร้อมใช้" :
                       codeData.status === "redeemed" ? "ใช้แล้ว" :
                       isExpired ? "หมดอายุ" : "ยกเลิก"}
                    </span>
                  </div>

                  {/* ═══ เมนูข้อมูล — เห็นเฉพาะพนักงาน/admin ตอนสแกน ═══ */}

                  {/* Menu Info - Claim/Compensation */}
                  {codeData.type === "CL" && (codeData.claimMenuCode || codeData.claimMenuName || codeData.compensationMenuCode || codeData.compensationMenuName) && (
                    <div className="bg-amber-50 rounded-lg p-3 space-y-2 border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800">
                        <UtensilsCrossed className="h-4 w-4" />
                        <p className="font-semibold text-sm">ข้อมูลเมนู (เฉพาะพนักงาน)</p>
                      </div>
                      {(codeData.claimMenuCode || codeData.claimMenuName) && (
                        <div className="text-sm">
                          <p className="text-amber-700 text-xs font-medium">เมนูที่ผิดพลาด</p>
                          <p className="font-bold text-amber-900">
                            {codeData.claimMenuCode && <span className="font-mono bg-amber-100 px-1 rounded mr-1">{codeData.claimMenuCode}</span>}
                            {codeData.claimMenuName || "-"}
                          </p>
                        </div>
                      )}
                      {(codeData.compensationMenuCode || codeData.compensationMenuName) && (
                        <div className="text-sm">
                          <p className="text-green-700 text-xs font-medium">เมนูชดเชย (ต้องทำ)</p>
                          <p className="font-bold text-green-800">
                            {codeData.compensationMenuCode && <span className="font-mono bg-green-100 px-1 rounded mr-1">{codeData.compensationMenuCode}</span>}
                            {codeData.compensationMenuName || "-"}
                          </p>
                        </div>
                      )}
                      {codeData.compensationRemark && (
                        <div className="text-sm">
                          <p className="text-amber-700 text-xs font-medium">หมายเหตุ</p>
                          <p className="text-amber-900 font-medium">{codeData.compensationRemark}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review menu info */}
                  {codeData.type === "RV" && (codeData.compensationMenuCode || codeData.compensationMenuName) && (
                    <div className="bg-green-50 rounded-lg p-3 space-y-2 border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <UtensilsCrossed className="h-4 w-4" />
                        <p className="font-semibold text-sm">เมนูที่ได้รับ (เฉพาะพนักงาน)</p>
                      </div>
                      <p className="font-bold text-green-800 text-sm">
                        {codeData.compensationMenuCode && <span className="font-mono bg-green-100 px-1 rounded mr-1">{codeData.compensationMenuCode}</span>}
                        {codeData.compensationMenuName || "-"}
                      </p>
                    </div>
                  )}

                  {/* Order info */}
                  {(codeData.claimOrderId || codeData.orderDate) && (
                    <div className="bg-blue-50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2 text-blue-800">
                        <FileText className="h-4 w-4" />
                        <p className="font-semibold text-sm">ข้อมูลออเดอร์</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {codeData.claimOrderId && (
                          <div>
                            <p className="text-blue-600 text-xs">เลขออเดอร์</p>
                            <p className="font-mono font-bold text-blue-900">{codeData.claimOrderId}</p>
                          </div>
                        )}
                        {codeData.orderDate && (
                          <div>
                            <p className="text-blue-600 text-xs">วันที่สั่ง</p>
                            <p className="font-medium text-blue-900">{formatDate(codeData.orderDate)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">ประเภท</p>
                      <p className="font-medium">{isPTCode ? "Point Redemption" : codeData.type === "RV" ? "Review Reward" : "Claim Compensation"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">อีเมล</p>
                      <p className="font-medium text-xs break-all">{codeData.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">สาขา</p>
                      <p className="font-medium">{codeData.branchName || `#${codeData.branchId}`}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">วันหมดอายุ</p>
                      <p className="font-medium">{codeData.expiresAt ? formatDate(codeData.expiresAt) : "-"}</p>
                    </div>
                  </div>

                  {/* ═══ เมนูที่ลูกค้าเลือก (จาก SelectMenuCode) ═══ */}
                  {codeData.selectedMenuName && (
                    <div className="border-2 border-emerald-200 bg-emerald-50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <UtensilsCrossed className="h-4 w-4" />
                        <p className="font-semibold text-sm">เมนูที่ลูกค้าเลือก</p>
                      </div>
                      <p className="font-bold text-emerald-900">
                        {codeData.selectedMenuCode && <span className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded mr-1.5 text-sm">{codeData.selectedMenuCode}</span>}
                        {codeData.selectedMenuName}
                      </p>
                      {codeData.remark && (
                        <div className="bg-white/60 rounded-lg p-2.5 border border-emerald-100">
                          <p className="text-emerald-700 text-xs font-medium mb-0.5">Remark จากลูกค้า:</p>
                          <p className="text-sm text-emerald-900 font-medium">{codeData.remark}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ═══ Redeem Button — ต้องกดเพื่อป้องกันโค้ดค้าง ═══ */}
                  {canRedeem && (
                    <div className="border-2 border-red-200 bg-red-50/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-red-600" />
                        <p className="font-semibold text-sm text-red-800">ต้องกดยืนยันเพื่อป้องกันโค้ดค้าง</p>
                      </div>
                      <p className="text-xs text-red-700">
                        ตรวจสอบเมนูด้านบนแล้วกดปุ่มด้านล่างเพื่อ mark โค้ดเป็นใช้แล้ว
                      </p>
                      <Button
                        className="w-full h-12 bg-red-600 hover:bg-red-700"
                        onClick={() => isPTCode ? redeemPTMutation.mutate({ code: codeData.code }) : redeemMutation.mutate({ code: codeData.code })}
                        disabled={redeemMutation.isPending}
                      >
                        {redeemMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        ยืนยันใช้โค้ด
                      </Button>
                    </div>
                  )}

                  {codeData.status === "redeemed" && (
                    <div className="bg-green-50 rounded-lg p-3 text-sm text-green-700">
                      <p className="font-medium">โค้ดนี้ถูกใช้แล้ว</p>
                      {codeData.redeemedAt && (
                        <p className="text-xs mt-1">เมื่อ {formatDateTime(codeData.redeemedAt)}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              {codeData && (
                <Button variant="outline" className="flex-1" onClick={() => setLocation(`/admin/edit-code/${codeData.id}`)}>
                  <Pencil className="h-4 w-4 mr-1" /> แก้ไขโค้ด
                </Button>
              )}
              <Button variant="outline" className="flex-1" onClick={handleReset}>
                ค้นหาโค้ดใหม่
              </Button>
            </div>
          </>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ประวัติการใช้โค้ดล่าสุด */}
      <RedeemHistory />
    </AdminPageWrapper>
  );
}

function RedeemHistory() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const queryInput = useMemo(() => ({
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }), [dateFrom, dateTo]);
  const { data: allCodes, isLoading } = trpc.codes.branchCodes.useQuery(queryInput);
  const redeemedCodes = useMemo(() => (allCodes || []).filter((c: any) => c.status === "redeemed").slice(0, 30), [allCodes]);
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[#3D7A3A]" />
          <h3 className="text-sm font-semibold">ประวัติการใช้โค้ดล่าสุด</h3>
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
      ) : !redeemedCodes.length ? (
        <div className="text-center py-6 text-muted-foreground text-sm">ยังไม่มีประวัติ</div>
      ) : (
        <div className="space-y-2">
          {redeemedCodes.map((code: any) => (
            <Card key={code.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono font-medium">{code.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {code.type === "RV" ? "Review Reward" : "Claim"} • {code.branchName || `#${code.branchId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ใช้เมื่อ {code.redeemedAt ? new Date(code.redeemedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) + " " + new Date(code.redeemedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </p>
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
                    ใช้แล้ว
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
