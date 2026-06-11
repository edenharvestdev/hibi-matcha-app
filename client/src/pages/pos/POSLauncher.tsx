import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, ExternalLink, ShieldAlert } from "lucide-react";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { trpc } from "@/lib/trpc";

const POS_V2_URL = import.meta.env.VITE_POS_V2_URL || "";

export default function POSLauncher() {
  const { session, loading, isStaff } = useHibiAuth();
  const logAccess = trpc.pos.logAccess.useMutation();

  const handleOpenPOS = () => {
    if (!POS_V2_URL || POS_V2_URL.includes("placeholder")) {
      toast.warning("POS V2 ยังไม่พร้อมใช้งาน", {
        description: "กรุณาติดต่อผู้ดูแลระบบ",
      });
      return;
    }
    // Log access to audit
    logAccess.mutate(undefined, {
      onSuccess: () => {
        window.open(POS_V2_URL, "_blank", "noopener,noreferrer");
      },
      onError: () => {
        // Still open even if log fails
        window.open(POS_V2_URL, "_blank", "noopener,noreferrer");
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30">
        <div className="animate-pulse text-muted-foreground">กำลังโหลด...</div>
      </div>
    );
  }

  // Permission check: only staff can see this page
  if (!session || !isStaff) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <ShieldAlert className="h-12 w-12 text-destructive/60" />
            <p className="text-center text-muted-foreground">
              ไม่มีสิทธิ์เข้าถึงระบบ POS
            </p>
            <p className="text-xs text-center text-muted-foreground/70">
              เฉพาะพนักงานและผู้ดูแลระบบเท่านั้น
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Monitor className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">POS System</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            เข้าสู่ระบบ POS เพื่อเปิดหน้าร้าน
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <Button
            className="w-full h-14 text-lg font-semibold"
            size="lg"
            onClick={handleOpenPOS}
            disabled={logAccess.isPending}
          >
            {logAccess.isPending ? (
              <span className="animate-pulse">กำลังเปิด...</span>
            ) : (
              <>
                <ExternalLink className="mr-2 h-5 w-5" />
                เปิด POS V2
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            จะเปิดในแท็บใหม่ — สามารถสลับกลับมาได้
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
