import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import DatePickerCE from "@/components/DatePickerCE";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/useMobile";

export default function EditCode() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff } = useHibiAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const codeId = parseInt(params.id || "0");

  // Form state
  const [claimOrderId, setClaimOrderId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [claimMenuCode, setClaimMenuCode] = useState("");
  const [claimMenuName, setClaimMenuName] = useState("");
  const [claimOrderDetail, setClaimOrderDetail] = useState("");
  const [claimError, setClaimError] = useState("");
  const [compensationMenuCode, setCompensationMenuCode] = useState("");
  const [compensationMenuName, setCompensationMenuName] = useState("");
  const [compensationRemark, setCompensationRemark] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  const { data: code, isLoading: codeLoading } = trpc.codes.getById.useQuery(
    { id: codeId },
    { enabled: !!session && codeId > 0 }
  );

  // Initialize form with existing data
  useEffect(() => {
    if (code && !initialized) {
      setClaimOrderId(code.claimOrderId || "");
      setOrderDate(code.orderDate ? new Date(code.orderDate).toISOString().split("T")[0] : "");
      setClaimMenuCode(code.claimMenuCode || "");
      setClaimMenuName(code.claimMenuName || "");
      setClaimOrderDetail(code.claimOrderDetail || "");
      setClaimError(code.claimError || "");
      setCompensationMenuCode(code.compensationMenuCode || "");
      setCompensationMenuName(code.compensationMenuName || "");
      setCompensationRemark((code as any).compensationRemark || "");
      setExpiryDays(String(code.expiryDays || 30));
      setInitialized(true);
    }
  }, [code, initialized]);

  const updateMutation = trpc.codes.update.useMutation({
    onSuccess: () => {
      toast.success("แก้ไขโค้ดสำเร็จ!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    updateMutation.mutate({
      id: codeId,
      claimOrderId: claimOrderId || undefined,
      orderDate: orderDate || undefined,
      claimMenuCode: claimMenuCode || undefined,
      claimMenuName: claimMenuName || undefined,
      claimOrderDetail: claimOrderDetail || undefined,
      claimError: claimError || undefined,
      compensationMenuCode: compensationMenuCode || undefined,
      compensationMenuName: compensationMenuName || undefined,
      compensationRemark: compensationRemark || undefined,
      expiryDays: parseInt(expiryDays) || 30,
    });
  };

  if (loading || !session) return null;

  const channelLabels: Record<string, string> = {
    shopee: "Shopee Food", lineman: "LINE MAN", grab: "Grab Food", gpos: "GPOS", walk_in: "หน้าร้าน"
  };

  const isAdmin = session.role === "super_admin" || ["branch_owner", "branch_manager"].includes(session.role);
  const backPath = session.role === "super_admin" ? "/admin" : "/branch";

  return (
    <MobileLayout title="แก้ไขโค้ดชดเชย" showBack backPath={backPath}>
      <PremiumPageContent>
        {codeLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !code ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <p className="text-muted-foreground">ไม่พบโค้ดนี้</p>
          </div>
        ) : (
          <>
            {/* Code Info Header */}
            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Pencil className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg font-mono">{code.code}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{code.type === "CL" ? "โค้ดชดเชย" : "โค้ดรีวิว"}</span>
                      <span>|</span>
                      <span>{channelLabels[code.claimChannel || ""] || code.claimChannel || "-"}</span>
                      <span>|</span>
                      <span className={`font-medium ${code.status === "issued" ? "text-green-600" : code.status === "redeemed" ? "text-blue-600" : "text-red-600"}`}>
                        {code.status === "issued" ? "ใช้ได้" : code.status === "redeemed" ? "ใช้แล้ว" : code.status}
                      </span>
                    </div>
                  </div>
                </div>
                {code.customerPhone && (
                  <p className="text-xs text-muted-foreground mt-2">ลูกค้า: {code.customerPhone}</p>
                )}
              </CardContent>
            </Card>

            {updateMutation.isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">แก้ไขข้อมูลโค้ดเรียบร้อยแล้ว</p>
              </div>
            )}

            {/* Order Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm">ข้อมูลออเดอร์ที่ผิดพลาด</h3>

                <div className="space-y-2">
                  <Label className="text-sm">เลขออเดอร์</Label>
                  <Input placeholder="เช่น GF-677, LM-12345" value={claimOrderId} onChange={(e) => setClaimOrderId(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">วันที่สั่งซื้อ</Label>
                  <DatePickerCE value={orderDate} onChange={setOrderDate} placeholder="เลือกวันที่" maxDate={new Date()} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-sm">รหัสเมนูที่ผิด</Label>
                    <Input placeholder="เช่น M01" value={claimMenuCode} onChange={(e) => setClaimMenuCode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">ชื่อเมนูที่ผิด</Label>
                    <Input placeholder="เช่น Matcha Latte" value={claimMenuName} onChange={(e) => setClaimMenuName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">รายละเอียดการสั่ง</Label>
                  <Textarea placeholder="เช่น Matcha Latte หวานน้อย เย็น ไซส์ L" value={claimOrderDetail} onChange={(e) => setClaimOrderDetail(e.target.value)} rows={2} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">ความผิดพลาด</Label>
                  <Textarea placeholder="เช่น ทำผิดเมนู, ใส่น้ำตาลผิด..." value={claimError} onChange={(e) => setClaimError(e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* Compensation Info */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-sm">เมนูที่ชดเชย</h3>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-sm">รหัสเมนูชดเชย</Label>
                    <Input placeholder="เช่น M01" value={compensationMenuCode} onChange={(e) => setCompensationMenuCode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">ชื่อเมนูชดเชย</Label>
                    <Input placeholder="เช่น Matcha Latte" value={compensationMenuName} onChange={(e) => setCompensationMenuName(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">หมายเหตุสำหรับหน้าร้าน</Label>
                  <Input placeholder="เช่น หวานน้อย เย็น ไซส์ L" value={compensationRemark} onChange={(e) => setCompensationRemark(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">อายุโค้ด (วัน)</Label>
                  <Select value={expiryDays} onValueChange={setExpiryDays}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 วัน</SelectItem>
                      <SelectItem value="14">14 วัน</SelectItem>
                      <SelectItem value="30">30 วัน</SelectItem>
                      <SelectItem value="60">60 วัน</SelectItem>
                      <SelectItem value="90">90 วัน</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">เปลี่ยนอายุโค้ดจะคำนวณวันหมดอายุใหม่จากวันที่ออกโค้ด</p>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={handleSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />}
              บันทึกการแก้ไข
            </Button>
          </>
        )}
      </PremiumPageContent>
    </MobileLayout>
  );
}
