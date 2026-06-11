import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ClipboardList, QrCode, Gift, ChevronRight, Coins, AlertTriangle, Ticket, Megaphone, ShoppingBag, Package, HelpCircle, Mail, Bell, Tag, PartyPopper, Calendar, ChevronLeft, BellRing, X, Link2 } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import ConsentPopup from "@/components/ConsentPopup";
import OnboardingPopup, { useOnboarding } from "@/components/OnboardingPopup";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { formatDate } from "@/lib/dateUtils";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029164707/lBgSgkEWqcVXTljA.jpeg";

const ANN_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgGradient: string }> = {
  announcement: { label: "ประกาศ", icon: Bell, color: "text-blue-600", bgGradient: "from-blue-500 to-blue-600" },
  promotion: { label: "โปรโมชัน", icon: Tag, color: "text-emerald-600", bgGradient: "from-emerald-500 to-emerald-600" },
  event: { label: "อีเวนต์", icon: PartyPopper, color: "text-purple-600", bgGradient: "from-purple-500 to-purple-600" },
};

export default function CustomerHome() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isCustomer) {
      if (["branch_owner", "branch_manager", "branch_staff"].includes(session.role)) setLocation("/branch");
      else setLocation("/admin");
    }
  }, [loading, session, isCustomer, setLocation]);

  const { data: myRequests } = trpc.reviews.myRequests.useQuery(undefined, { enabled: !!session });
  const { data: myCodes } = trpc.reviews.myCodes.useQuery(undefined, { enabled: !!session });
  const { data: myPoints } = trpc.loyalty.myPoints.useQuery(undefined, { enabled: !!session });
  const { data: consentStatus, refetch: refetchConsent } = trpc.consent.check.useQuery(undefined, { enabled: !!session && isCustomer });
  const { data: myFreeDrinkCodes } = trpc.freeDrinkCodes.myCodes.useQuery(undefined, { enabled: !!session && isCustomer });
  const { data: unreadData } = trpc.announcements.unreadCount.useQuery(undefined, { enabled: !!session && isCustomer });
  const { data: latestAnnouncements } = trpc.announcements.listByCategory.useQuery({ category: undefined }, { enabled: !!session && isCustomer });
  const unreadAnnouncementCount = unreadData?.count ?? 0;
  const [consentDismissed, setConsentDismissed] = useState(false);
  const { shouldShow: shouldShowOnboarding } = useOnboarding();
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // Push notification — auto-request permission on first load
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, isLoading: pushLoading, subscribe: pushSubscribe } = usePushNotifications();
  const autoSubRef2 = useRef(false);
  useEffect(() => {
    if (pushSupported && isCustomer && !pushSubscribed && !pushLoading && !autoSubRef2.current) {
      autoSubRef2.current = true;
      // Small delay to let the page render first, then auto-request permission
      const timer = setTimeout(() => { pushSubscribe(); }, 800);
      return () => clearTimeout(timer);
    }
  }, [pushSupported, isCustomer, pushSubscribed, pushLoading, pushSubscribe]);

  // Announcement carousel state
  const [currentAnnIdx, setCurrentAnnIdx] = useState(0);
  const topAnnouncements = latestAnnouncements?.slice(0, 5) ?? [];
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    if (topAnnouncements.length > 1) {
      autoPlayRef.current = setInterval(() => {
        setCurrentAnnIdx(prev => (prev + 1) % topAnnouncements.length);
      }, 5000);
    }
  }, [topAnnouncements.length]);

  useEffect(() => {
    startAutoPlay();
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [startAutoPlay]);

  if (loading || !session) return null;

  const showConsent = consentStatus && !consentStatus.allAccepted && !consentDismissed;

  const pendingCount = myRequests?.filter(r => r.status === "pending").length ?? 0;
  const activeCodesCount = myCodes?.filter(c => c.status === "issued" && new Date(c.expiresAt) > new Date()).length ?? 0;
  const activeFreeDrinkCount = myFreeDrinkCodes?.filter(c => c.status === "issued" && new Date(c.expiresAt) > new Date()).length ?? 0;

  const availablePoints = myPoints ? myPoints.totalPoints - myPoints.usedPoints : 0;

  const menuItems = [
    {
      icon: Coins,
      label: "แต้มสะสม",
      desc: `${availablePoints > 0 ? `${availablePoints.toLocaleString()} แต้มพร้อมใช้` : "สะสมแต้มจากการซื้อ"}`,
      path: "/customer/my-points",
      color: "bg-purple-50 text-purple-600",
      badge: availablePoints > 0 ? availablePoints : undefined,
    },
    {
      icon: Star,
      label: "ส่งรีวิวรับโค้ดฟรี",
      desc: "สั่ง 1 ออเดอร์ รีวิวรับ 1 โค้ดเครื่องดื่มฟรี",
      path: "/customer/submit-review",
      color: "bg-amber-50 text-amber-600",
    },
    {
      icon: ClipboardList,
      label: "คำขอของฉัน",
      desc: `${pendingCount > 0 ? `${pendingCount} รายการรออนุมัติ` : "ดูสถานะคำขอทั้งหมด"}`,
      path: "/customer/my-requests",
      color: "bg-blue-50 text-blue-600",
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    {
      icon: QrCode,
      label: "โค้ดของฉัน",
      desc: `${activeCodesCount > 0 ? `${activeCodesCount} โค้ดพร้อมใช้งาน` : "ดูโค้ดทั้งหมด"}`,
      path: "/customer/my-codes",
      color: "bg-green-50 text-green-600",
      badge: activeCodesCount > 0 ? activeCodesCount : undefined,
    },
    {
      icon: Ticket,
      label: "โค้ดแก้วแถม",
      desc: `${activeFreeDrinkCount > 0 ? `${activeFreeDrinkCount} โค้ดพร้อมใช้` : "ดูโค้ดแก้วแถมทั้งหมด"}`,
      path: "/customer/free-drinks",
      color: "bg-teal-50 text-teal-600",
      badge: activeFreeDrinkCount > 0 ? activeFreeDrinkCount : undefined,
    },
    {
      icon: AlertTriangle,
      label: "แจ้งปัญหาออเดอร์",
      desc: "ออเดอร์ไม่สมบูรณ์? แจ้งปัญหาได้ที่นี่",
      path: "/customer/report-issue",
      color: "bg-red-50 text-red-600",
    },
    {
      icon: Megaphone,
      label: "ประกาศ & โปรโมชัน",
      desc: unreadAnnouncementCount > 0 ? `${unreadAnnouncementCount} รายการใหม่ยังไม่ได้อ่าน` : "ข่าวสาร โปรโมชัน และอีเวนต์ล่าสุด",
      path: "/customer/announcements",
      color: "bg-pink-50 text-pink-600",
      badge: unreadAnnouncementCount > 0 ? unreadAnnouncementCount : undefined,
    },
    {
      icon: ShoppingBag,
      label: "ร้านค้า Hibi Shop",
      desc: "สั่งซื้อสินค้า ชา มัทฉะ ปลีก-ส่ง",
      path: "/customer/shop",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: Package,
      label: "คำสั่งซื้อของฉัน",
      desc: "ดูสถานะคำสั่งซื้อทั้งหมด",
      path: "/customer/orders",
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      icon: HelpCircle,
      label: "วิธีใช้งาน / FAQ",
      desc: "คู่มือการใช้โค้ด แต้มสะสม และแลกรางวัล",
      path: "/customer/how-to-use",
      color: "bg-cyan-50 text-cyan-600",
    },
    ...(import.meta.env.VITE_ENABLE_OAUTH === "true" ? [{
      icon: Link2,
      label: "บัญชีที่เชื่อมต่อ",
      desc: "เชื่อมต่อ Google, Facebook, LINE",
      path: "/customer/connected-accounts",
      color: "bg-violet-50 text-violet-600",
    }] : []),
  ];

  return (
    <MobileLayout title="Hibi Matcha">
      {showConsent && (
        <ConsentPopup onAccepted={() => { setConsentDismissed(true); refetchConsent(); }} />
      )}
      {!showConsent && shouldShowOnboarding && !onboardingDismissed && (
        <OnboardingPopup onClose={() => setOnboardingDismissed(true)} />
      )}
      <PremiumPageContent>
      <div className="space-y-6">
        {/* Announcement Banner Carousel - TOP */}
        {topAnnouncements.length > 0 && (
          <div className="relative">
            <div className="overflow-hidden rounded-2xl">
              {topAnnouncements.map((ann, idx) => {
                const typeConf = ANN_TYPE_CONFIG[ann.type] || ANN_TYPE_CONFIG.announcement;
                const TypeIcon = typeConf.icon;
                return (
                  <div
                    key={ann.id}
                    className={`transition-all duration-500 ${idx === currentAnnIdx ? "block" : "hidden"}`}
                    onClick={() => setLocation("/customer/announcements")}
                  >
                    <div className={`bg-gradient-to-br ${typeConf.bgGradient} p-4 text-white cursor-pointer relative overflow-hidden`}>
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-4 -translate-x-4" />
                      
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 opacity-80" />
                          <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">
                            <TypeIcon className="h-3 w-3 mr-0.5" />
                            {typeConf.label}
                          </Badge>
                          {ann.isPinned && <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">สำคัญ</Badge>}
                        </div>
                        <h3 className="font-bold text-sm line-clamp-1">{ann.title}</h3>
                        <p className="text-xs opacity-80 line-clamp-2 mt-1">{ann.content}</p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1 text-[10px] opacity-70">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(ann.startDate)}</span>
                          </div>
                          <span className="text-[10px] opacity-70 flex items-center gap-1">
                            อ่านเพิ่มเติม <ChevronRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Dots indicator */}
            {topAnnouncements.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {topAnnouncements.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentAnnIdx(idx); startAutoPlay(); }}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentAnnIdx ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-[#556B2F] to-[#8FA28B] rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <img src={LOGO_URL} alt="Hibi" className="h-10 w-10 rounded-full border-2 border-white/30 object-cover" />
              <div>
                <p className="text-sm opacity-90">สวัสดี 👋</p>
                <p className="font-bold text-lg">{session.name}</p>
              </div>
            </div>
            <p className="text-sm opacity-80 mt-2">
              รีวิวออเดอร์ของคุณเพื่อรับโค้ดเครื่องดื่มฟรี!
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm cursor-pointer bg-white/70 backdrop-blur-sm border-[#e8ede5]/60 hover:shadow-md transition-all" onClick={() => setLocation("/customer/my-points")}>
            <CardContent className="p-3 text-center">
              <Coins className="h-5 w-5 text-purple-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-purple-500">{availablePoints.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">แต้มสะสม</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm cursor-pointer bg-white/70 backdrop-blur-sm border-[#e8ede5]/60 hover:shadow-md transition-all" onClick={() => setLocation("/customer/my-codes")}>
            <CardContent className="p-3 text-center">
              <Gift className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-primary">{activeCodesCount}</p>
              <p className="text-[10px] text-muted-foreground">โค้ดพร้อมใช้</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm cursor-pointer bg-white/70 backdrop-blur-sm border-[#e8ede5]/60 hover:shadow-md transition-all" onClick={() => setLocation("/customer/my-requests")}>
            <CardContent className="p-3 text-center">
              <ClipboardList className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-500">{pendingCount}</p>
              <p className="text-[10px] text-muted-foreground">รออนุมัติ</p>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] bg-white/70 backdrop-blur-sm border-[#e8ede5]/60"
              onClick={() => setLocation(item.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{item.label}</p>
                      {item.badge && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How it works */}
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm border-[#e8ede5]/60">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">วิธีรับโค้ดฟรี</h3>
            <div className="space-y-3">
              {[
                { step: "1", text: "สั่งเครื่องดื่มผ่าน Shopee, Lineman หรือ Grab" },
                { step: "2", text: "รีวิวออเดอร์พร้อมแนบรูปภาพ" },
                { step: "3", text: "รอการอนุมัติ (2-4 วันทำการ)" },
                { step: "4", text: "รับโค้ดฟรี! ใส่โค้ดในช่องหมายเหตุเมื่อสั่งครั้งถัดไป" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </PremiumPageContent>
    </MobileLayout>
  );
}
