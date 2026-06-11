import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Users, Gift, Coins, TrendingUp, MapPin, Trophy, ArrowLeft, QrCode, Star, Ticket } from "lucide-react";
import { useEffect, useState } from "react";

export default function MarketingDashboard() {
  const { session, loading, isSuperAdmin, isAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) setLocation("/admin");
  }, [loading, session, isSuperAdmin, setLocation]);

  const { data: codeStats, isLoading: loadingCodes } = trpc.marketingDashboard.codeStats.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: pointsStats, isLoading: loadingPoints } = trpc.marketingDashboard.pointsStats.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: topCustomers } = trpc.marketingDashboard.topCustomers.useQuery(
    { branchId: selectedBranch !== "all" ? Number(selectedBranch) : undefined, limit: 10 },
    { enabled: !!session && isSuperAdmin }
  );
  const { data: topRedeemers } = trpc.marketingDashboard.topRedeemers.useQuery(
    { branchId: selectedBranch !== "all" ? Number(selectedBranch) : undefined, limit: 10 },
    { enabled: !!session && isSuperAdmin }
  );
  const { data: rewardStats } = trpc.marketingDashboard.rewardRedemptions.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: branches } = trpc.branches.list.useQuery(undefined, { enabled: !!session && isSuperAdmin });

  if (loading || !session) return null;

  // Calculate totals from code stats
  const totalCodes = (codeStats as any[])?.reduce((sum: number, b: any) => sum + Number(b.totalCodes || 0), 0) ?? 0;
  const totalRedeemed = (codeStats as any[])?.reduce((sum: number, b: any) => sum + Number(b.redeemedCodes || 0), 0) ?? 0;
  const totalIssued = (codeStats as any[])?.reduce((sum: number, b: any) => sum + Number(b.issuedCodes || 0), 0) ?? 0;
  const redemptionRate = totalCodes > 0 ? ((totalRedeemed / totalCodes) * 100).toFixed(1) : "0";

  // Calculate totals from points stats
  const totalPointCustomers = (pointsStats as any[])?.reduce((sum: number, b: any) => sum + Number(b.totalCustomers || 0), 0) ?? 0;
  const totalLifetimePoints = (pointsStats as any[])?.reduce((sum: number, b: any) => sum + Number(b.totalLifetimePoints || 0), 0) ?? 0;
  const totalActivePoints = (pointsStats as any[])?.reduce((sum: number, b: any) => sum + Number(b.totalActivePoints || 0), 0) ?? 0;

  return (
    <AdminPageWrapper title="Marketing Dashboard" backPath="/admin" loading={loadingCodes}>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5" />
            <p className="font-bold text-lg">Marketing Dashboard</p>
          </div>
          <p className="text-sm opacity-90">วิเคราะห์คูปอง แต้มสะสม และพฤติกรรมลูกค้าตามสาขา</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 mb-2">
                <QrCode className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{totalCodes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">โค้ดทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-green-50 text-green-600 mb-2">
                <Gift className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{redemptionRate}%</p>
              <p className="text-xs text-muted-foreground">อัตราการใช้โค้ด</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600 mb-2">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{totalPointCustomers.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">ลูกค้าสะสมแต้ม</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 mb-2">
                <Coins className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{totalActivePoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">แต้มคงเหลือรวม</p>
            </CardContent>
          </Card>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="เลือกสาขา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสาขา</SelectItem>
              {(branches as any[])?.map((b: any) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="codes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="codes">คูปอง</TabsTrigger>
            <TabsTrigger value="points">แต้มสะสม</TabsTrigger>
            <TabsTrigger value="rewards">รางวัล</TabsTrigger>
          </TabsList>

          {/* ── Codes Tab ── */}
          <TabsContent value="codes" className="space-y-4 mt-4">
            <h3 className="font-semibold text-sm text-muted-foreground">สถิติโค้ดตามสาขา</h3>
            {loadingCodes ? (
              <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
            ) : (codeStats as any[])?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="space-y-3">
                {(codeStats as any[])
                  ?.filter((b: any) => selectedBranch === "all" || String(b.branchId) === selectedBranch)
                  .map((b: any) => {
                    const total = Number(b.totalCodes || 0);
                    const redeemed = Number(b.redeemedCodes || 0);
                    const issued = Number(b.issuedCodes || 0);
                    const rate = total > 0 ? ((redeemed / total) * 100).toFixed(0) : "0";
                    return (
                      <Card key={b.branchId} className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-medium text-sm">{b.branchName}</p>
                            <Badge variant="secondary" className="text-xs">{rate}% ใช้แล้ว</Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                              <p className="text-lg font-bold text-blue-600">{total}</p>
                              <p className="text-[10px] text-muted-foreground">ทั้งหมด</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-amber-600">{issued}</p>
                              <p className="text-[10px] text-muted-foreground">ออกแล้ว</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-green-600">{redeemed}</p>
                              <p className="text-[10px] text-muted-foreground">ใช้แล้ว</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-red-600">{Number(b.expiredCodes || 0)}</p>
                              <p className="text-[10px] text-muted-foreground">หมดอายุ</p>
                            </div>
                          </div>
                          {/* Code type breakdown */}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-[10px]">รีวิว: {Number(b.reviewCodes || 0)}</Badge>
                            <Badge variant="outline" className="text-[10px]">ชดเชย: {Number(b.claimCodes || 0)}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}

            {/* Top Code Redeemers */}
            <h3 className="font-semibold text-sm text-muted-foreground mt-6">ลูกค้าที่ใช้โค้ดมากสุด</h3>
            {(topRedeemers as any[])?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="space-y-2">
                {(topRedeemers as any[])?.map((c: any, i: number) => (
                  <Card key={`${c.customerId}-${c.branchId}`} className="border-0 shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-yellow-100 text-yellow-700" :
                        i === 1 ? "bg-gray-100 text-gray-700" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-slate-50 text-slate-600"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.customerName}</p>
                        <p className="text-[10px] text-muted-foreground">{c.branchName} • {c.customerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{Number(c.totalRedeemed)}</p>
                        <p className="text-[10px] text-muted-foreground">โค้ด</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Points Tab ── */}
          <TabsContent value="points" className="space-y-4 mt-4">
            <h3 className="font-semibold text-sm text-muted-foreground">แต้มสะสมตามสาขา</h3>
            {loadingPoints ? (
              <div className="text-center py-8 text-muted-foreground">กำลังโหลด...</div>
            ) : (pointsStats as any[])?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="space-y-3">
                {(pointsStats as any[])
                  ?.filter((b: any) => selectedBranch === "all" || String(b.branchId) === selectedBranch)
                  .map((b: any) => (
                    <Card key={b.branchId} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-medium text-sm">{b.branchName}</p>
                          <Badge variant="secondary" className="text-xs">{Number(b.totalCustomers || 0)} ลูกค้า</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-purple-600">{Number(b.totalActivePoints || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">แต้มคงเหลือ</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-green-600">{Number(b.totalLifetimePoints || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">แต้มสะสมรวม</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-amber-600">{Number(b.totalUsedPoints || 0).toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">แต้มที่ใช้ไป</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground text-center">
                          เฉลี่ย {Number(b.avgLifetimePoints || 0).toFixed(0)} แต้ม/คน
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Top Customers by Points */}
            <h3 className="font-semibold text-sm text-muted-foreground mt-6">ลูกค้าแต้มสะสมสูงสุด</h3>
            {(topCustomers as any[])?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="space-y-2">
                {(topCustomers as any[])?.map((c: any, i: number) => (
                  <Card key={`${c.customerId}-${c.branchId}`} className="border-0 shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? "bg-yellow-100 text-yellow-700" :
                        i === 1 ? "bg-gray-100 text-gray-700" :
                        i === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-slate-50 text-slate-600"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.customerName}</p>
                        <p className="text-[10px] text-muted-foreground">{c.branchName} • {c.customerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{Number(c.lifetimePoints).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">แต้มสะสม</p>
                        <p className="text-[10px] text-green-600">คงเหลือ {Number(c.activePoints).toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Rewards Tab ── */}
          <TabsContent value="rewards" className="space-y-4 mt-4">
            <h3 className="font-semibold text-sm text-muted-foreground">การแลกรางวัลตามสาขา</h3>
            {(rewardStats as any[])?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">ยังไม่มีข้อมูล</div>
            ) : (
              <div className="space-y-3">
                {(rewardStats as any[])
                  ?.filter((b: any) => selectedBranch === "all" || String(b.branchId) === selectedBranch)
                  .map((b: any) => (
                    <Card key={b.branchId} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-medium text-sm">{b.branchName}</p>
                          <Badge variant="secondary" className="text-xs">{Number(b.totalRedemptions || 0)} ครั้ง</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-blue-600">{Number(b.totalRedemptions || 0)}</p>
                            <p className="text-[10px] text-muted-foreground">แลกทั้งหมด</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-green-600">{Number(b.usedRedemptions || 0)}</p>
                            <p className="text-[10px] text-muted-foreground">ใช้แล้ว</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-amber-600">{Number(b.pendingRedemptions || 0)}</p>
                            <p className="text-[10px] text-muted-foreground">รอใช้</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground text-center">
                          ใช้แต้มไป {Number(b.totalPointsSpent || 0).toLocaleString()} แต้ม
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageWrapper>
  );
}
