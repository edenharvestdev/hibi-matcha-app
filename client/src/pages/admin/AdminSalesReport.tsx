import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Banknote, Smartphone, CreditCard, Truck, Plus,
  ChevronLeft, ChevronRight, Loader2, Building2, BarChart3,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

export default function AdminSalesReport() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [selectedZoneId, setSelectedZoneId] = useState<string>("all");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin && session.role !== "area_manager") {
      toast.error("ไม่มีสิทธิ์เข้าถึง");
      setLocation("/admin");
    }
  }, [loading, session, isSuperAdmin, setLocation]);

  const { data: branches } = trpc.branches.list.useQuery(undefined, { enabled: !!session });
  const { data: zones } = trpc.zones.list.useQuery(undefined, { enabled: !!session && isSuperAdmin });

  // API returns an array of per-branch summaries
  const summaryInput = useMemo(() => ({
    year, month,
    ...(selectedZoneId !== "all" ? { zoneId: parseInt(selectedZoneId) } : {}),
  }), [year, month, selectedZoneId]);
  const { data: branchSummaries, isLoading } = trpc.dailySales.allBranchesSummary.useQuery(
    summaryInput,
    { enabled: !!session && (isSuperAdmin || session.role === "area_manager") }
  );

  const navigateMonth = (direction: number) => {
    let m = month + direction;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const formatCurrency = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  // Filter and aggregate
  const filteredSummaries = useMemo(() => {
    if (!branchSummaries) return [];
    if (selectedBranchId === "all") return branchSummaries;
    return branchSummaries.filter(s => s.branchId === parseInt(selectedBranchId));
  }, [branchSummaries, selectedBranchId]);

  const totals = useMemo(() => {
    if (!filteredSummaries.length) return null;
    return {
      totalCash: filteredSummaries.reduce((sum, s) => sum + Number(s.totalCash), 0),
      totalTransfer: filteredSummaries.reduce((sum, s) => sum + Number(s.totalTransfer), 0),
      totalEdc: filteredSummaries.reduce((sum, s) => sum + Number(s.totalEdc), 0),
      totalDelivery: filteredSummaries.reduce((sum, s) => sum + Number(s.totalDelivery), 0),
      totalExtra: filteredSummaries.reduce((sum, s) => sum + Number(s.totalExtra), 0),
      grandTotal: filteredSummaries.reduce((sum, s) => sum + Number(s.grandTotal), 0),
      totalRecords: filteredSummaries.reduce((sum, s) => sum + Number(s.recordCount), 0),
    };
  }, [filteredSummaries]);

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="รายงานยอดขาย" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-card rounded-xl p-3 shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium">
            {thaiMonths[month - 1]} {year + 543}
          </p>
          <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zone + Branch Filter */}
        <div className="flex gap-2">
          {isSuperAdmin && zones && zones.length > 0 && (
            <Select value={selectedZoneId} onValueChange={(v) => { setSelectedZoneId(v); setSelectedBranchId("all"); }}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="เขต" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกเขต</SelectItem>
                {zones.map((z: any) => (
                  <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className={isSuperAdmin && zones && zones.length > 0 ? "w-1/2" : "w-full"}>
              <SelectValue placeholder="เลือกสาขา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสาขา</SelectItem>
              {branches?.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        ) : !totals ? (
          <div className="text-center py-12">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลยอดขายในเดือนนี้</p>
          </div>
        ) : (
          <>
            {/* Grand Total */}
            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  ยอดรวม{selectedBranchId === "all" ? "ทุกสาขา" : ""}
                </p>
                <p className="text-2xl font-bold text-primary">
                  ฿{formatCurrency(totals.grandTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totals.totalRecords} วันที่บันทึก
                </p>
              </CardContent>
            </Card>

            {/* Channel Breakdown */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">แยกตามช่องทาง</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-green-100 flex items-center justify-center">
                        <Banknote className="h-3.5 w-3.5 text-green-700" />
                      </div>
                      <span className="text-sm">เงินสด</span>
                    </div>
                    <span className="text-sm font-medium">฿{formatCurrency(totals.totalCash)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-blue-100 flex items-center justify-center">
                        <Smartphone className="h-3.5 w-3.5 text-blue-700" />
                      </div>
                      <span className="text-sm">โอน</span>
                    </div>
                    <span className="text-sm font-medium">฿{formatCurrency(totals.totalTransfer)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-purple-100 flex items-center justify-center">
                        <CreditCard className="h-3.5 w-3.5 text-purple-700" />
                      </div>
                      <span className="text-sm">EDC</span>
                    </div>
                    <span className="text-sm font-medium">฿{formatCurrency(totals.totalEdc)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-md bg-orange-100 flex items-center justify-center">
                        <Truck className="h-3.5 w-3.5 text-orange-700" />
                      </div>
                      <span className="text-sm">Delivery</span>
                    </div>
                    <span className="text-sm font-medium">฿{formatCurrency(totals.totalDelivery)}</span>
                  </div>
                  {totals.totalExtra > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-gray-100 flex items-center justify-center">
                          <Plus className="h-3.5 w-3.5 text-gray-700" />
                        </div>
                        <span className="text-sm">ช่องทางอื่น</span>
                      </div>
                      <span className="text-sm font-medium">฿{formatCurrency(totals.totalExtra)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Per-Branch Breakdown */}
            {selectedBranchId === "all" && filteredSummaries.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-primary" />
                    แยกตามสาขา
                  </p>
                  <div className="space-y-2">
                    {filteredSummaries.map((b) => (
                      <div key={b.branchId} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{b.branchName}</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {b.recordCount} วัน
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          ฿{formatCurrency(Number(b.grandTotal))}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminPageWrapper>
  );
}
