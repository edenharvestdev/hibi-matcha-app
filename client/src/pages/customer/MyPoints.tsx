import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import {
  Coins, History, Gift, ChevronRight, Sparkles, Building2, Info, Leaf,
  MapPin, TrendingUp, ArrowRight,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function MyPoints() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isCustomer) setLocation("/branch");
  }, [loading, session, isCustomer, setLocation]);

  const { data: points, isLoading } = trpc.loyalty.myPoints.useQuery(undefined, { enabled: !!session && isCustomer });
  const { data: branchPoints } = trpc.branchLoyalty.myBranchPoints.useQuery(undefined, { enabled: !!session && isCustomer });
  const [expandedBranch, setExpandedBranch] = useState<number | null>(null);

  if (loading || !session || isLoading) return null;

  const available = points?.availablePoints ?? 0;
  const qrValue = `HIBI-CUST-${session.id}`;

  // Sort branches by available points descending
  const sortedBranches = [...(branchPoints ?? [])].sort((a: any, b: any) => b.available - a.available);
  const totalBranchAvailable = sortedBranches.reduce((sum: number, bp: any) => sum + bp.available, 0);

  return (
    <MobileLayout title="แต้มของฉัน" showBack backPath="/customer">
      <PremiumPageContent>
        {/* Total Points Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90">แต้มรวมทั้งหมด</p>
                <p className="text-4xl font-bold mt-1">{available.toLocaleString()}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center mb-1">
                  <Leaf className="h-6 w-6" />
                </div>
                <span className="text-xs font-semibold opacity-90">Hibi Member</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs opacity-80">
              <span>สะสมทั้งหมด: {(points?.lifetimePoints ?? 0).toLocaleString()} แต้ม</span>
              <span>อัตรา: 10 บาท = 1 แต้ม</span>
            </div>
          </div>
        </div>

        {/* ═══ Branch-specific Points Section ═══ */}
        {sortedBranches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                แต้มแยกตามสาขา
              </h3>
              <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                <Info className="h-3 w-3 mr-0.5" />
                แต้มใช้ข้ามสาขาไม่ได้
              </Badge>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200/50">
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-semibold">ทำไมแต้มแยกตามสาขา?</span> แต่ละสาขา (Franchise) รับผิดชอบต้นทุนเอง
                แต้มที่สะสมจากสาขาไหน ใช้แลกรางวัลได้เฉพาะสาขานั้น
              </p>
            </div>

            {/* Branch Cards */}
            {sortedBranches.map((bp: any) => {
              const isExpanded = expandedBranch === bp.branchId;
              const percentage = bp.totalPoints > 0 ? Math.round((bp.available / bp.totalPoints) * 100) : 0;
              return (
                <Card
                  key={bp.branchId}
                  className={`border-0 shadow-sm overflow-hidden transition-all ${isExpanded ? "ring-2 ring-primary/30" : ""}`}
                >
                  <CardContent className="p-0">
                    {/* Branch Header */}
                    <div
                      className="p-4 cursor-pointer active:bg-muted/30 transition-colors"
                      onClick={() => setExpandedBranch(isExpanded ? null : bp.branchId)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{bp.branchName || `สาขา #${bp.branchId}`}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {/* Progress bar */}
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">{percentage}% คงเหลือ</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-lg font-bold text-primary">{bp.available.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">แต้มใช้ได้</p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t bg-muted/20 px-4 py-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-background rounded-lg p-2">
                            <p className="text-xs font-bold text-green-600">{bp.totalPoints.toLocaleString()}</p>
                            <p className="text-[9px] text-muted-foreground">สะสมทั้งหมด</p>
                          </div>
                          <div className="bg-background rounded-lg p-2">
                            <p className="text-xs font-bold text-red-500">{bp.usedPoints.toLocaleString()}</p>
                            <p className="text-[9px] text-muted-foreground">ใช้ไปแล้ว</p>
                          </div>
                          <div className="bg-background rounded-lg p-2">
                            <p className="text-xs font-bold text-primary">{bp.available.toLocaleString()}</p>
                            <p className="text-[9px] text-muted-foreground">คงเหลือ</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setLocation(`/customer/rewards?branchId=${bp.branchId}`)}
                          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-xs font-semibold active:scale-[0.98] transition-transform"
                        >
                          <Gift className="h-4 w-4" />
                          แลกรางวัลสาขานี้
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Total summary */}
            {sortedBranches.length > 1 && (
              <div className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg">
                <span className="text-xs text-muted-foreground">รวมแต้มทุกสาขา</span>
                <span className="text-sm font-bold text-primary">{totalBranchAvailable.toLocaleString()} แต้ม</span>
              </div>
            )}
          </div>
        )}

        {/* No branch points yet */}
        {(!branchPoints || branchPoints.length === 0) && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground">ยังไม่มีแต้มแยกสาขา</p>
              <p className="text-xs text-muted-foreground mt-1">เมื่อคุณสะสมแต้มจากสาขาต่างๆ จะแสดงที่นี่</p>
            </CardContent>
          </Card>
        )}

        {/* QR Code for Store */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm text-center mb-3">QR Code สะสมแต้ม</h3>
            <p className="text-xs text-muted-foreground text-center mb-4">แสดง QR นี้ให้พนักงานสแกนเมื่อซื้อที่ร้าน</p>
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-4 border border-primary/10 shadow-sm inline-flex flex-col items-center">
                <QRCodeSVG
                  value={qrValue}
                  size={160}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#2d6a2e"
                />
                <p className="mt-2 text-xs text-muted-foreground">{session.name} • {session.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          {[
            { icon: History, label: "ประวัติแต้ม", desc: "ดูรายการได้/ใช้แต้มทั้งหมด", path: "/customer/points-history", color: "bg-blue-50 text-blue-600" },
            { icon: Sparkles, label: "สะสมแต้มจาก Delivery", desc: "ส่งหลักฐานออเดอร์เพื่อรับแต้ม", path: "/customer/claim-points", color: "bg-purple-50 text-purple-600" },
            { icon: Gift, label: "แลกรางวัล", desc: `${available} แต้มพร้อมใช้`, path: "/customer/rewards", color: "bg-pink-50 text-pink-600" },
          ].map((item) => (
            <Card
              key={item.path}
              className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => setLocation(item.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <Card className="border-0 shadow-sm bg-muted/30">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">วิธีสะสมแต้ม</h3>
            <div className="space-y-3">
              {[
                { step: "🏪", text: "หน้าร้าน: แสดง QR Code ด้านบน → พนักงานสแกน → ได้แต้มทันที" },
                { step: "🛵", text: "Delivery: ส่งหลักฐาน Order ID + screenshot ยอดซื้อ → รอตรวจสอบ → ได้แต้ม" },
                { step: "🎁", text: "แลกรางวัล: ใช้แต้มแลกเครื่องดื่ม ขนม หรือส่วนลดฟรี!" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{item.step}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PremiumPageContent>
    </MobileLayout>
  );
}
