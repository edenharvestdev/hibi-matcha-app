import { trpc } from "@/lib/trpc";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Megaphone, Bell, Tag, PartyPopper, Calendar, Copy, Check, BellRing, BellOff, Mail, MailOpen, X, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";

const TYPE_CONFIG = {
  announcement: { label: "ประกาศ", icon: Bell, color: "bg-blue-100 text-blue-700", border: "border-l-blue-500", envelopeColor: "from-blue-500 to-blue-600" },
  promotion: { label: "โปรโมชัน", icon: Tag, color: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-500", envelopeColor: "from-emerald-500 to-emerald-600" },
  event: { label: "อีเวนต์", icon: PartyPopper, color: "bg-purple-100 text-purple-700", border: "border-l-purple-500", envelopeColor: "from-purple-500 to-purple-600" },
};

const CATEGORIES = [
  { key: "all", label: "ทั้งหมด", icon: Megaphone },
  { key: "announcement", label: "ประกาศ", icon: Bell },
  { key: "promotion", label: "โปรโมชัน", icon: Tag },
  { key: "event", label: "อีเวนต์", icon: PartyPopper },
];

export default function CustomerAnnouncements() {
  const { session, isCustomer } = useHibiAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [openLetterId, setOpenLetterId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const markedRef = useRef(false);
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe } = usePushNotifications();

  const categoryInput = useMemo(() => ({ category: activeCategory === "all" ? undefined : activeCategory }), [activeCategory]);
  const { data: announcements, isLoading } = trpc.announcements.listByCategory.useQuery(categoryInput);
  const markAllRead = trpc.announcements.markAllRead.useMutation({
    onSuccess: () => {
      utils.announcements.unreadCount.invalidate();
    },
  });

  useEffect(() => {
    if (isCustomer && announcements && announcements.length > 0 && !markedRef.current) {
      markedRef.current = true;
      markAllRead.mutate();
    }
  }, [isCustomer, announcements]);

  const autoSubRef = useRef(false);
  useEffect(() => {
    if (isSupported && isCustomer && !isSubscribed && !pushLoading && !autoSubRef.current) {
      autoSubRef.current = true;
      const timer = setTimeout(() => { subscribe(); }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isCustomer, isSubscribed, pushLoading, subscribe]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("คัดลอกโค้ดแล้ว!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      const ok = await unsubscribe();
      if (ok) toast.success("ปิดการแจ้งเตือนแล้ว");
      else toast.error("ไม่สามารถปิดการแจ้งเตือนได้");
    } else {
      const ok = await subscribe();
      if (ok) toast.success("เปิดการแจ้งเตือนแล้ว! คุณจะได้รับข่าวสารใหม่ทันที");
      else toast.error("ไม่สามารถเปิดการแจ้งเตือนได้ กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์");
    }
  };

  const openAnn = announcements?.find(a => a.id === openLetterId);

  return (
    <MobileLayout title="ประกาศ & โปรโมชัน" backPath="/customer" showBack>
      <PremiumPageContent>
      <div className="p-4 space-y-4">
        {/* Header with push notification toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">จดหมายข่าว</h2>
          </div>
          {isSupported && isCustomer && (
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <BellRing className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Switch
                checked={isSubscribed}
                onCheckedChange={handlePushToggle}
                disabled={pushLoading}
              />
            </div>
          )}
        </div>

        {/* Push notification info */}
        {isSupported && isCustomer && !isSubscribed && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-3 flex items-center gap-3">
              <BellRing className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">เปิดรับการแจ้งเตือน</p>
                <p className="text-xs text-muted-foreground">รับข่าวสาร โปรโมชัน และอีเวนต์ใหม่ทันทีแม้ไม่ได้เปิดแอพ</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <CatIcon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !announcements?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>ยังไม่มีจดหมายในหมวดนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => {
              const typeConf = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.announcement;
              const TypeIcon = typeConf.icon;

              return (
                <div
                  key={ann.id}
                  onClick={() => setOpenLetterId(ann.id)}
                  className="cursor-pointer group"
                >
                  {/* Envelope Card */}
                  <div className="relative bg-card rounded-xl border shadow-sm overflow-hidden transition-all group-hover:shadow-md group-active:scale-[0.98]">
                    {/* Envelope flap (triangle top) */}
                    <div className={`h-2 bg-gradient-to-r ${typeConf.envelopeColor}`} />
                    
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Envelope icon */}
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${typeConf.envelopeColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={`text-[10px] ${typeConf.color}`}>
                              <TypeIcon className="h-3 w-3 mr-0.5" />
                              {typeConf.label}
                            </Badge>
                            {ann.isPinned ? <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">สำคัญ</Badge> : null}
                          </div>
                          
                          <h3 className="font-bold text-sm line-clamp-1">{ann.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ann.content}</p>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(ann.startDate)}</span>
                          </div>
                        </div>

                        {/* Open indicator */}
                        <MailOpen className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Letter Dialog - Full screen reading view */}
      <Dialog open={!!openAnn} onOpenChange={(open) => { if (!open) setOpenLetterId(null); }}>
        <DialogContent className="max-w-lg p-0 gap-0 max-h-[90vh] overflow-hidden rounded-xl">
          {openAnn && (() => {
            const typeConf = TYPE_CONFIG[openAnn.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.announcement;
            const TypeIcon = typeConf.icon;
            return (
              <div className="flex flex-col max-h-[90vh]">
                {/* Letter header */}
                <div className={`bg-gradient-to-r ${typeConf.envelopeColor} p-4 text-white relative`}>
                  <button
                    onClick={() => setOpenLetterId(null)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">
                      <TypeIcon className="h-3 w-3 mr-0.5" />
                      {typeConf.label}
                    </Badge>
                    {openAnn.isPinned && <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">สำคัญ</Badge>}
                  </div>
                  <h2 className="font-bold text-lg leading-tight pr-8">{openAnn.title}</h2>
                  <div className="flex items-center gap-1.5 text-xs opacity-80 mt-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(openAnn.startDate)}</span>
                    {openAnn.endDate && (
                      <>
                        <span>—</span>
                        <span>{formatDate(openAnn.endDate)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Letter body */}
                <div className="overflow-y-auto flex-1">
                  {/* Image */}
                  {openAnn.imageUrl && (
                    <img src={openAnn.imageUrl} alt={openAnn.title} className="w-full max-h-60 object-cover" />
                  )}

                  <div className="p-5 space-y-4">
                    {/* Letter-style decorative line */}
                    <div className="flex items-center gap-3 text-muted-foreground/30">
                      <div className="h-px flex-1 bg-current" />
                      <MailOpen className="h-4 w-4" />
                      <div className="h-px flex-1 bg-current" />
                    </div>

                    {/* Content */}
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {openAnn.content}
                    </div>

                    {/* Promo Code */}
                    {openAnn.promoCode && (
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-1.5">โค้ดส่วนลด</p>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xl text-primary tracking-wider">{openAnn.promoCode}</span>
                          <Button variant="outline" size="sm" className="h-8" onClick={() => copyCode(openAnn.promoCode!)}>
                            {copiedCode === openAnn.promoCode ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                            {copiedCode === openAnn.promoCode ? "คัดลอกแล้ว" : "คัดลอก"}
                          </Button>
                        </div>
                        {openAnn.discountText && (
                          <p className="text-xs text-muted-foreground mt-1.5">{openAnn.discountText}</p>
                        )}
                      </div>
                    )}

                    {/* Letter-style closing */}
                    <div className="pt-4 border-t border-dashed">
                      <p className="text-xs text-muted-foreground text-right italic">— Hibi Matcha Team</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
          </PremiumPageContent>
    </MobileLayout>
  );
}
