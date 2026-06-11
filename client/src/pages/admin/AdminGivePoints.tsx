import AdminPageWrapper from "@/components/AdminPageWrapper";
import QRScanner from "@/components/QRScanner";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera, Search, Coins, CheckCircle2, User, Phone, Loader2, Star, Crown, Leaf, RotateCcw,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import DateRangePickerModal from "@/components/common/DateRangePickerModal";
import { History } from "lucide-react";



export default function AdminGivePoints() {
  const { session, loading, isAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  const [showScanner, setShowScanner] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [orderAmount, setOrderAmount] = useState("");
  const [giveSuccess, setGiveSuccess] = useState<any>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
  }, [loading, session, isAdmin, setLocation]);

  const { data: customerData, isLoading: isSearching } = trpc.loyalty.lookupCustomer.useQuery(
    { phone: searchPhone || undefined, customerId: customerId || undefined },
    { enabled: (!!searchPhone || !!customerId) && !!session }
  );

  const earnMutation = trpc.loyalty.earnAtStore.useMutation({
    onSuccess: (data) => {
      setGiveSuccess(data);
      toast.success(`ให้แต้มสำเร็จ! +${data.pointsEarned} แต้ม`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handlePhoneSearch = () => {
    if (!phoneInput.trim()) { toast.error("กรุณากรอกเบอร์โทร"); return; }
    setCustomerId(null);
    setGiveSuccess(null);
    setSearchPhone(phoneInput.trim());
  };

  const handleQRScan = (scannedCode: string) => {
    setShowScanner(false);
    const match = scannedCode.match(/HIBI-CUST-(\d+)/);
    if (match) {
      const id = parseInt(match[1]);
      setCustomerId(id);
      setSearchPhone("");
      setPhoneInput("");
      setGiveSuccess(null);
      toast.success("สแกนสำเร็จ! พบข้อมูลลูกค้า");
    } else {
      toast.error("QR Code ไม่ถูกต้อง กรุณาใช้ QR สะสมแต้มของลูกค้า");
    }
  };

  const handleGivePoints = () => {
    if (!customerData) return;
    const amount = parseInt(orderAmount);
    if (isNaN(amount) || amount < 1) { toast.error("กรุณาใส่ยอดซื้อที่ถูกต้อง"); return; }
    earnMutation.mutate({ customerId: customerData.id, orderAmount: amount });
  };

  const resetForm = () => {
    setPhoneInput("");
    setSearchPhone("");
    setCustomerId(null);
    setOrderAmount("");
    setGiveSuccess(null);
  };

  if (loading || !session) return null;



  return (
    <AdminPageWrapper title="ให้แต้มหน้าร้าน" backPath="/admin" loading={isSearching}>
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Coins className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">สะสมแต้มให้ลูกค้า</p>
                <p className="text-xs text-muted-foreground">สแกน QR ลูกค้า หรือค้นหาเบอร์โทร</p>
              </div>
            </div>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-14 border-dashed border-2 border-purple-300 bg-purple-50/50 hover:bg-purple-50 text-purple-700"
                onClick={() => setShowScanner(true)}
              >
                <Camera className="h-5 w-5 mr-2" />
                <span className="font-medium">สแกน QR Code ลูกค้า</span>
              </Button>
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-gray-200" />
                <span className="px-3 text-xs text-muted-foreground">หรือ</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">ค้นหาเบอร์โทรลูกค้า</Label>
                <Input type="tel" inputMode="numeric" placeholder="เช่น 0812345678" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()} maxLength={15} />
              </div>
              <Button className="w-full" onClick={handlePhoneSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                ค้นหาลูกค้า
              </Button>
            </div>
          </CardContent>
        </Card>

        {(searchPhone || customerId) && !isSearching && !customerData && (
          <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
            <CardContent className="p-4 text-center">
              <User className="h-10 w-10 text-red-400 mx-auto mb-2" />
              <p className="font-medium text-red-700">ไม่พบลูกค้า</p>
              <p className="text-xs text-muted-foreground mt-1">กรุณาตรวจสอบเบอร์โทร หรือให้ลูกค้าสมัครสมาชิกก่อน</p>
            </CardContent>
          </Card>
        )}

        {customerData && !giveSuccess && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{customerData.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /><span>{customerData.phone}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-emerald-600 bg-emerald-50">
                    <Leaf className="h-3 w-3" />Hibi Member
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">{customerData.availablePoints?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">แต้มที่ใช้ได้</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-muted-foreground">{customerData.lifetimePoints?.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">สะสมทั้งหมด</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Label className="text-sm font-medium">ยอดซื้อ (บาท)</Label>
                <Input type="number" inputMode="numeric" placeholder="เช่น 150" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} className="text-center text-2xl font-bold h-14" onKeyDown={(e) => e.key === "Enter" && handleGivePoints()} />
                {orderAmount && parseInt(orderAmount) >= 1 && (
                  <div className="bg-primary/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground">ลูกค้าจะได้รับ</p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      +{Math.floor(parseInt(orderAmount) / 10)} แต้ม
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">อัตรา 10 บาท = 1 แต้ม</p>
                  </div>
                )}
                <Button className="w-full h-14 text-base" onClick={handleGivePoints} disabled={earnMutation.isPending || !orderAmount}>
                  {earnMutation.isPending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Coins className="h-5 w-5 mr-2" />}
                  ให้แต้ม
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {giveSuccess && (
          <>
            <Card className="border-0 shadow-sm bg-green-50">
              <CardContent className="p-5 text-center">
                <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-lg text-green-700">ให้แต้มสำเร็จ!</p>
                <p className="text-sm text-green-600 mt-1">{giveSuccess.customerName}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-green-200">
                  <div>
                    <p className="text-2xl font-bold text-green-600">+{giveSuccess.pointsEarned}</p>
                    <p className="text-xs text-green-600/70">แต้มที่ได้</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{giveSuccess.newBalance?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">แต้มคงเหลือ</p>
                  </div>
                </div>

              </CardContent>
            </Card>
            <Button className="w-full" onClick={resetForm}>
              <RotateCcw className="h-4 w-4 mr-2" /> ให้แต้มลูกค้าคนถัดไป
            </Button>
          </>
        )}
      </div>

      {/* ประวัติการให้แต้ม */}
      <EarnStoreHistorySection />

      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
    </AdminPageWrapper>
  );
}

function EarnStoreHistorySection() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const queryInput = useMemo(() => ({
    limit: 30,
    offset: 0,
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }), [dateFrom, dateTo]);
  const { data: history, isLoading } = trpc.loyalty.earnStoreHistory.useQuery(queryInput);
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[#3D7A3A]" />
          <h3 className="text-sm font-semibold">ประวัติการให้แต้ม</h3>
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
      ) : !history?.length ? (
        <div className="text-center py-6 text-muted-foreground text-sm">ยังไม่มีประวัติ</div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <Card key={item.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.branchName} • โดย {item.staffName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}{" "}
                      {new Date(item.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#3D7A3A]">+{item.points} แต้ม</p>
                    {item.orderAmount && <p className="text-xs text-muted-foreground">ยอด {item.orderAmount} ฿</p>}
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
