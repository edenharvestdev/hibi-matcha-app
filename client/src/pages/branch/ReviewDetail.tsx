import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, User, Phone, Mail, Package, Image as ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/useMobile";

const appLabels: Record<string, string> = { shopee: "Shopee Food", lineman: "LINE MAN", grab: "Grab Food", robinhood: "Robinhood", walkin: "Walk-in" };
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "รออนุมัติ", color: "text-amber-700", bgColor: "bg-amber-100" },
  approved: { label: "อนุมัติแล้ว", color: "text-green-700", bgColor: "bg-green-100" },
  rejected: { label: "ปฏิเสธ", color: "text-red-700", bgColor: "bg-red-100" },
};

export default function ReviewDetail() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff } = useHibiAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const reviewId = parseInt(params.id || "0");

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  const { data: review, isLoading, refetch } = trpc.reviews.detail.useQuery(
    { id: reviewId },
    { enabled: !!session && isStaff && reviewId > 0 }
  );

  const approveMutation = trpc.reviews.approve.useMutation({
    onSuccess: (data) => {
      toast.success(`อนุมัติสำเร็จ! โค้ด: ${data.code}`);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.reviews.reject.useMutation({
    onSuccess: () => {
      toast.success("ปฏิเสธรีวิวสำเร็จ");
      setShowRejectDialog(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading || !session) return null;

  const config = review ? statusConfig[review.status] || statusConfig.pending : statusConfig.pending;

  return (
    <MobileLayout title="รายละเอียดรีวิว" showBack backPath="/branch/reviews">
      <PremiumPageContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !review ? (
          <div className="text-center py-20 text-muted-foreground">ไม่พบข้อมูลรีวิว</div>
        ) : (
          <>
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
                {review.status === "pending" ? <Clock className="h-4 w-4" /> : review.status === "approved" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground">
                #{review.id}
              </span>
            </div>

            {/* Order Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  ข้อมูลออเดอร์
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">แอปเดลิเวอรี</p>
                    <p className="font-medium">{appLabels[review.deliveryApp] || review.deliveryApp}</p>
                  </div>

                  {/* Grab: GF Number + Booking ID */}
                  {review.deliveryApp === "grab" && (
                    <>
                      <div>
                        <p className="text-muted-foreground text-xs">เลข GF</p>
                        <p className="font-medium font-mono">{review.gfNumber || review.orderId}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">Booking ID</p>
                        <p className="font-medium font-mono text-xs tracking-wider">{review.bookingId || "-"}</p>
                      </div>
                    </>
                  )}

                  {/* Shopee: Order Number + Order ID */}
                  {review.deliveryApp === "shopee" && (
                    <>
                      <div>
                        <p className="text-muted-foreground text-xs">เลขออเดอร์</p>
                        <p className="font-medium font-mono">{review.shopeeOrderNumber || review.orderId}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">เลขคำสั่งซื้อ</p>
                        <p className="font-medium font-mono text-xs tracking-wider">{review.shopeeOrderId || "-"}</p>
                      </div>
                    </>
                  )}

                  {/* LINE MAN: Order Number + Order ID */}
                  {review.deliveryApp === "lineman" && (
                    <>
                      <div>
                        <p className="text-muted-foreground text-xs">เลขออเดอร์</p>
                        <p className="font-medium font-mono">{review.linemanOrderNumber || review.orderId}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground text-xs">รหัสใบสั่งซื้อ</p>
                        <p className="font-medium font-mono text-xs tracking-wider">{review.linemanOrderId || "-"}</p>
                      </div>
                    </>
                  )}

                  {/* GPOS: Receipt Number */}
                  {review.deliveryApp === "gpos" && (
                    <div>
                      <p className="text-muted-foreground text-xs">เลขที่ใบเสร็จ</p>
                      <p className="font-medium font-mono">{review.orderId}</p>
                    </div>
                  )}

                  {/* Fallback for other apps */}
                  {!["grab", "shopee", "lineman", "gpos"].includes(review.deliveryApp) && (
                    <div>
                      <p className="text-muted-foreground text-xs">Order ID</p>
                      <p className="font-medium font-mono">{review.orderId}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-muted-foreground text-xs">สาขา</p>
                    <p className="font-medium">{review.branchName || `#${review.branchId}`}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">วันที่ส่ง</p>
                    <p className="font-medium">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  ข้อมูลลูกค้า
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{review.customerName || "ไม่ระบุ"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{review.customerPhone || "ไม่ระบุ"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{review.customerEmail || "ไม่ระบุ"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Image */}
            {(review.imageUrl || review.orderImageUrl) && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    รูปภาพ
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {review.imageUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">รูปรีวิว</p>
                        <img
                          src={review.imageUrl}
                          alt="Review"
                          className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setShowImageModal(review.imageUrl)}
                        />
                      </div>
                    )}
                    {review.orderImageUrl && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">รูปออเดอร์</p>
                        <img
                          src={review.orderImageUrl}
                          alt="Order"
                          className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setShowImageModal(review.orderImageUrl)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {review.status === "rejected" && review.rejectionReason && (
              <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-red-700 mb-1">เหตุผลที่ปฏิเสธ</p>
                  <p className="text-sm text-muted-foreground">{review.rejectionReason}</p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {review.status === "pending" && (
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  ปฏิเสธ
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => approveMutation.mutate({ id: reviewId })}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  อนุมัติ
                </Button>
              </div>
            )}
          </>
        )}
      </PremiumPageContent>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>ปฏิเสธรีวิว</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="ระบุเหตุผล (ไม่บังคับ)..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>ยกเลิก</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ id: reviewId, reason: rejectReason || undefined })}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              ยืนยันปฏิเสธ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={!!showImageModal} onOpenChange={() => setShowImageModal(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-1 rounded-2xl">
          {showImageModal && (
            <img src={showImageModal} alt="Full size" className="w-full h-auto max-h-[85vh] object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
