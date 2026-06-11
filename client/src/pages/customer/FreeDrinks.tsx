import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Ticket, Copy, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, Coffee, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { formatDate } from "@/lib/dateUtils";
import HowToUsePopup from "@/components/HowToUsePopup";

export default function FreeDrinks() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [confirmData, setConfirmData] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: myCodes, refetch } = trpc.freeDrinkCodes.myCodes.useQuery(undefined, { enabled: !!session && isCustomer });

  const confirmMutation = trpc.freeDrinkCodes.confirmRedeem.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowConfirm(false);
      setConfirmData(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  /** ก็อปแค่รหัสโค้ดอย่างเดียว — ไม่แสดงเมนู */
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("คัดลอกโค้ดแล้ว!");
  };

  if (loading || !session) return null;

  const activeCodes = myCodes?.filter((c: any) => c.status === "issued" && new Date(c.expiresAt) > new Date()) || [];
  const usedCodes = myCodes?.filter((c: any) => c.status === "redeemed") || [];
  const expiredCodes = myCodes?.filter((c: any) => c.status === "expired" || (c.status === "issued" && new Date(c.expiresAt) <= new Date())) || [];

  return (
    <MobileLayout title="โค้ดแก้วแถม" showBack backPath="/customer">
      <PremiumPageContent>
      <div className="px-4 py-4 space-y-5">
        {/* Popup วิธีใช้โค้ด - auto popup ครั้งแรก */}
        <HowToUsePopup context="free-drinks" />
        {/* Header Info */}
        <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Ticket className="h-8 w-8" />
              <div>
                <p className="font-bold text-lg">โค้ดแก้วแถม</p>
                <p className="text-sm opacity-90">ใช้โค้ดเพื่อรับเครื่องดื่มฟรี</p>
              </div>
            </div>
            <div className="mt-3 bg-white/20 rounded-lg p-3 text-center">
              <p className="text-3xl font-bold">{activeCodes.length}</p>
              <p className="text-xs opacity-90">โค้ดพร้อมใช้งาน</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Codes */}
        {activeCodes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-emerald-600" />
              โค้ดพร้อมใช้ ({activeCodes.length})
            </h3>
            <div className="space-y-3">
              {activeCodes.map((code: any) => (
                <Card key={code.id} className="border-emerald-200 bg-emerald-50/50 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Code Header - ซ่อนรหัสโค้ดถ้ายังไม่เลือกเมนู */}
                    <div className="p-4 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {code.selectedMenuItemId ? (
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-mono font-bold text-emerald-700 text-sm">{code.code}</p>
                              <button onClick={() => copyCode(code.code)} className="text-emerald-500 hover:text-emerald-700">
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-mono font-bold text-muted-foreground/40 text-sm">••••-••••-••••</p>
                            </div>
                          )}
                          <p className="text-sm font-medium">{code.menuName}</p>
                          <p className="text-xs text-muted-foreground">
                            {code.sizeName}{code.milkName ? ` • ${code.milkName}` : ""}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            หมดอายุ {formatDate(code.expiresAt, { shortYear: true })}
                          </p>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                          {code.selectedMenuItemId ? "พร้อมใช้" : "รอเลือกเมนู"}
                        </Badge>
                      </div>
                    </div>

                    {/* ── ขั้นตอนที่ 1: เลือกเมนู (ซ่อนโค้ด ต้องเลือกก่อน) ── */}
                    {!code.selectedMenuItemId ? (
                      <div className="px-4 pb-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <p className="text-xs font-semibold text-amber-700">กรุณาเลือกเมนูก่อนใช้โค้ด</p>
                          </div>
                          <p className="text-[10px] text-amber-600 mb-2">ต้องกดเลือกเมนูในระบบก่อน จึงจะเห็นรหัสโค้ดและสามารถใช้งานได้</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs border-amber-300 text-amber-700 hover:bg-amber-50 font-medium"
                            onClick={() => setLocation(`/customer/select-menu?codeId=${code.id}`)}
                          >
                            <Coffee className="h-3.5 w-3.5 mr-1" /> เลือกเมนูเพื่อใช้โค้ด
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* ── ขั้นตอนที่ 2: เลือกเมนูแล้ว → แสดงแค่โค้ดสำหรับก็อป ── */
                      <div className="border-t border-emerald-200">
                        {/* สถานะเลือกเมนูแล้ว */}
                        <div className="px-4 pt-3 pb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                            <p className="text-xs font-semibold text-emerald-700">เลือกเมนูแล้ว</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-6 px-2 text-muted-foreground ml-auto"
                              onClick={() => setLocation(`/customer/select-menu?codeId=${code.id}`)}
                            >
                              ดูเมนู <ChevronRight className="h-3 w-3 ml-0.5" />
                            </Button>
                          </div>
                        </div>

                        {/* โค้ดขนาดใหญ่สำหรับก็อป/แจ้งพนักงาน */}
                        <div className="px-4 pb-4">
                          <div className="bg-white rounded-lg border border-dashed border-emerald-300 p-4 text-center">
                            <p className="text-[10px] text-muted-foreground mb-1">แจ้งโค้ดนี้กับพนักงาน หรือวางในช่องหมายเหตุตอนสั่ง</p>
                            <p className="font-mono font-bold text-xl text-emerald-700 my-2">{code.code}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-medium"
                              onClick={() => copyCode(code.code)}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" /> คัดลอกโค้ด
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2 text-center">
                            พนักงานจะสแกนโค้ดเพื่อดูเมนูที่คุณเลือกและยืนยันการใช้
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {activeCodes.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">ยังไม่มีโค้ดแก้วแถม</p>
              <p className="text-xs text-muted-foreground mt-1">รีวิวออเดอร์เพื่อรับโค้ดแก้วแถมฟรี!</p>
            </CardContent>
          </Card>
        )}

        {/* Used Codes */}
        {usedCodes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">ใช้แล้ว ({usedCodes.length})</h3>
            <div className="space-y-2">
              {usedCodes.map((code: any) => (
                <Card key={code.id} className="opacity-60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs line-through">{code.code}</p>
                        <p className="text-xs text-muted-foreground">{code.menuName} ({code.sizeName})</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">ใช้แล้ว</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Expired Codes */}
        {expiredCodes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">หมดอายุ ({expiredCodes.length})</h3>
            <div className="space-y-2">
              {expiredCodes.map((code: any) => (
                <Card key={code.id} className="opacity-40">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs line-through">{code.code}</p>
                        <p className="text-xs text-muted-foreground">{code.menuName}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] text-orange-500">หมดอายุ</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm Redemption Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ยืนยันการใช้โค้ด
            </DialogTitle>
            <DialogDescription>
              กรุณาตรวจสอบรายละเอียดก่อนยืนยัน
            </DialogDescription>
          </DialogHeader>
          {confirmData && (
            <div className="space-y-3">
              <Card className="bg-emerald-50">
                <CardContent className="p-4 text-center">
                  <p className="font-mono font-bold text-lg text-emerald-700">{confirmData.code}</p>
                  <p className="text-sm font-medium mt-2">{confirmData.menuName}</p>
                  <p className="text-xs text-muted-foreground">{confirmData.sizeName}{confirmData.milkName ? ` • ${confirmData.milkName}` : ""}</p>
                </CardContent>
              </Card>
              <p className="text-sm text-center text-muted-foreground">{confirmData.message}</p>
              <p className="text-xs text-center text-amber-600 font-medium">
                เมื่อยืนยันแล้วจะไม่สามารถยกเลิกได้
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>ยกเลิก</Button>
            <Button
              onClick={() => confirmData && confirmMutation.mutate({ code: confirmData.code })}
              disabled={confirmMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {confirmMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />กำลังยืนยัน...</> : "ยืนยันใช้โค้ด"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
          </PremiumPageContent>
    </MobileLayout>
  );
}
