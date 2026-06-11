import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart3, Eye, Users, Megaphone, TrendingUp, MapPin, BookOpen, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

const TYPE_LABELS: Record<string, string> = {
  announcement: "ประกาศ",
  promotion: "โปรโมชัน",
  event: "อีเวนต์",
};

const TYPE_COLORS: Record<string, string> = {
  announcement: "bg-blue-100 text-blue-700",
  promotion: "bg-green-100 text-green-700",
  event: "bg-purple-100 text-purple-700",
};

export default function AnnouncementAnalytics() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) setLocation("/admin");
  }, [loading, session, isSuperAdmin, setLocation]);

  // Fetch all announcements first to get IDs
  const { data: announcements, isLoading: announcementsLoading } = trpc.announcements.listAll.useQuery(
    undefined,
    { enabled: !!session && isSuperAdmin }
  );

  const announcementIds = useMemo(
    () => (announcements as any[])?.map((a: any) => a.id) ?? [],
    [announcements]
  );

  // Fetch read stats using announcement IDs
  const { data: readStats } = trpc.announcements.readStats.useQuery(
    { announcementIds },
    { enabled: announcementIds.length > 0 }
  );

  // Fetch reader detail for selected announcement
  const { data: readDetail, isLoading: detailLoading } = trpc.announcements.readDetail.useQuery(
    { announcementId: selectedId! },
    { enabled: !!selectedId }
  );

  if (loading || !session) return null;

  // Build read count map
  const readCountMap = new Map(
    (readStats as any[])?.map((s: any) => [s.announcementId, Number(s.readCount)]) ?? []
  );

  // Calculate overall stats
  const totalAnnouncements = announcementIds.length;
  const totalReads = (readStats as any[])?.reduce((sum: number, s: any) => sum + Number(s.readCount || 0), 0) ?? 0;

  return (
    <AdminPageWrapper title="สถิติการอ่านประกาศ" backPath="/admin/announcements" loading={announcementsLoading}>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5" />
            <p className="font-bold text-lg">Announcement Analytics</p>
          </div>
          <p className="text-sm opacity-90">ดูสถิติการอ่านประกาศของลูกค้า</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Megaphone className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-xl font-bold">{totalAnnouncements}</p>
              <p className="text-[10px] text-muted-foreground">ประกาศทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Eye className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-xl font-bold">{totalReads}</p>
              <p className="text-[10px] text-muted-foreground">การอ่านรวม</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-xl font-bold">{(readStats as any[])?.length ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">ประกาศที่มีคนอ่าน</p>
            </CardContent>
          </Card>
        </div>

        {/* Announcement List with Read Stats */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">รายละเอียดแต่ละประกาศ</h3>
          {announcementsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !announcements || (announcements as any[]).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">ยังไม่มีประกาศ</div>
          ) : (
            (announcements as any[]).map((ann: any) => {
              const readers = readCountMap.get(ann.id) ?? 0;
              return (
                <Dialog key={ann.id} onOpenChange={(open) => { if (open) setSelectedId(ann.id); else setSelectedId(null); }}>
                  <DialogTrigger asChild>
                    <Card className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge className={`text-[10px] ${TYPE_COLORS[ann.type] || "bg-gray-100 text-gray-700"}`}>
                                {TYPE_LABELS[ann.type] || ann.type}
                              </Badge>
                              {!ann.isActive && <Badge variant="outline" className="text-[10px] text-red-500">ปิดแล้ว</Badge>}
                              {ann.branchId && (
                                <Badge variant="outline" className="text-[10px]">
                                  <MapPin className="h-2.5 w-2.5 mr-0.5" />สาขา #{ann.branchId}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-sm truncate">{ann.title}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(ann.startDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                            </p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <div className="flex items-center gap-1 text-indigo-600">
                              <BookOpen className="h-4 w-4" />
                              <p className="text-lg font-bold">{readers}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground">คนอ่าน</p>
                          </div>
                        </div>
                        {/* Simple bar indicator */}
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                          <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${Math.min(readers * 5, 100)}%` }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-indigo-600" />
                        ผู้อ่าน: {ann.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-muted-foreground">
                        ทั้งหมด {readers} คน
                      </p>
                      {detailLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : !readDetail || (readDetail as any[]).length === 0 ? (
                        <p className="text-center py-4 text-muted-foreground text-sm">ยังไม่มีคนอ่าน</p>
                      ) : (
                        (readDetail as any[]).map((r: any, i: number) => (
                          <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                                {i + 1}
                              </div>
                              <span className="text-sm">ลูกค้า #{r.customerId}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {r.readAt ? new Date(r.readAt).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })
          )}
        </div>
      </div>
    </AdminPageWrapper>
  );
}
