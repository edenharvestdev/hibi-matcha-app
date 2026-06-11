import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, Search, Pencil, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  issued: { label: "พร้อมใช้", color: "bg-blue-100 text-blue-700", icon: Clock },
  redeemed: { label: "ใช้แล้ว", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  expired: { label: "หมดอายุ", color: "bg-gray-100 text-gray-600", icon: XCircle },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

const TYPE_LABELS: Record<string, string> = {
  RV: "Review Reward",
  CL: "Claim Compensation",
};

export default function CodeList() {
  const { session, loading, isAdmin, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
  }, [loading, session, isAdmin, setLocation]);

  const { data: codes, isLoading } = trpc.codes.branchCodes.useQuery(undefined, { enabled: !!session });

  const filteredCodes = useMemo(() => {
    if (!codes) return [];
    return codes.filter((c: any) => {
      // Status filter
      if (statusFilter !== "all") {
        const isExpired = c.expiresAt && new Date() > new Date(c.expiresAt) && c.status === "issued";
        const effectiveStatus = isExpired ? "expired" : c.status;
        if (effectiveStatus !== statusFilter) return false;
      }
      // Type filter
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      // Search
      if (search) {
        const q = search.toLowerCase();
        return (
          c.code?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.claimMenuName?.toLowerCase().includes(q) ||
          c.compensationMenuName?.toLowerCase().includes(q) ||
          c.claimOrderId?.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a: any, b: any) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }, [codes, search, statusFilter, typeFilter]);

  if (loading || !session) return null;

  const basePath = isSuperAdmin ? "/admin" : "/branch";

  return (
    <AdminPageWrapper title="รายการโค้ดทั้งหมด" backPath="/admin" loading={isLoading}>
      <div className="px-4 py-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาโค้ด, อีเมล, เบอร์, เมนู, เลขออเดอร์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3 w-3 mr-1" />
          ตัวกรอง
          {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
        </Button>

        {showFilters && (
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="issued">พร้อมใช้</SelectItem>
                <SelectItem value="redeemed">ใช้แล้ว</SelectItem>
                <SelectItem value="expired">หมดอายุ</SelectItem>
                <SelectItem value="cancelled">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="RV">Review (RV)</SelectItem>
                <SelectItem value="CL">Claim (CL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Summary */}
        <p className="text-xs text-muted-foreground">
          แสดง {filteredCodes.length} จาก {codes?.length ?? 0} รายการ
        </p>

        {/* Code List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCodes.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <QrCode className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">ไม่พบโค้ด</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredCodes.map((code: any) => {
              const isExpired = code.expiresAt && new Date() > new Date(code.expiresAt) && code.status === "issued";
              const effectiveStatus = isExpired ? "expired" : code.status;
              const cfg = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.issued;
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === code.id;

              return (
                <Card key={code.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    {/* Header row */}
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : code.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-sm text-primary truncate">{code.code}</p>
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium ${cfg.color}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {cfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{TYPE_LABELS[code.type] || code.type}</span>
                          <span className="text-[10px] text-muted-foreground">|</span>
                          <span className="text-[10px] text-muted-foreground truncate">{code.email || code.phone || "-"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`${basePath}/edit-code/${code.id}`);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground text-[10px]">สาขา</p>
                            <p className="font-medium">{code.branchName || `#${code.branchId}`}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px]">ออกเมื่อ</p>
                            <p className="font-medium">{formatDate(code.issuedAt, { shortYear: true })}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-[10px]">หมดอายุ</p>
                            <p className={`font-medium ${isExpired ? "text-red-600" : ""}`}>
                              {code.expiresAt ? formatDate(code.expiresAt, { shortYear: true }) : "-"}
                            </p>
                          </div>
                          {code.claimOrderId && (
                            <div>
                              <p className="text-muted-foreground text-[10px]">เลขออเดอร์</p>
                              <p className="font-medium font-mono text-[11px]">{code.claimOrderId}</p>
                            </div>
                          )}
                        </div>

                        {/* Menu info */}
                        {(code.claimMenuCode || code.claimMenuName) && (
                          <div className="p-2 bg-red-50 rounded-lg">
                            <p className="text-[10px] text-red-600 font-medium mb-0.5">เมนูที่ผิด</p>
                            <p className="text-xs">{code.claimMenuCode && `[${code.claimMenuCode}] `}{code.claimMenuName || "-"}</p>
                          </div>
                        )}
                        {(code.compensationMenuCode || code.compensationMenuName) && (
                          <div className="p-2 bg-green-50 rounded-lg">
                            <p className="text-[10px] text-green-600 font-medium mb-0.5">เมนูชดเชย</p>
                            <p className="text-xs">{code.compensationMenuCode && `[${code.compensationMenuCode}] `}{code.compensationMenuName || "-"}</p>
                          </div>
                        )}
                        {code.compensationRemark && (
                          <div className="p-2 bg-amber-50 rounded-lg">
                            <p className="text-[10px] text-amber-600 font-medium mb-0.5">หมายเหตุ</p>
                            <p className="text-xs">{code.compensationRemark}</p>
                          </div>
                        )}
                        {code.claimError && (
                          <div className="p-2 bg-orange-50 rounded-lg">
                            <p className="text-[10px] text-orange-600 font-medium mb-0.5">ความผิดพลาด</p>
                            <p className="text-xs">{code.claimError}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => setLocation(`${basePath}/edit-code/${code.id}`)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            แก้ไข
                          </Button>
                        </div>
                      </div>
                    )}
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
