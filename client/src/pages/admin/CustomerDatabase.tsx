import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Phone, Mail, Star, QrCode, CalendarDays, UserPlus, TrendingUp, MapPin, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/dateUtils";

export default function CustomerDatabase() {
  const { session, loading, isSuperAdmin, canViewCustomers } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !canViewCustomers) { toast.error("ไม่มีสิทธิ์ดูข้อมูลลูกค้า"); setLocation("/admin"); }
  }, [loading, session, canViewCustomers, setLocation]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: customers, isLoading } = trpc.customerDb.list.useQuery(
    { search: debouncedSearch || undefined, branchId: branchFilter },
    { enabled: !!session && canViewCustomers }
  );

  const { data: stats } = trpc.customerDb.stats.useQuery(undefined, {
    enabled: !!session && canViewCustomers,
  });

  const { data: branchesList } = trpc.branches.list.useQuery(undefined, {
    enabled: !!session && canViewCustomers,
  });

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="ข้อมูลลูกค้า" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-xl font-bold">{stats?.totalCustomers ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">ลูกค้าทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-xl font-bold">{stats?.newToday ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">สมัครวันนี้</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-xl font-bold">{stats?.newThisWeek ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">สมัคร 7 วันล่าสุด</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <p className="text-xl font-bold">{stats?.newThisMonth ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">สมัครเดือนนี้</p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Branch Filter */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ, เบอร์โทร, อีเมล..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={branchFilter ? String(branchFilter) : "all"}
            onValueChange={(val) => setBranchFilter(val === "all" ? undefined : Number(val))}
          >
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="ทุกสาขา" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสาขา</SelectItem>
              {branchesList?.map((b: any) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Customer Count */}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            {isLoading ? "กำลังโหลด..." : `พบ ${customers?.length ?? 0} รายการ`}
          </p>
        </div>

        {/* Customer List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
        ) : !customers?.length ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search || branchFilter ? "ไม่พบลูกค้าที่ค้นหา" : "ยังไม่มีลูกค้าลงทะเบียน"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((c: any) => (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{c.name}</p>
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-muted text-muted-foreground">
                          #{c.id}
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" /> {c.phone}
                        </p>
                        {c.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Mail className="h-3 w-3 shrink-0" /> {c.email}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CalendarDays className="h-3 w-3 shrink-0" /> สมัคร {formatDateTime(c.createdAt)}
                        </p>
                        {/* Branch Info */}
                        {c.primaryBranchName ? (
                          <p className="text-xs flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0 text-green-600" />
                            <span className="text-green-700 font-medium">{c.primaryBranchName}</span>
                            {c.branchNames && c.branchNames.includes(",") && (
                              <span className="text-muted-foreground text-[10px]">
                                (+{c.branchNames.split(",").length - 1} สาขา)
                              </span>
                            )}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 shrink-0" /> ยังไม่มีข้อมูลสาขา
                          </p>
                        )}
                        {/* Show all branches if more than 1 */}
                        {c.branchNames && c.branchNames.includes(",") && (
                          <p className="text-[10px] text-muted-foreground ml-4.5 pl-0.5">
                            สาขาทั้งหมด: {c.branchNames}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs">
                        <span className="font-medium">{c.approvedReviews}</span>
                        <span className="text-muted-foreground">/{c.totalReviews} รีวิว</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs">
                        <span className="font-medium">{c.redeemedCodes}</span>
                        <span className="text-muted-foreground">/{c.totalCodes} โค้ด</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
