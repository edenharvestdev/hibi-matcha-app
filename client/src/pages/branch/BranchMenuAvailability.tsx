import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Coffee, Settings2, Info } from "lucide-react";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/useMobile";

export default function BranchMenuAvailability() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/login");
  }, [loading, session, isStaff, setLocation]);

  const branchId = session?.branchId || 0;

  const { data: menuItems, refetch } = trpc.branchMenu.list.useQuery(
    { branchId },
    { enabled: !!session && isStaff && branchId > 0 }
  );

  const toggleMutation = trpc.branchMenu.toggle.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleToggle = (menuItemId: number, currentAvailable: number) => {
    const newAvailable = currentAvailable === 1 ? false : true;
    toggleMutation.mutate({
      branchId,
      menuItemId,
      isAvailable: newAvailable,
    });
    toast.success(newAvailable ? "เปิดเมนูแล้ว" : "ปิดเมนูแล้ว");
  };

  if (loading || !session) return null;

  if (!branchId) {
    return (
      <MobileLayout title="จัดการเมนูรีวิว" showBack backPath="/branch">
        <PremiumPageContent>
        <div className="px-4 py-8 text-center">
          <Settings2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium">ไม่พบข้อมูลสาขา</p>
          <p className="text-xs text-muted-foreground mt-1">กรุณาติดต่อ Super Admin</p>
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  const activeCount = menuItems?.filter((m: any) => m.isActive && m.branchAvailable === 1).length ?? 0;
  const totalCount = menuItems?.filter((m: any) => m.isActive).length ?? 0;

  return (
    <MobileLayout title="เมนูรีวิว (สาขา)" showBack backPath="/branch">
      <PremiumPageContent>
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Settings2 className="h-7 w-7" />
              <div>
                <p className="font-bold text-lg">จัดการเมนูรีวิว</p>
                <p className="text-sm opacity-90">{session.branchName || "สาขาของคุณ"}</p>
              </div>
            </div>
            <div className="mt-3 bg-white/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{activeCount} / {totalCount}</p>
              <p className="text-xs opacity-90">เมนูที่เปิดให้ลูกค้าเลือก</p>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-3 flex gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            เปิด/ปิดเมนูที่ต้องการให้ลูกค้าเลือกได้ในสาขาของคุณ เมนูที่ปิดจะไม่แสดงให้ลูกค้าเห็น
          </p>
        </div>

        {/* Menu Items */}
        {!menuItems?.length ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Coffee className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium">ยังไม่มีเมนูรีวิว</p>
              <p className="text-xs text-muted-foreground mt-1">กรุณาติดต่อ Super Admin เพื่อเพิ่มเมนู</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {menuItems.filter((item: any) => item.isActive).map((item: any) => (
              <Card key={item.id} className={`border-0 shadow-sm transition-all ${item.branchAvailable !== 1 ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${item.branchAvailable === 1 ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <Coffee className={`h-5 w-5 ${item.branchAvailable === 1 ? 'text-emerald-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{item.code}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                      )}
                      <Badge
                        variant={item.branchAvailable === 1 ? "default" : "secondary"}
                        className={`mt-1 text-[10px] ${item.branchAvailable === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {item.branchAvailable === 1 ? "เปิดให้เลือก" : "ปิดชั่วคราว"}
                      </Badge>
                    </div>
                    <Switch
                      checked={item.branchAvailable === 1}
                      onCheckedChange={() => handleToggle(item.id, item.branchAvailable)}
                      disabled={toggleMutation.isPending}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Inactive items (globally disabled by super admin) */}
            {menuItems.filter((item: any) => !item.isActive).length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">เมนูที่ Super Admin ปิดทั้งระบบ:</p>
                {menuItems.filter((item: any) => !item.isActive).map((item: any) => (
                  <Card key={item.id} className="border-0 shadow-sm opacity-30 mb-2">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Coffee className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <span className="text-xs font-mono text-gray-400">{item.code}</span>
                          <span className="text-sm text-gray-400 ml-2">{item.name}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-gray-400">ปิดทั้งระบบ</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
          </PremiumPageContent>
    </MobileLayout>
  );
}
