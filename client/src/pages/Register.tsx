import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Phone, Lock, Mail, User, Eye, EyeOff, ChevronLeft } from "lucide-react";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029164707/lBgSgkEWqcVXTljA.jpeg";

export default function Register() {
  const [, setLocation] = useLocation();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const utils = trpc.useUtils();

  const registerMutation = trpc.hibiAuth.register.useMutation({
    onSuccess: () => {
      toast.success("สมัครสมาชิกสำเร็จ!");
      utils.hibiAuth.me.invalidate();
      setLocation("/customer");
    },
    onError: (err) => {
      toast.error(err.message || "⚠️ เกิดข้อผิดพลาด — กรุณาลองใหม่อีกครั้ง");
    },
  });

  // Strip non-digit characters from phone
  const normalizePhone = (val: string) => val.replace(/\D/g, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || !password || !name || !email) {
      toast.error("⚠️ กรุณากรอกข้อมูลให้ครบ — ชื่อ, เบอร์โทร, อีเมล, และรหัสผ่าน");
      return;
    }
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      toast.error("❌ เบอร์โทรไม่ถูกต้อง — ต้องมี 9-15 หลัก (เช่น 0812345678)");
      return;
    }
    if (password.length < 6) {
      toast.error("❌ รหัสผ่านสั้นเกินไป — ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    registerMutation.mutate({ phone: cleanPhone, password, name, email });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Back button */}
        <button
          onClick={() => { if (window.history.length > 1) window.history.back(); else setLocation("/login"); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          กลับไปหน้าเข้าสู่ระบบ
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src={LOGO_URL} alt="Hibi Matcha" className="h-16 w-16 rounded-full border-2 border-white shadow-md object-cover" />
          <div className="text-center">
            <h1 className="text-xl font-bold">สมัครสมาชิก</h1>
            <p className="text-sm text-muted-foreground">สร้างบัญชี Hibi Matcha Rewards</p>
          </div>
        </div>

        {/* Register Form */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="ชื่อ นามสกุล" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" inputMode="numeric" placeholder="0812345678" value={phone} onChange={(e) => setPhone(normalizePhone(e.target.value))} className="pl-10" autoComplete="tel" maxLength={15} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">อีเมล (สำหรับรับโค้ด)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" autoComplete="email" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">รหัสผ่าน (อย่างน้อย 6 ตัว)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 font-semibold" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังสมัคร...</>
                ) : (
                  "สมัครสมาชิก"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
