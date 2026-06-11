import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, CheckCircle2, XCircle, QrCode, Ban, Eye, Loader2, ChevronDown } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { formatDateTimeFull } from "@/lib/dateUtils";
import DateRangePickerModal from "@/components/common/DateRangePickerModal";

const actionConfig: Record<string, { label: string; color: string; icon: any }> = {
  approve: { label: "อนุมัติ", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  reject: { label: "ปฏิเสธ", color: "bg-red-100 text-red-700", icon: XCircle },
  issue_code: { label: "ออกโค้ด", color: "bg-blue-100 text-blue-700", icon: QrCode },
  redeem: { label: "ใช้โค้ด", color: "bg-purple-100 text-purple-700", icon: QrCode },
  cancel: { label: "ยกเลิก", color: "bg-gray-100 text-gray-700", icon: Ban },
  create_claim: { label: "สร้าง Claim", color: "bg-orange-100 text-orange-700", icon: QrCode },
};

export default function AuditLogs() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) { toast.error("ไม่มีสิทธิ์เข้าถึง (Super Admin เท่านั้น)"); setLocation("/admin"); }
  }, [loading, session, isSuperAdmin, setLocation]);

  const queryInput = useMemo(() => ({
    action: actionFilter === "all" ? undefined : actionFilter,
    limit: 100,
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }), [actionFilter, dateFrom, dateTo]);
  const { data: logs, isLoading } = trpc.auditLogs.list.useQuery(
    queryInput,
    { enabled: !!session && isSuperAdmin }
  );

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="Audit Logs" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="กรองตาม Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="approve">อนุมัติ</SelectItem>
            <SelectItem value="reject">ปฏิเสธ</SelectItem>
            <SelectItem value="issue_code">ออกโค้ด</SelectItem>
            <SelectItem value="redeem">ใช้โค้ด</SelectItem>
            <SelectItem value="create_claim">สร้าง Claim</SelectItem>
            <SelectItem value="cancel">ยกเลิก</SelectItem>
          </SelectContent>
        </Select>
          </div>
          <DateRangePickerModal
            dateFrom={dateFrom}
            dateTo={dateTo}
            onApply={(f, t) => { setDateFrom(f); setDateTo(t); }}
            onClear={() => { setDateFrom(""); setDateTo(""); }}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !logs?.length ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ไม่มี Audit Logs</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const config = actionConfig[log.action] || { label: log.action, color: "bg-gray-100 text-gray-700", icon: Shield };
              const ActionIcon = config.icon;
              return (
                <Card
                  key={log.id}
                  className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => setSelectedLog(log)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <ActionIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${config.color}`}>
                            {config.label}
                          </span>
<span className="text-[10px] text-muted-foreground">
                            {log.entity} #{log.entityId}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          โดย: {log.actorName || `User #${log.actorId}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateTimeFull(log.createdAt)}
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-[90vw] rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>รายละเอียด Audit Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">Action</p>
                  <p className="font-medium">{actionConfig[selectedLog.action]?.label || selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Entity</p>
                  <p className="font-medium">{selectedLog.entity} #{selectedLog.entityId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">ผู้ดำเนินการ</p>
                  <p className="font-medium">{selectedLog.actorName || `User #${selectedLog.actorId}`}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">เวลา</p>
                  <p className="font-medium">{formatDateTimeFull(selectedLog.createdAt)}</p>
                </div>
              </div>

              {selectedLog.beforeData && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Before</p>
                  <pre className="bg-muted p-2 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {typeof selectedLog.beforeData === "string" ? selectedLog.beforeData : JSON.stringify(selectedLog.beforeData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.afterData && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">After</p>
                  <pre className="bg-muted p-2 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
                    {typeof selectedLog.afterData === "string" ? selectedLog.afterData : JSON.stringify(selectedLog.afterData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
