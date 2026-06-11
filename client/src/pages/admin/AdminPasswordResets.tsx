import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminPageWrapper from "@/components/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, Copy, CheckCircle2, Loader2, Clock, Phone, Mail, AlertCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/dateUtils";

export default function AdminPasswordResets() {
  const [tab, setTab] = useState("pending");

  const { data: pendingRequests, isLoading: loadingPending } = trpc.passwordReset.listPending.useQuery();
  const { data: allRequests, isLoading: loadingAll } = trpc.passwordReset.listAll.useQuery();

  // Reset link dialog
  const [resetDialog, setResetDialog] = useState<{ requestId: number; customerId: number; customerName: string } | null>(null);
  const [resetUrl, setResetUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const utils = trpc.useUtils();

  const generateLinkMutation = trpc.passwordReset.generateLink.useMutation({
    onSuccess: (result) => {
      setResetUrl(result.resetUrl);
      utils.passwordReset.listPending.invalidate();
      utils.passwordReset.listAll.invalidate();
      utils.passwordReset.countPending.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const reopenMutation = trpc.passwordReset.reopenRequest.useMutation({
    onSuccess: () => {
      toast.success("เปิดคำขอใหม่แล้ว สามารถสร้างลิงก์ได้อีกครั้ง");
      utils.passwordReset.listPending.invalidate();
      utils.passwordReset.listAll.invalidate();
      utils.passwordReset.countPending.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleGenerateLink = (requestId: number, customerId: number, customerName: string) => {
    setResetDialog({ requestId, customerId, customerName });
    setResetUrl("");
    setCopied(false);
    generateLinkMutation.mutate({
      requestId,
      customerId,
      origin: window.location.origin,
    });
  };

  const handleReopen = (requestId: number) => {
    reopenMutation.mutate({ requestId });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      toast.success("คัดลอกลิงก์แล้ว");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  // Using imported formatDateTime from dateUtils

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">รอดำเนินการ</Badge>;
      case "processed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">ดำเนินการแล้ว</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">ปฏิเสธ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderRequestCard = (request: any, showAction: boolean) => (
    <Card key={request.id} className="border-0 shadow-sm">
      <CardContent className="py-4">
        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{request.customerName}</h3>
              {statusBadge(request.status)}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {request.identifierType === "phone" ? <Phone className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                {request.identifier}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTime(request.createdAt)}
              </span>
            </div>
            {request.customerPhone && request.identifierType !== "phone" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> เบอร์: {request.customerPhone}
              </p>
            )}
            {request.customerEmail && request.identifierType !== "email" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> อีเมล: {request.customerEmail}
              </p>
            )}
          </div>
          {showAction && request.status === "pending" && (
            <Button
              size="sm"
              onClick={() => handleGenerateLink(request.id, request.customerId, request.customerName)}
              className="w-full"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              สร้างลิงก์รีเซ็ต
            </Button>
          )}
          {showAction && request.status === "processed" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReopen(request.id)}
                disabled={reopenMutation.isPending}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {reopenMutation.isPending ? "กำลังเปิดใหม่..." : "เปิดคำขอใหม่"}
              </Button>
              <Button
                size="sm"
                onClick={() => handleGenerateLink(request.id, request.customerId, request.customerName)}
                className="flex-1"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                สร้างลิงก์ใหม่
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminPageWrapper title="รีเซ็ตรหัสผ่าน" backPath="/admin" loading={loadingPending}>
      <div className="px-4 py-5 space-y-5">
        {/* Header info */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              คำขอรีเซ็ตรหัสผ่าน
            </h2>
            <p className="text-xs text-muted-foreground">จัดการคำขอรีเซ็ตรหัสผ่านจากลูกค้า</p>
          </div>
          {pendingRequests && pendingRequests.length > 0 && (
            <Badge className="bg-yellow-500 text-white">
              {pendingRequests.length} รอ
            </Badge>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-1 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              รอดำเนินการ
              {pendingRequests && pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">ทั้งหมด</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {loadingPending ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : !pendingRequests || pendingRequests.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">ไม่มีคำขอที่รอดำเนินการ</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((r: any) => renderRequestCard(r, true))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-3 mt-4">
            {loadingAll ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : !allRequests || allRequests.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground text-sm">ยังไม่มีคำขอรีเซ็ตรหัสผ่าน</p>
                </CardContent>
              </Card>
            ) : (
              allRequests.map((r: any) => renderRequestCard(r, true))
            )}
          </TabsContent>
        </Tabs>

        {/* Reset Link Dialog */}
        <Dialog open={!!resetDialog} onOpenChange={(open) => { if (!open) setResetDialog(null); }}>
          <DialogContent className="max-w-[90vw] rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-5 w-5 text-primary" />
                ลิงก์รีเซ็ตรหัสผ่าน
              </DialogTitle>
              <DialogDescription>
                สำหรับ <strong>{resetDialog?.customerName}</strong>
              </DialogDescription>
            </DialogHeader>

            {generateLinkMutation.isPending ? (
              <div className="text-center py-6">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground mt-2">กำลังสร้างลิงก์...</p>
              </div>
            ) : resetUrl ? (
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">ลิงก์รีเซ็ตรหัสผ่าน (หมดอายุ 24 ชม.)</p>
                  <p className="text-xs break-all font-mono">{resetUrl}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCopy}
                  variant={copied ? "outline" : "default"}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                      คัดลอกแล้ว!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      คัดลอกลิงก์
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  คัดลอกลิงก์นี้แล้วส่งให้ลูกค้าทาง LINE หรืออีเมล
                </p>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminPageWrapper>
  );
}
