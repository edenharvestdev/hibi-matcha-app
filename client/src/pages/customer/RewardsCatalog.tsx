import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import HowToPopup from "@/components/HowToPopup";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import {
  Gift, Coffee, Cake, Cherry, Percent, Sparkles, Coins, CheckCircle2, Clock, XCircle, Loader2, MapPin, Store,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDate, formatDateLong } from "@/lib/dateUtils";

const CATEGORY_ICONS: Record<string, typeof Coffee> = {
  drink: Coffee, food: Cake, topping: Cherry, discount: Percent, special: Sparkles,
};
const CATEGORY_LABELS: Record<string, string> = {
  drink: "เครื่องดื่ม", food: "อาหาร", topping: "ท็อปปิ้ง", discount: "ส่วนลด", special: "พิเศษ",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "พร้อมใช้", color: "text-green-600 bg-green-50" },
  used: { label: "ใช้แล้ว", color: "text-gray-500 bg-gray-50" },
  expired: { label: "หมดอายุ", color: "text-red-500 bg-red-50" },
  cancelled: { label: "ยกเลิก", color: "text-red-500 bg-red-50" },
};

export default function RewardsCatalog() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showRewards, setShowRewards] = useState(true);
  const [confirmReward, setConfirmReward] = useState<any>(null);
  const [redeemResult, setRedeemResult] = useState<any>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isCustomer) setLocation("/branch");
  }, [loading, session, isCustomer, setLocation]);

  const { data: rewards } = trpc.loyalty.rewards.useQuery(undefined, { enabled: !!session });
  const { data: branchPoints, refetch: refetchBranchPoints } = trpc.branchLoyalty.myBranchPoints.useQuery(undefined, { enabled: !!session && isCustomer });
  const { data: myRedemptions, refetch: refetchRedemptions } = trpc.loyalty.myRedemptions.useQuery(undefined, { enabled: !!session && isCustomer });
  const redeemReward = trpc.loyalty.redeemReward.useMutation();

  // Auto-select first branch with points
  useEffect(() => {
    if (branchPoints && branchPoints.length > 0 && !selectedBranchId) {
      const firstWithPoints = branchPoints.find((bp: any) => bp.available > 0);
      setSelectedBranchId(firstWithPoints?.branchId ?? branchPoints[0].branchId);
    }
  }, [branchPoints, selectedBranchId]);

  // Available points for selected branch
  const selectedBranchData = useMemo(() => {
    if (!branchPoints || !selectedBranchId) return null;
    return branchPoints.find((bp: any) => bp.branchId === selectedBranchId);
  }, [branchPoints, selectedBranchId]);

  const available = selectedBranchData?.available ?? 0;

  const handleRedeem = async () => {
    if (!confirmReward || !selectedBranchId) return;
    setRedeeming(true);
    try {
      const result = await redeemReward.mutateAsync({ rewardId: confirmReward.id, branchId: selectedBranchId });
      setRedeemResult(result);
      setConfirmReward(null);
      refetchBranchPoints();
      refetchRedemptions();
      toast.success("แลกรางวัลสำเร็จ!");
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setRedeeming(false);
    }
  };

  if (loading || !session) return null;

  return (
    <MobileLayout title="แลกรางวัล" showBack backPath="/customer/my-points">
      <PremiumPageContent>
      <div className="px-4 py-6 space-y-5">
        {/* Popup วิธีรีดีมแต้ม */}
        <HowToPopup
          contentKey="reward_redeem_howto_image"
          storageKey="hibi_reward_redeem_howto_seen"
          dismissLabel="เข้าใจแล้ว"
          linkLabel="วิธีแลกรางวัล"
        />
        {/* Branch selector + points */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Store className="h-4 w-4" />
              เลือกสาขาที่จะใช้แต้ม
            </div>
            {branchPoints && branchPoints.length > 0 ? (
              <>
                <Select
                  value={selectedBranchId ? String(selectedBranchId) : undefined}
                  onValueChange={(v) => setSelectedBranchId(Number(v))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    {branchPoints.map((bp: any) => (
                      <SelectItem key={bp.branchId} value={String(bp.branchId)}>
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{bp.branchName}</span>
                          <span className="text-xs text-muted-foreground ml-2">({bp.available} แต้ม)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-center gap-2 bg-white rounded-lg py-2.5">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">{available.toLocaleString()} แต้มพร้อมใช้</span>
                </div>
              </>
            ) : (
              <div className="text-center py-3">
                <p className="text-sm text-muted-foreground">ยังไม่มีแต้มสะสม</p>
                <p className="text-xs text-muted-foreground mt-1">สะสมแต้มจากการซื้อสินค้าที่สาขา</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All branch points summary */}
        {branchPoints && branchPoints.length > 1 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> แต้มทุกสาขา
              </p>
              <div className="space-y-1.5">
                {branchPoints.map((bp: any) => (
                  <div
                    key={bp.branchId}
                    className={`flex items-center justify-between text-xs p-1.5 rounded cursor-pointer transition-colors ${bp.branchId === selectedBranchId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50'}`}
                    onClick={() => setSelectedBranchId(bp.branchId)}
                  >
                    <span>{bp.branchName}</span>
                    <span className="font-mono">{bp.available.toLocaleString()} แต้ม</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toggle */}
        <div className="flex gap-2">
          <Button variant={showRewards ? "default" : "outline"} size="sm" onClick={() => setShowRewards(true)} className="flex-1 text-xs">
            <Gift className="h-3.5 w-3.5 mr-1" /> รางวัล
          </Button>
          <Button variant={!showRewards ? "default" : "outline"} size="sm" onClick={() => setShowRewards(false)} className="flex-1 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> รางวัลของฉัน ({myRedemptions?.length ?? 0})
          </Button>
        </div>

        {showRewards ? (
          /* Rewards Catalog */
          <div className="space-y-3">
            {!rewards?.length ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Gift className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">ยังไม่มีรางวัลในขณะนี้</p>
                </CardContent>
              </Card>
            ) : (
              rewards.map((reward) => {
                const CatIcon = CATEGORY_ICONS[reward.category] || Gift;
                const canRedeem = available >= reward.pointsCost && !!selectedBranchId;
                const outOfStock = reward.stock !== null && reward.stock <= 0;
                return (
                  <Card
                    key={reward.id}
                    className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedReward(reward)}
                  >
                    <CardContent className="p-0">
                      {reward.imageUrl && (
                        <div className="relative">
                          <img src={reward.imageUrl} alt={reward.name} className="w-full h-36 object-cover" />
                          <div className="absolute top-2 left-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-primary font-medium shadow-sm">
                              {CATEGORY_LABELS[reward.category] || reward.category}
                            </span>
                          </div>
                          {outOfStock && (
                            <div className="absolute top-2 right-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">หมด</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {!reward.imageUrl && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <CatIcon className="h-3.5 w-3.5 text-primary/60" />
                                <span className="text-[10px] text-primary font-medium">
                                  {CATEGORY_LABELS[reward.category] || reward.category}
                                </span>
                                {outOfStock && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium">หมด</span>
                                )}
                              </div>
                            )}
                            <p className="text-sm font-medium">{reward.name}</p>
                            {reward.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{reward.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-sm font-bold text-primary">{reward.pointsCost.toLocaleString()} แต้ม</span>
                          <Button
                            size="sm"
                            disabled={!canRedeem || outOfStock}
                            onClick={(e) => { e.stopPropagation(); setConfirmReward(reward); }}
                            className="text-xs h-7 px-3"
                          >
                            แลก
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          /* My Redemptions */
          <div className="space-y-3">
            {!myRedemptions?.length ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Gift className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">ยังไม่มีรางวัลที่แลก</p>
                </CardContent>
              </Card>
            ) : (
              myRedemptions.map((r) => {
                const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                const isUsable = r.status === "pending" && new Date(r.expiresAt) > new Date();
                return (
                  <Card key={r.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{r.rewardName}</p>
                          <p className="text-xs text-muted-foreground">{r.pointsSpent} แต้ม</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      {isUsable && (
                        <div className="mt-3">
                          <QRCodeDisplay code={r.redemptionCode} size={120} label="แสดงที่ร้านเพื่อรับรางวัล" />
                        </div>
                      )}
                      {!isUsable && (
                        <p className="text-xs font-mono text-muted-foreground mt-1">{r.redemptionCode}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2">
                        หมดอายุ: {formatDate(r.expiresAt, { shortYear: true })}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Reward Detail Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto p-0">
          {selectedReward && (
            <>
              {selectedReward.imageUrl && (
                <img src={selectedReward.imageUrl} alt={selectedReward.name} className="w-full h-48 object-cover rounded-t-lg" />
              )}
              <div className="p-5 space-y-3">
                <div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {CATEGORY_LABELS[selectedReward.category] || selectedReward.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{selectedReward.name}</h3>
                {selectedReward.description && (
                  <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-lg font-bold text-primary">{selectedReward.pointsCost.toLocaleString()} แต้ม</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedBranchData ? selectedBranchData.branchName + ": " + available.toLocaleString() + " แต้ม" : "เลือกสาขาก่อน"}
                    </p>
                  </div>
                  <Button
                    disabled={available < selectedReward.pointsCost || (selectedReward.stock !== null && selectedReward.stock <= 0) || !selectedBranchId}
                    onClick={() => { setSelectedReward(null); setConfirmReward(selectedReward); }}
                  >
                    แลกรางวัล
                  </Button>
                </div>
                {selectedReward.stock !== null && (
                  <p className="text-xs text-muted-foreground">
                    {selectedReward.stock > 0 ? "เหลือ " + selectedReward.stock + " สิทธิ์" : "หมดแล้ว"}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmReward} onOpenChange={() => setConfirmReward(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              <Gift className="h-10 w-10 text-primary mx-auto mb-2" />
              ยืนยันแลกรางวัล
            </DialogTitle>
            <DialogDescription className="text-center">
              กรุณาตรวจสอบรายละเอียดก่อนยืนยัน
            </DialogDescription>
          </DialogHeader>
          {confirmReward && (
            <div className="space-y-3">
              <div className="bg-primary/5 rounded-xl p-4 text-center">
                <p className="font-semibold text-base">{confirmReward.name}</p>
                {confirmReward.description && <p className="text-xs text-muted-foreground mt-1">{confirmReward.description}</p>}
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {CATEGORY_LABELS[confirmReward.category] || confirmReward.category}
                  </span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">สาขา</span>
                  <span className="font-medium flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {selectedBranchData?.branchName || "ไม่ระบุ"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">แต้มที่ใช้</span>
                  <span className="font-bold text-primary">-{confirmReward.pointsCost.toLocaleString()} แต้ม</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">แต้มปัจจุบัน (สาขา)</span>
                  <span className="font-medium">{available.toLocaleString()} แต้ม</span>
                </div>
                <div className="border-t pt-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">คงเหลือหลังแลก</span>
                    <span className="font-bold">{(available - confirmReward.pointsCost).toLocaleString()} แต้ม</span>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-2.5 text-center">
                <p className="text-xs text-amber-700 font-medium">
                  แต้มจะถูกหักจากสาขา {selectedBranchData?.branchName} เท่านั้น
                </p>
                <p className="text-[10px] text-amber-600 mt-0.5">
                  เมื่อยืนยันแล้วจะไม่สามารถยกเลิกได้
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmReward(null)} className="flex-1">ยกเลิก</Button>
            <Button onClick={handleRedeem} disabled={redeeming} className="flex-1">
              {redeeming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              ยืนยันแลกรางวัล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redeem Result Dialog */}
      <Dialog open={!!redeemResult} onOpenChange={() => setRedeemResult(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              แลกรางวัลสำเร็จ!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-3">
            <p className="text-sm font-medium">{redeemResult?.rewardName}</p>
            <p className="text-xs text-muted-foreground">ใช้ {redeemResult?.pointsSpent?.toLocaleString()} แต้ม • คงเหลือ {redeemResult?.balance?.toLocaleString()} แต้ม</p>
            <QRCodeDisplay code={redeemResult?.redemptionCode || ""} size={140} label="แสดง QR นี้ที่ร้านเพื่อรับรางวัล" />
            <p className="text-xs text-muted-foreground">
              หมดอายุ: {redeemResult?.expiresAt ? formatDateLong(redeemResult.expiresAt) : ""}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setRedeemResult(null)} className="w-full">ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </PremiumPageContent>
    </MobileLayout>
  );
}
