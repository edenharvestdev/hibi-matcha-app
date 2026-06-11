import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, BadgeCheck, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029164707/lBgSgkEWqcVXTljA.jpeg";

export default function StaffLogin() {
  const [, setLocation] = useLocation();
  const { session, loading: authLoading } = useHibiAuth();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const utils = trpc.useUtils();

  const staffLoginMutation = trpc.hibiAuth.staffLogin.useMutation({
    onSuccess: (data) => {
      toast.success(`ยินดีต้อนรับ ${data.name}`);
      utils.hibiAuth.me.invalidate();
      if (["branch_owner", "branch_manager", "branch_staff", "area_manager"].includes(data.role)) setLocation("/branch");
      else if (data.role === "support_staff") setLocation("/admin");
      else setLocation("/admin");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Redirect if already logged in as staff
  useEffect(() => {
    if (!authLoading && session) {
      if (session.role === "customer") {
        // Customer logged in, stay on this page but show message
        return;
      }
      if (["branch_owner", "branch_manager", "branch_staff", "area_manager"].includes(session.role)) setLocation("/branch");
      else if (session.role === "support_staff") setLocation("/admin");
      else setLocation("/admin");
    }
  }, [authLoading, session, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-900/20 via-background to-background">
        <div className="flex flex-col items-center gap-4">
          <img src={LOGO_URL} alt="Hibi Matcha" className="h-16 w-16 rounded-full border-2 border-white shadow-md object-cover" />
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // If logged in as staff, redirect (handled by useEffect)
  if (session && session.role !== "customer") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-900/20 via-background to-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode || !password) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    staffLoginMutation.mutate({ employeeCode, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900/20 via-background to-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Back Button */}
        <button
          onClick={() => { if (window.history.length > 1) window.history.back(); else setLocation("/login"); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าเข้าสู่ระบบ
        </button>

        {/* Logo & Brand */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-3 bg-emerald-500/15 rounded-full blur-xl" />
            <img
              src={LOGO_URL}
              alt="Hibi Matcha"
              className="relative h-24 w-24 rounded-full border-4 border-white shadow-lg object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Hibi Matcha</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
              <p className="text-sm text-emerald-700 font-medium">สำหรับพนักงาน</p>
            </div>
          </div>
        </div>

        {/* Staff Login Form */}
        <Card className="border-0 shadow-lg border-t-2 border-t-emerald-500">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeCode" className="text-sm font-medium">รหัสพนักงาน</Label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="employeeCode"
                    type="text"
                    placeholder="เช่น EMP001"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    className="pl-10"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staffPassword" className="text-sm font-medium">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="staffPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold bg-emerald-600 hover:bg-emerald-700"
                disabled={staffLoginMutation.isPending}
              >
                {staffLoginMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังเข้าสู่ระบบ...</>
                ) : (
                  "เข้าสู่ระบบพนักงาน"
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center">
                ใช้รหัสพนักงานที่ได้รับจากผู้จัดการ<br />
                หากลืมรหัสผ่าน กรุณาติดต่อแอดมิน
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Hibi Matcha Cafe © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
