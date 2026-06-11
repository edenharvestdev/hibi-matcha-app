import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import {
  Coins, Gift, QrCode, Star, ChevronRight, Coffee, Cake, Cherry, Percent, Sparkles,
  ArrowRight, Clock, CheckCircle2, Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/dateUtils";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029164707/lBgSgkEWqcVXTljA.jpeg";



const CATEGORY_ICONS: Record<string, typeof Coffee> = {
  drink: Coffee, food: Cake, topping: Cherry, discount: Percent, special: Sparkles,
};
const CATEGORY_LABELS: Record<string, string> = {
  drink: "เครื่องดื่ม", food: "อาหาร", topping: "ท็อปปิ้ง", discount: "ส่วนลด", special: "พิเศษ",
};

type Tab = "points" | "codes" | "rewards";

export default function LinePage() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("points");

  useEffect(() => {
    if (!loading && !session) setLocation("/login?redirect=/line");
    if (!loading && session && !isCustomer) setLocation("/branch");
  }, [loading, session, isCustomer, setLocation]);

  const { data: myPoints } = trpc.loyalty.myPoints.useQuery(undefined, { enabled: !!session && isCustomer });
  const { data: myCodes } = trpc.reviews.myCodes.useQuery(undefined, { enabled: !!session && isCustomer });
  const { data: rewards } = trpc.loyalty.rewards.useQuery(undefined, { enabled: !!session });
  const { data: myRedemptions } = trpc.loyalty.myRedemptions.useQuery(undefined, { enabled: !!session && isCustomer });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return null;

  const available = myPoints?.availablePoints ?? 0;

  const activeCodes = myCodes?.filter(c => c.status === "issued" && new Date(c.expiresAt) > new Date()) ?? [];
  const activeRedemptions = myRedemptions?.filter(r => r.status === "pending" && new Date(r.expiresAt) > new Date()) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <img src={LOGO_URL} alt="Hibi Matcha" className="h-10 w-10 rounded-full bg-white p-0.5" />
          <div>
            <h1 className="text-lg font-bold">Hibi Matcha</h1>
            <p className="text-xs opacity-80">สวัสดี, {session.name}</p>
          </div>
        </div>

        {/* Points Summary Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">แต้มสะสม</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                🍃 Hibi Member
              </span>
            </div>
            <p className="text-3xl font-bold text-primary">{available.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">แต้มพร้อมใช้</p>
            <p className="text-[10px] text-muted-foreground mt-2">อัตรา: 10 บาท = 1 แต้ม</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-background border-b px-4">
        <div className="flex">
          {([
            { key: "points" as Tab, label: "แต้ม", icon: Coins },
            { key: "codes" as Tab, label: "โค้ด", icon: QrCode, badge: activeCodes.length + activeRedemptions.length },
            { key: "rewards" as Tab, label: "รางวัล", icon: Gift },
          ]).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-3 text-center text-xs font-medium transition-colors relative ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="bg-red-500 text-white text-[9px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </div>
                {isActive && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4 pb-8">
        {activeTab === "points" && (
          <PointsTab
            myPoints={myPoints}
            onViewHistory={() => setLocation("/customer/points-history")}
            onClaimPoints={() => setLocation("/customer/claim-points")}
          />
        )}
        {activeTab === "codes" && (
          <CodesTab
            activeCodes={activeCodes}
            activeRedemptions={activeRedemptions}
          />
        )}
        {activeTab === "rewards" && (
          <RewardsTab
            rewards={rewards ?? []}
            available={available}
            onRedeem={() => setLocation("/customer/rewards")}
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setLocation("/customer")}>
          หน้าหลัก
        </Button>
        <Button size="sm" className="flex-1 text-xs" onClick={() => setLocation("/customer/rewards")}>
          <Gift className="h-3.5 w-3.5 mr-1" />
          แลกรางวัล
        </Button>
      </div>
    </div>
  );
}

// ── Points Tab ──
function PointsTab({ myPoints, onViewHistory, onClaimPoints }: { myPoints: any; onViewHistory: () => void; onClaimPoints: () => void }) {

  return (
    <div className="space-y-4">
      {/* QR Code for store */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 text-center">
          <p className="text-sm font-medium mb-3">QR สำหรับสะสมแต้มหน้าร้าน</p>
          <QRCodeDisplay code={`HIBI-CUST-${myPoints?.customerId || ""}`} size={140} label="แสดง QR นี้ให้พนักงานสแกน" />
        </CardContent>
      </Card>

      {/* Points Rate Info */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">อัตราสะสมแต้ม</h3>
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
            <span className="text-sm font-medium text-primary">🍃 Hibi Member</span>
            <span className="text-sm font-bold text-primary">10 บาท = 1 แต้ม</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">ทุกการสั่งซื้อ 10 บาท ได้ 1 แต้ม เท่ากันทุกคน</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onViewHistory}>
          <Clock className="h-3.5 w-3.5 mr-1" /> ประวัติแต้ม
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onClaimPoints}>
          <ArrowRight className="h-3.5 w-3.5 mr-1" /> ขอแต้ม Delivery
        </Button>
      </div>
    </div>
  );
}

