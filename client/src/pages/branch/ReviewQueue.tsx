import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, Clock, CheckCircle2, XCircle, Filter } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { formatDateTime } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/useMobile";

const appLabels: Record<string, string> = { shopee: "Shopee Food", lineman: "LINE MAN", grab: "Grab Food", robinhood: "Robinhood", walkin: "Walk-in" };
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "รออนุมัติ", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "อนุมัติแล้ว", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { label: "ปฏิเสธ", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function ReviewQueue() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff, isAreaManager } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("pending");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  // For area_manager: load assigned branches
  const { data: branches } = trpc.branches.list.useQuery(undefined, { enabled: !!session && isStaff });

  const queryInput = useMemo(() => ({
    status: tab === "all" ? undefined : tab,
    branchId: selectedBranch !== "all" ? Number(selectedBranch) : undefined,
  }), [tab, selectedBranch]);

  const { data: reviews, isLoading } = trpc.reviews.branchQueue.useQuery(
    queryInput,
    { enabled: !!session && isStaff }
  );

  // Build branch name lookup
  const branchMap = useMemo(() => {
    const map: Record<number, string> = {};
    branches?.forEach((b: any) => { map[b.id] = b.name; });
    return map;
  }, [branches]);

  if (loading || !session) return null;

  return (
    <MobileLayout title="รีวิวรออนุมัติ" showBack backPath="/branch">
      <PremiumPageContent>
        {/* Branch Filter — show for area_manager who manages multiple branches */}
        {isAreaManager && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">กรองตามสาขา</span>
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="เลือกสาขา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสาขาที่ดูแล</SelectItem>
                {branches?.map((b: any) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="pending">รออนุมัติ</TabsTrigger>
            <TabsTrigger value="approved">อนุมัติ</TabsTrigger>
            <TabsTrigger value="rejected">ปฏิเสธ</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
            ) : !reviews?.length ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">ไม่มีรายการ</p>
              </div>
            ) : (
              reviews.map((review: any) => {
                const config = statusConfig[review.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                const branchName = branchMap[review.branchId] || `#${review.branchId}`;
                return (
                  <Card
                    key={review.id}
                    className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => setLocation(`/branch/reviews/${review.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{appLabels[review.deliveryApp] || review.deliveryApp}</p>
                          <p className="text-xs text-muted-foreground">Order: {review.orderId}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            สาขา: {branchName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatDateTime(review.createdAt)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${config.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>
                      {review.imageUrl && (
                        <img src={review.imageUrl} alt="Review" className="w-full h-24 object-cover rounded-lg mt-2" />
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </PremiumPageContent>
    </MobileLayout>
  );
}
