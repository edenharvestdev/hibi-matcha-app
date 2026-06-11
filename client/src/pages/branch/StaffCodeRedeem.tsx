import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import QRScanner from "@/components/QRScanner";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, CheckCircle, AlertTriangle, Loader2, Coffee, Store, Truck, User, Phone, Clock, XCircle, Camera, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/useMobile";

// SWEETNESS_LABELS removed — now using remark field

const DELIVERY_APPS = [
  { value: "shopee", label: "Shopee Food" },
  { value: "grab", label: "Grab Food" },
  { value: "lineman", label: "LINE MAN" },
  { value: "gpos", label: "GPOS (หน้าร้าน)" },
];

export default function StaffCodeRedeem() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [codeInput, setCodeInput] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [orderType, setOrderType] = useState<"in_store" | "delivery">("in_store");
  const [deliveryApp, setDeliveryApp] = useState("");
  const [deliveryOrderId, setDeliveryOrderId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/login");
  }, [loading, session, isStaff, setLocation]);

  const lookupQuery = trpc.staffCodeRedeem.lookup.useQuery(
    { code: lookupCode },
    { enabled: !!lookupCode, retry: false }
  );

  const redeemMutation = trpc.staffCodeRedeem.redeem.useMutation({
    onSuccess: (data) => {
      setResultData(data);
      setShowConfirm(false);
      setShowResult(true);
      toast.success("Mark โค้ดใช้แล้วสำเร็จ!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSearch = () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) { toast.error("กรุณากรอกโค้ด"); return; }
    setLookupCode(code);
  };

  const handleQRScan = (scannedCode: string) => {
    setShowScanner(false);
    const code = scannedCode.trim().toUpperCase();
    setCodeInput(code);
    setLookupCode(code);
    toast.success("สแกน QR Code สำเร็จ!");
  };

  const handleRedeem = () => {
    if (!lookupQuery.data) return;
    const branchId = session?.branchId || 0;
    redeemMutation.mutate({
      code: lookupQuery.data.code,
      branchId,
      orderType,
      deliveryApp: orderType === "delivery" ? deliveryApp : undefined,
      deliveryOrderId: orderType === "delivery" ? deliveryOrderId.trim() : undefined,
    });
  };

  const resetAll = () => {
    setCodeInput("");
    setLookupCode("");
    setOrderType("in_store");
    setDeliveryApp("");
    setDeliveryOrderId("");
    setShowResult(false);
    setResultData(null);
  };

  if (loading || !session) return null;

  const codeData = lookupQuery.data;
  const isCodeUsable = codeData && codeData.status === "issued" && !codeData.isExpired && !codeData.isRedeemed;

  return (
    <MobileLayout title="Mark โค้ดใช้แล้ว" showBack backPath="/branch">
      <PremiumPageContent>
      <div className="px-4 py-4 space-y-5">
        {/* Search with QR Scanner */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">ค้นหาโค้ดแก้วแถม</p>
                <p className="text-xs text-muted-foreground">สแกน QR Code หรือกรอกโค้ดที่ลูกค้าแจ้ง</p>
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
                  placeholder="กรอกโค้ด เช่น RV-ML-M-FM-A1B2"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  className="font-mono text-center text-lg tracking-wider"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button className="w-full" onClick={handleSearch} disabled={lookupQuery.isFetching}>
                {lookupQuery.isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                ค้นหาโค้ด
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {lookupQuery.error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-red-700">{lookupQuery.error.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Code Details */}
        {codeData && (
          <div className="space-y-4">
            {/* Status Card */}
            <Card className={`border-0 shadow-sm ${isCodeUsable ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono font-bold text-lg">{codeData.code}</p>
                  {codeData.status === "issued" && !codeData.isExpired ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">พร้อมใช้</span>
                  ) : codeData.status === "redeemed" ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">ใช้แล้ว</span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">หมดอายุ</span>
                  )}
                </div>

                {/* Customer Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{codeData.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{codeData.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>หมดอายุ: {formatDate(codeData.expiresAt, { shortYear: true })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Menu Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-primary" />
                  รายละเอียดเครื่องดื่ม
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">เมนูจากโค้ด</span>
                    <span className="font-medium">{codeData.menuName} ({codeData.sizeName})</span>
                  </div>
                  {codeData.milkName && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">นม</span>
                      <span className="font-medium">{codeData.milkName}</span>
                    </div>
                  )}
                  {codeData.selectedMenuName && (
                    <>
                      <div className="border-t my-2" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">เมนูที่ลูกค้าเลือก</span>
                        <span className="font-medium text-primary">{codeData.selectedMenuName}</span>
                      </div>
                      {codeData.sweetnessGrams !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ความหวาน</span>
                          <span className="font-medium">{codeData.sweetnessGrams}g</span>
                        </div>
                      )}
                      {codeData.packagingType && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">แพ็ค</span>
                          <span className="font-medium">{codeData.packagingType === "ready" ? "พร้อมดื่ม" : "แยกน้ำแข็ง"}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Redeem Form - only show if code is usable */}
            {isCodeUsable && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3">ประเภทออเดอร์</h3>

                  {/* Order Type */}
                  <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as "in_store" | "delivery")}>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${orderType === "in_store" ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted'}`}>
                        <RadioGroupItem value="in_store" />
                        <Store className="h-4 w-4" />
                        <span className="text-sm font-medium">หน้าร้าน</span>
                      </label>
                      <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${orderType === "delivery" ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted'}`}>
                        <RadioGroupItem value="delivery" />
                        <Truck className="h-4 w-4" />
                        <span className="text-sm font-medium">Delivery</span>
                      </label>
                    </div>
                  </RadioGroup>

                  {/* Delivery fields */}
                  {orderType === "delivery" && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label className="text-xs">แอป Delivery</Label>
                        <Select value={deliveryApp} onValueChange={setDeliveryApp}>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกแอป" />
                          </SelectTrigger>
                          <SelectContent>
                            {DELIVERY_APPS.map(app => (
                              <SelectItem key={app.value} value={app.value}>{app.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Order ID</Label>
                        <Input
                          placeholder="กรอก Order ID จากแอป"
                          value={deliveryOrderId}
                          onChange={(e) => setDeliveryOrderId(e.target.value)}
                          className="font-mono"
                        />
                        {deliveryApp && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {deliveryApp === "shopee" && "ตัวเลข 13-19 หลัก เช่น 2966366660490752985"}
                            {deliveryApp === "grab" && "ขึ้นต้น A- เช่น A-9WERMBQGW4SJAV"}
                            {deliveryApp === "lineman" && "รูปแบบ LMF-YYMMDD-XXXXXXXXX เช่น LMF-260218-234745909"}
                            {deliveryApp === "gpos" && "เลขที่ใบเสร็จ 13 หลัก เช่น 0105536123457"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Redeem Button */}
                  <Button
                    className="w-full mt-4"
                    size="lg"
                    onClick={() => setShowConfirm(true)}
                    disabled={orderType === "delivery" && (!deliveryOrderId.trim())}
                  >
                    Mark โค้ดใช้แล้ว
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Code not usable */}
            {!isCodeUsable && codeData && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-700">
                    {codeData.isRedeemed ? "โค้ดนี้ถูกใช้แล้ว" : "โค้ดนี้หมดอายุแล้ว"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              ยืนยัน Mark โค้ดใช้แล้ว
            </DialogTitle>
            <DialogDescription className="text-center">
              เมื่อยืนยันแล้วจะไม่สามารถยกเลิกได้
            </DialogDescription>
          </DialogHeader>
          {codeData && (
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">โค้ด</span>
                  <span className="font-mono font-bold">{codeData.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ลูกค้า</span>
                  <span>{codeData.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เมนู</span>
                  <span>{codeData.selectedMenuName || codeData.menuName}</span>
                </div>
                {codeData.selectedMenuName && (
                  <>
                    {codeData.sweetnessGrams !== undefined && (
                      <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">ความหวาน</span>
                        <span>{codeData.sweetnessGrams}g</span>
                      </div>
                    )}
                    {codeData.packagingType && (
                      <div className="flex justify-between mt-1">
                        <span className="text-muted-foreground">แพ็ค</span>
                        <span>{codeData.packagingType === "ready" ? "พร้อมดื่ม" : "แยกน้ำแข็ง"}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ประเภท</span>
                    <span className="font-medium">{orderType === "in_store" ? "หน้าร้าน" : "Delivery"}</span>
                  </div>
                  {orderType === "delivery" && deliveryOrderId && (
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-mono text-xs">{deliveryOrderId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">ยกเลิก</Button>
            <Button onClick={handleRedeem} disabled={redeemMutation.isPending} className="flex-1">
              {redeemMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
              Mark โค้ดสำเร็จ!
            </DialogTitle>
          </DialogHeader>
          {resultData && (
            <div className="space-y-3">
              <div className="bg-emerald-50 rounded-lg p-4 text-center space-y-1">
                <p className="font-mono font-bold">{resultData.code}</p>
                <p className="text-sm font-medium">{resultData.selectedMenuName || resultData.menuName}</p>
                <p className="text-xs text-muted-foreground">
                  {resultData.sizeName}{resultData.milkName ? ` • ${resultData.milkName}` : ""}
                </p>
                {resultData.remark && (
                  <p className="text-xs text-muted-foreground">
                    Remark: {resultData.remark}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">ลูกค้า: {resultData.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {resultData.orderType === "in_store" ? "หน้าร้าน" : `Delivery${resultData.deliveryOrderId ? ` (${resultData.deliveryOrderId})` : ""}`}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={resetAll} className="w-full">ค้นหาโค้ดใหม่</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </PremiumPageContent>
    </MobileLayout>
  );
}