// ── Codes Tab ──
function CodesTab({ activeCodes, activeRedemptions }: { activeCodes: any[]; activeRedemptions: any[] }) {
  const allCodes = [
    ...activeCodes.map(c => ({ type: "code" as const, ...c })),
    ...activeRedemptions.map(r => ({ type: "redemption" as const, ...r })),
  ];

  if (allCodes.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <QrCode className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ไม่มีโค้ดที่ใช้งานได้</p>
          <p className="text-xs text-muted-foreground mt-1">โค้ดจากรีวิวและรางวัลจะแสดงที่นี่</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{allCodes.length} โค้ดที่ใช้งานได้</p>
      {allCodes.map((item, idx) => (
        <Card key={`${item.type}-${idx}`} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {item.type === "code" ? (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      item.type === "code" && item.codeType === "RV" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {item.codeType === "RV" ? "รีวิว" : "ชดเชย"}
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-purple-50 text-purple-600">
                      รางวัล: {item.rewardName}
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono font-bold mt-1">
                  {item.type === "code" ? item.code : item.redemptionCode}
                </p>
              </div>
              <span className="text-green-600 bg-green-50 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" /> พร้อมใช้
              </span>
            </div>
            <QRCodeDisplay
              code={item.type === "code" ? item.code : item.redemptionCode}
              size={120}
              label="แสดง QR ที่ร้านเพื่อใช้โค้ด"
            />
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              หมดอายุ: {formatDate(item.expiresAt, { shortYear: true })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Rewards Tab ──
function RewardsTab({ rewards, available, onRedeem }: { rewards: any[]; available: number; onRedeem: () => void }) {
  if (!rewards.length) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <Gift className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">ยังไม่มีรางวัลในขณะนี้</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{rewards.length} รางวัล</p>
        <Button variant="link" size="sm" className="text-xs h-auto p-0" onClick={onRedeem}>
          ดูทั้งหมด <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      </div>
      {rewards.slice(0, 6).map(reward => {
        const CatIcon = CATEGORY_ICONS[reward.category] || Gift;
        const canRedeem = available >= reward.pointsCost;
        const outOfStock = reward.stock !== null && reward.stock <= 0;
        return (
          <Card key={reward.id} className="border-0 shadow-sm overflow-hidden" onClick={onRedeem}>
            <CardContent className="p-0">
              <div className="flex">
                {reward.imageUrl ? (
                  <img src={reward.imageUrl} alt={reward.name} className="w-20 h-20 object-cover flex-shrink-0" />
                ) : (
                  <div className="w-20 h-20 bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <CatIcon className="h-7 w-7 text-primary/30" />
                  </div>
                )}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{reward.name}</p>
                    <span className="text-[10px] text-primary">
                      {CATEGORY_LABELS[reward.category] || reward.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{reward.pointsCost.toLocaleString()} แต้ม</span>
                    {outOfStock ? (
                      <span className="text-[10px] text-red-500 font-medium">หมด</span>
                    ) : !canRedeem ? (
                      <span className="text-[10px] text-muted-foreground">แต้มไม่พอ</span>
                    ) : (
                      <span className="text-[10px] text-green-600 font-medium">แลกได้!</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {rewards.length > 6 && (
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={onRedeem}>
          ดูรางวัลทั้งหมด ({rewards.length} รายการ)
        </Button>
      )}
    </div>
  );
}
