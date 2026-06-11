import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { toast } from "sonner";
import { useEffect } from "react";
import { Loader2, Bell, BellOff, CheckCheck, Star, AlertTriangle, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

const TYPE_CONFIG: Record<string, { icon: typeof Star; color: string; bg: string }> = {
  new_review: { icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
  new_point_claim: { icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
  new_order_issue: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
};

export default function StaffNotificationList() {
  const { session, loading, isAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
  }, [loading, session, isAdmin, setLocation]);

  const { data: notifications, isLoading, refetch } = trpc.staffNotifications.list.useQuery(undefined, { enabled: !!session && isAdmin });
  const markReadMut = trpc.staffNotifications.markRead.useMutation({
    onSuccess: () => refetch(),
  });
  const markAllReadMut = trpc.staffNotifications.markAllRead.useMutation({
    onSuccess: () => { toast.success("อ่านทั้งหมดแล้ว"); refetch(); },
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markReadMut.mutate({ id: n.id });
    // Navigate based on type
    if (n.relatedEntity === "review_request" && n.relatedEntityId) {
      setLocation(`/admin/reviews/${n.relatedEntityId}`);
    } else if (n.relatedEntity === "point_claim") {
      setLocation("/admin/point-claims");
    }
  };

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="การแจ้งเตือน" backPath="/admin" loading={isLoading}>
      <div className="px-4 py-6 space-y-4">
        {/* Header with mark all read */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">การแจ้งเตือน</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMut.mutate()}
              disabled={markAllReadMut.isPending}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              อ่านทั้งหมด
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BellOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีการแจ้งเตือน</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => {
              const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.new_review;
              const Icon = config.icon;
              const timeAgo = getTimeAgo(new Date(n.createdAt));
              return (
                <Card
                  key={n.id}
                  className={`border-0 shadow-sm cursor-pointer transition-colors ${!n.isRead ? "bg-blue-50/50 border-l-4 border-l-primary" : ""}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="h-2 w-2 bg-primary rounded-full shrink-0" />}
                        </div>
                        {n.message && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "เมื่อสักครู่";
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return formatDate(date, { shortYear: true });
}
