import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import DatePickerCE from "@/components/DatePickerCE";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Clock, CheckCircle2, XCircle, Loader2, User, Phone, Copy, Image, CalendarDays,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDate, formatDateLong, formatTime } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/useMobile";

const APP_LABELS: Record<string, string> = { shopee: "Shopee Food", lineman: "LINE MAN", grab: "Grab Food", gpos: "GPOS (หน้าร้าน)" };
const APP_COLORS: Record<string, string> = { shopee: "bg-orange-50 text-orange-600", lineman: "bg-green-50 text-green-600", grab: "bg-emerald-50 text-emerald-600", gpos: "bg-blue-50 text-blue-600" };

export default function PointClaimsQueue() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<string>("pending");
  const [dateFilter, setDateFilter] = useState<string>(""); // yyyy-mm-dd or empty
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  // Compute fromDate/toDate from dateFilter
  const dateRange = useMemo(() => {
    if (!dateFilter) return { fromDate: undefined, toDate: undefined };
    const from = new Date(dateFilter + "T00:00:00");
    const to = new Date(dateFilter + "T23:59:59");
    return { fromDate: from, toDate: to };
  }, [dateFilter]);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  const { data: claims, isLoading, refetch } = trpc.loyalty.claimsQueue.useQuery(
    { status: filter === "all" ? undefined : filter, fromDate: dateRange.fromDate, toDate: dateRange.toDate },
    { enabled: !!session && isStaff }
  );

  const { data: claimDetail } = trpc.loyalty.claimDetail.useQuery(
    { id: selectedClaim?.id },
    { enabled: !!selectedClaim }
  );

  const approveMutation = trpc.loyalty.approveClaim.useMutation({
    onSuccess: (data) => {
      toast.success(`อนุมัติแล้ว! +${data.pointsAwarded} แต้ม`);
      setSelectedClaim(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.loyalty.rejectClaim.useMutation({
    onSuccess: () => {
      toast.success("ปฏิเสธแล้ว");
      setSelectedClaim(null);
      setShowReject(false);
      setRejectReason("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading || !session) return null;

  const pendingCount = claims?.filter(c => c.status === "pending").length ?? 0;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`คัดลอก ${label} แล้ว`);
  };

  return (
    <MobileLayout title="คำขอแต้ม Delivery" showBack backPath="/branch">
      <PremiumPageContent>
      <div className="px-4 py-4 space-y-4">
        {/* Date filter */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <DatePickerCE value={dateFilter} onChange={setDateFilter} placeholder="กรองตามวันที่" maxDate={new Date()} />
          </div>
          {dateFilter && (
            <Button variant="ghost" size={isMobile ? "default" : "sm"} className="h-8 text-xs px-2" onClick={() => setDateFilter("")}>
              ล้าง
            </Button>
          )}
        </div>

        {/* Status filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "pending", label: `รอตรวจ (${pendingCount})` },
            { key: "approved", label: "อนุมัติแล้ว" },
            { key: "rejected", label: "ปฏิเสธ" },
            { key: "all", label: "ทั้งหมด" },
          ].map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size={isMobile ? "default" : "sm"}
              className="text-xs flex-shrink-0"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Claims List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-sm animate-pulse">
                <CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : !claims?.length ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">ไม่มีคำขอ{filter === "pending" ? "ที่รอตรวจสอบ" : ""}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {claims.map((claim: any) => {
              const isPending = claim.status === "pending";
              const isGrab = claim.deliveryApp === "grab";
              const isShopee = claim.deliveryApp === "shopee";
              const isLineman = claim.deliveryApp === "lineman";
              return (
                <Card
                  key={claim.id}
                  className={`border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform ${isPending ? "border-l-4 border-l-amber-400" : ""}`}
                  onClick={() => setSelectedClaim(claim)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${APP_COLORS[claim.deliveryApp] || "bg-gray-50 text-gray-600"}`}>
                            {APP_LABELS[claim.deliveryApp] || claim.deliveryApp}
                          </span>
                          {/* Show GF number for Grab, Shopee order # for Shopee, otherwise orderId */}
                          {isGrab && claim.gfNumber ? (
                            <span className="text-xs font-mono text-muted-foreground">#{claim.gfNumber}</span>
                          ) : isShopee && claim.shopeeOrderNumber ? (
                            <span className="text-xs font-mono text-muted-foreground">#{claim.shopeeOrderNumber}</span>
                          ) : isLineman && claim.linemanOrderNumber ? (
                            <span className="text-xs font-mono text-muted-foreground">#{claim.linemanOrderNumber}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">#{claim.orderId}</span>
                          )}
                        </div>
                        {/* Show Booking ID below for Grab */}
                        {isGrab && claim.bookingId && (
                          <p className="text-[10px] font-mono text-muted-foreground/70 mb-0.5">
                            ID: {claim.bookingId}
                          </p>
                        )}
                        {/* Show Shopee Order ID below for Shopee */}
                        {isShopee && claim.shopeeOrderId && (
                          <p className="text-[10px] font-mono text-muted-foreground/70 mb-0.5">
                            เลขคำสั่งซื้อ: {claim.shopeeOrderId}
                          </p>
                        )}
                        {/* Show LINE MAN Order ID below for LINE MAN */}
                        {isLineman && claim.linemanOrderId && (
                          <p className="text-[10px] font-mono text-muted-foreground/70 mb-0.5">
                            รหัส: {claim.linemanOrderId}
                          </p>
                        )}
                        <p className="text-sm font-medium">{claim.customerName || `ลูกค้า #${claim.customerId}`}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{claim.orderAmount} ฿</p>
                        {claim.status === "pending" && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">รอตรวจ</span>
                        )}
                        {claim.status === "approved" && (
                          <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">+{claim.pointsAwarded} แต้ม</span>
                        )}
                        {claim.status === "rejected" && (
                          <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">ปฏิเสธ</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {claim.orderDate ? (
                        <><span className="text-blue-600 font-medium">สั่งซื้อ: {formatDate(claim.orderDate, { shortYear: true })}</span>{" "}<span className="opacity-60">ส่งคำขอ: {formatDate(claim.createdAt, { shortYear: true })}</span></>
                      ) : (
                        <>{formatDate(claim.createdAt, { shortYear: true })} {formatTime(claim.createdAt)}</>
                      )}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Claim Detail Dialog */}
      <Dialog open={!!selectedClaim && !showReject} onOpenChange={() => setSelectedClaim(null)}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียดคำขอ</DialogTitle>
          </DialogHeader>
          {claimDetail && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{claimDetail.customerName}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{claimDetail.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">แอป</p>
                    <p className="font-medium">{APP_LABELS[claimDetail.deliveryApp]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">สาขา</p>
                    <p className="font-medium">{claimDetail.branchName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ยอดซื้อ</p>
                    <p className="font-bold text-lg">{claimDetail.orderAmount} ฿</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tier</p>
                    <p className="font-medium capitalize">{claimDetail.customerTier || "green"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">วันที่ส่งคำขอ</p>
                    <p className="font-medium">{formatDate(claimDetail.createdAt, { shortYear: true })} {formatTime(claimDetail.createdAt)}</p>
                  </div>
                </div>
                {claimDetail.orderDate && (
                  <div className="bg-blue-50/60 rounded-lg px-3 py-2 text-sm">
                    <p className="text-[10px] text-blue-600 font-medium">วันที่สั่งซื้อ</p>
                    <p className="font-bold text-blue-800">{formatDateLong(claimDetail.orderDate)}</p>
                  </div>
                )}

                {/* Grab-specific: GF Number + Booking ID */}
                {claimDetail.deliveryApp === "grab" ? (
                  <div className="bg-emerald-50/50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider">Grab Order Details</p>
                    
                    {/* GF Number */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground">เลข GF</p>
                        <p className="text-sm font-bold font-mono">{claimDetail.gfNumber || claimDetail.orderId}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size={isMobile ? "default" : "sm"}
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(claimDetail.gfNumber || claimDetail.orderId, "เลข GF")}
                      >
                        <Copy className="h-3 w-3 mr-1" /> คัดลอก
                      </Button>
                    </div>

                    {/* Booking ID */}
                    {claimDetail.bookingId && (
                      <div className="flex items-center justify-between border-t border-emerald-100 pt-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Booking ID</p>
                          <p className="text-sm font-bold font-mono tracking-wide">{claimDetail.bookingId}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size={isMobile ? "default" : "sm"}
                          className="h-7 px-2"
                          onClick={() => copyToClipboard(claimDetail.bookingId ?? "", "Booking ID")}
                        >
                          <Copy className="h-3 w-3 mr-1" /> คัดลอก
                        </Button>
                      </div>
                    )}
                  </div>
                ) : claimDetail.deliveryApp === "shopee" && claimDetail.shopeeOrderNumber ? (
                  /* Shopee-specific: Order # + Order ID */
                  <div className="bg-orange-50/50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-medium text-orange-700 uppercase tracking-wider">Shopee Order Details</p>
                    
                    {/* Short Order Number */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground">เลขออเดอร์สั้น</p>
                        <p className="text-sm font-bold font-mono">#{claimDetail.shopeeOrderNumber}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size={isMobile ? "default" : "sm"}
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(claimDetail.shopeeOrderNumber || claimDetail.orderId, "เลขออเดอร์")}
                      >
                        <Copy className="h-3 w-3 mr-1" /> คัดลอก
                      </Button>
                    </div>

                    {/* Long Order ID */}
                    {claimDetail.shopeeOrderId && (
                      <div className="flex items-center justify-between border-t border-orange-100 pt-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground">เลขคำสั่งซื้อ</p>
                          <p className="text-sm font-bold font-mono tracking-wide">{claimDetail.shopeeOrderId}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size={isMobile ? "default" : "sm"}
                          className="h-7 px-2"
                          onClick={() => copyToClipboard(claimDetail.shopeeOrderId ?? "", "เลขคำสั่งซื้อ")}
                        >
                          <Copy className="h-3 w-3 mr-1" /> คัดลอก
                        </Button>
                      </div>
                    )}
                  </div>
                ) : claimDetail.deliveryApp === "lineman" && claimDetail.linemanOrderNumber ? (
                  /* LINE MAN-specific: Order # + รหัสใบสั่งซื้อ */
                  <div className="bg-green-50/50 rounded-xl p-3 space-y-2">
                    <p className="text-[10px] font-medium text-green-700 uppercase tracking-wider">LINE MAN Order Details</p>
                    
                    {/* Short Order Number */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground">เลขออเดอร์สั้น</p>
                        <p className="text-sm font-bold font-mono">#{claimDetail.linemanOrderNumber}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size={isMobile ? "default" : "sm"}
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(claimDetail.linemanOrderNumber || claimDetail.orderId, "เลขออเดอร์")}
                      >
                        <Copy className="h-3 w-3 mr-1" /> คัดลอก
                      </Button>
                    </div>

                    {/* Long Order ID (LMF format) */}
                    {claimDetail.linemanOrderId && (
                      <div className="flex items-center justify-between border-t border-green-100 pt-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground">รหัสใบสั่งซื้อ</p>
                          <p className="text-sm font-bold font-mono tracking-wide">{claimDetail.linemanOrderId}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size={isMobile ? "default" : "sm"}
                          className="h-7 px-2"
                          onClick={() => copyToClipboard(claimDetail.linemanOrderId ?? "", "รหัสใบสั่งซื้อ")}
                        >
                          <Copy className="h-3 w-3 mr-1" /> คัดลอก
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Non-Grab/Non-Shopee/Non-Lineman: single Order ID */
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium font-mono">{claimDetail.orderId}</p>
                      <button
                        onClick={() => copyToClipboard(claimDetail.orderId, "Order ID")}
                        className="text-muted-foreground/50 hover:text-primary"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Screenshot */}
              {claimDetail.screenshotUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">ภาพหน้าจอ</p>
                  <a href={claimDetail.screenshotUrl} target="_blank" rel="noopener noreferrer">
                    <img src={claimDetail.screenshotUrl} alt="Screenshot" className="w-full rounded-xl border" />
                  </a>
                </div>
              )}

              {/* Actions */}
              {claimDetail.status === "pending" && (
                <DialogFooter className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowReject(true)}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> ปฏิเสธ
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => approveMutation.mutate({ id: claimDetail.id })}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    อนุมัติ
                  </Button>
                </DialogFooter>
              )}

              {claimDetail.status === "approved" && (
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-sm font-medium text-green-700">อนุมัติแล้ว +{claimDetail.pointsAwarded} แต้ม</p>
                </div>
              )}

              {claimDetail.status === "rejected" && (
                <div className="space-y-3">
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                    <p className="text-sm font-medium text-red-700">ปฏิเสธแล้ว</p>
                    {claimDetail.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">เหตุผล: {claimDetail.rejectionReason}</p>
                    )}
                  </div>
                  <Button className="w-full" variant="outline" onClick={() => approveMutation.mutate({ id: claimDetail.id })} disabled={approveMutation.isPending}>
                    {approveMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    อนุมัติย้อนหลัง (พนักงานเช็คผิด)
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showReject} onOpenChange={() => { setShowReject(false); setRejectReason(""); }}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>ปฏิเสธคำขอ</DialogTitle>
            <DialogDescription>ระบุเหตุผลในการปฏิเสธ (ไม่บังคับ)</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="เช่น ข้อมูลไม่ตรง, ออเดอร์ซ้ำ"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowReject(false); setRejectReason(""); }}>ยกเลิก</Button>
            <Button
              variant="destructive"
              onClick={() => selectedClaim && rejectMutation.mutate({ id: selectedClaim.id, reason: rejectReason || undefined })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              ยืนยันปฏิเสธ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </PremiumPageContent>
    </MobileLayout>
  );
}
