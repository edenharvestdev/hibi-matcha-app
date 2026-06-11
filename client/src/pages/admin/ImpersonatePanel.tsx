import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useImpersonate } from "@/contexts/ImpersonateContext";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye, Search, UserCog, Users, ShoppingBag, ChevronLeft,
  Building2, Shield, User, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import AdminPageWrapper from "@/components/AdminPageWrapper";

const ROLE_LABELS: Record<string, string> = {
  branch_owner: "เจ้าของสาขา",
  branch_manager: "ผู้จัดการสาขา",
  branch_staff: "พนักงานสาขา",
  area_manager: "เจ้าของแฟรนไชส์",
  support_staff: "เจ้าหน้าที่ซัพพอร์ต",
  super_admin: "Super Admin",
  customer: "ลูกค้า",
};

const ROLE_COLORS: Record<string, string> = {
  branch_owner: "bg-purple-100 text-purple-700",
  branch_manager: "bg-blue-100 text-blue-700",
  branch_staff: "bg-gray-100 text-gray-700",
  area_manager: "bg-orange-100 text-orange-700",
  support_staff: "bg-teal-100 text-teal-700",
  super_admin: "bg-red-100 text-red-700",
  customer: "bg-green-100 text-green-700",
};

export default function ImpersonatePanel() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const { state: impState, startImpersonating } = useImpersonate();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("staff");

  const { data: targets, isLoading } = trpc.impersonate.listTargets.useQuery(undefined, {
    enabled: !!session && isSuperAdmin && !impState.active,
  });

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) {
      toast.error("เฉพาะ Super Admin เท่านั้น");
      setLocation("/admin");
    }
  }, [loading, session, isSuperAdmin, setLocation]);

  const filteredStaff = useMemo(() => {
    if (!targets?.staff) return [];
    if (!search.trim()) return targets.staff;
    const q = search.toLowerCase();
    return targets.staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.role && s.role.toLowerCase().includes(q)) ||
        (s.branchName && s.branchName.toLowerCase().includes(q))
    );
  }, [targets?.staff, search]);

  const filteredCustomers = useMemo(() => {
    if (!targets?.customers) return [];
    if (!search.trim()) return targets.customers;
    const q = search.toLowerCase();
    return targets.customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [targets?.customers, search]);

  const utils = trpc.useUtils();
  const handleImpersonate = async (id: number, type: "staff" | "customer", name: string, role: string) => {
    startImpersonating(id, type, name, role);
    toast.success(`กำลังสวมสิทธิ์เป็น ${name} (${ROLE_LABELS[role] || role})`);
    // Invalidate all cached queries so they refetch with the impersonate header
    await utils.invalidate();
    // Use SPA navigation (no full page reload) to avoid race conditions
    if (role === "customer") {
      setLocation("/customer");
    } else if (["branch_owner", "branch_manager", "branch_staff"].includes(role)) {
      setLocation("/branch");
    } else if (role === "area_manager") {
      setLocation("/branch");
    } else {
      setLocation("/admin");
    }
  };

  if (loading || !session) return null;

  if (impState.active) {
    return (
      <AdminPageWrapper title="โหมดทดสอบ" backPath="/admin" loading={isLoading}>
        <div className="px-4 py-12 text-center">
          <Eye className="h-12 w-12 text-red-500 mx-auto mb-3 animate-pulse" />
          <p className="text-lg font-semibold text-foreground">กำลังสวมสิทธิ์อยู่</p>
          <p className="text-sm text-muted-foreground mt-1">
            คุณกำลังทดสอบในฐานะ <strong>{impState.targetName}</strong> ({ROLE_LABELS[impState.targetRole || ""] || impState.targetRole})
          </p>
          <p className="text-xs text-muted-foreground mt-3">กดปุ่ม "ออก" ที่แถบสีแดงด้านบนเพื่อกลับสู่ Super Admin</p>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="โหมดทดสอบ (Impersonate)" backPath="/admin">
      <div className="space-y-4">
        {/* Header */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <UserCog className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">โหมดทดสอบสิทธิ์</h2>
                <p className="text-xs text-muted-foreground">
                  เลือกพนักงานหรือลูกค้าเพื่อดูระบบในมุมมองของเขา
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, เบอร์โทร, ตำแหน่ง..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="staff" className="flex-1 text-xs">
              <Users className="h-3.5 w-3.5 mr-1" />
              พนักงาน ({targets?.staff?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex-1 text-xs">
              <ShoppingBag className="h-3.5 w-3.5 mr-1" />
              ลูกค้า ({targets?.customers?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="mt-3 space-y-2">
            {isLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">ไม่พบพนักงาน</p>
            ) : (
              filteredStaff.map((s) => (
                <Card key={`staff-${s.id}`} className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{s.name}</span>
                          <Badge variant="secondary" className={`text-[10px] shrink-0 ${ROLE_COLORS[s.role] || ""}`}>
                            {ROLE_LABELS[s.role] || s.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{s.phone}</span>
                          {s.branchName && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {s.branchName}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-xs h-8 border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => handleImpersonate(s.id, "staff", s.name, s.role)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        สวมสิทธิ์
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="customers" className="mt-3 space-y-2">
            {isLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">ไม่พบลูกค้า</p>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((c) => (
                  <Card key={`cust-${c.id}`} className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{c.name}</span>
                            <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700">
                              ลูกค้า
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{c.phone}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 text-xs h-8 border-green-200 text-green-600 hover:bg-green-50"
                          onClick={() => handleImpersonate(c.id, "customer", c.name, "customer")}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          สวมสิทธิ์
                        </Button>
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
