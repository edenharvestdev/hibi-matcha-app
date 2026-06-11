import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone, Mail, CheckCircle2, Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type ResetMode = "choose" | "otp" | "admin";
type OtpStep = "phone" | "verify" | "done";

export default function ForgotPassword() {
  const [mode, setMode] = useState<ResetMode>("choose");

  if (mode === "otp") return <OtpResetFlow onBack={() => setMode("choose")} />;
  if (mode === "admin") return <AdminResetFlow onBack={() => setMode("choose")} />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">ลืมรหัสผ่าน</CardTitle>
          <CardDescription>เลือกวิธีรีเซ็ตรหัสผ่าน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full h-auto py-4 flex flex-col items-center gap-1"
            onClick={() => setMode("otp")}
          >
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              <span className="font-semibold">รีเซ็ตด้วย OTP (แนะนำ)</span>
            </div>
            <span className="text-xs opacity-80">ส่งรหัส OTP ไปที่อีเมลของคุณทันที</span>
          </Button>

          <Button
            variant="outline"
            className="w-full h-auto py-4 flex flex-col items-center gap-1"
            onClick={() => setMode("admin")}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-semibold">ขอแอดมินรีเซ็ต</span>
            </div>
            <span className="text-xs text-muted-foreground">แอดมินจะส่งลิงก์รีเซ็ตให้ทาง LINE/อีเมล</span>
          </Button>

          <Link href="/login">
            <Button variant="ghost" className="w-full mt-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

// ── OTP Self-Service Reset Flow ──
function OtpResetFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const normalizePhone = (val: string) => val.replace(/\D/g, "");

  const requestOtpMutation = trpc.customerOtpReset.requestOtp.useMutation({
    onSuccess: () => {
      setStep("verify");
      toast.success("ส่ง OTP ไปที่อีเมลของคุณแล้ว");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const confirmOtpMutation = trpc.customerOtpReset.confirmOtp.useMutation({
    onSuccess: () => {
      setStep("done");
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error("กรุณากรอกเบอร์โทรให้ถูกต้อง");
      return;
    }
    requestOtpMutation.mutate({ phone: cleanPhone });
  };

  const handleConfirmOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("กรุณากรอก OTP 6 หลัก");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }
    confirmOtpMutation.mutate({ phone: normalizePhone(phone), otp, newPassword });
  };

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">เปลี่ยนรหัสผ่านสำเร็จ ✓</h2>
            <p className="text-muted-foreground text-sm">
              คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
            </p>
            <Link href="/login">
              <Button className="w-full mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">กรอก OTP</CardTitle>
            <CardDescription>
              เราส่งรหัส OTP 6 หลักไปที่อีเมลของคุณแล้ว
              <br />กรุณาตรวจสอบอีเมลและกรอกรหัสด้านล่าง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConfirmOtp} className="space-y-4">
              <div className="space-y-2">
                <Label>รหัส OTP</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label>รหัสผ่านใหม่</Label>
                <Input
                  type="password"
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label>ยืนยันรหัสผ่านใหม่</Label>
                <Input
                  type="password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-destructive">รหัสผ่านไม่ตรงกัน</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={confirmOtpMutation.isPending || otp.length !== 6 || newPassword.length < 6 || newPassword !== confirmPassword}
              >
                {confirmOtpMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังยืนยัน...
                  </>
                ) : (
                  "ยืนยันเปลี่ยนรหัสผ่าน"
                )}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("phone")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับไปกรอกเบอร์ใหม่
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step: phone
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">รีเซ็ตรหัสผ่านด่วน</CardTitle>
          <CardDescription>
            กรอกเบอร์โทรที่ใช้สมัคร เราจะส่ง OTP ไปที่อีเมลของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-2">
              <Label>เบอร์โทรศัพท์</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="0812345678"
                  value={phone}
                  onChange={(e) => setPhone(normalizePhone(e.target.value))}
                  className="pl-10"
                  maxLength={15}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={requestOtpMutation.isPending || !phone}
            >
              {requestOtpMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังส่ง OTP...
                </>
              ) : (
                "ส่ง OTP ไปที่อีเมล"
              )}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Admin Reset Flow (existing behavior) ──
function AdminResetFlow({ onBack }: { onBack: () => void }) {
  const [identifierType, setIdentifierType] = useState<"phone" | "email">("phone");
  const [identifier, setIdentifier] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const normalizePhone = (val: string) => val.replace(/\D/g, "");

  const requestMutation = trpc.passwordReset.request.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIdentifier = identifierType === "phone" ? normalizePhone(identifier) : identifier.trim();
    if (!cleanIdentifier) {
      toast.error("กรุณากรอกข้อมูล");
      return;
    }
    requestMutation.mutate({ identifier: cleanIdentifier, identifierType });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">ส่งคำขอเรียบร้อย</h2>
            <p className="text-muted-foreground text-sm">
              แอดมินจะตรวจสอบและส่งลิงก์รีเซ็ตรหัสผ่านให้ทาง LINE หรืออีเมล
              กรุณารอสักครู่
            </p>
            <Link href="/login">
              <Button className="w-full mt-4" variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับไปหน้าเข้าสู่ระบบ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">ขอแอดมินรีเซ็ต</CardTitle>
          <CardDescription>
            กรอกเบอร์โทรหรืออีเมลที่ใช้สมัคร แอดมินจะส่งลิงก์รีเซ็ตให้
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={identifierType === "phone" ? "default" : "outline"}
                className="flex-1"
                onClick={() => { setIdentifierType("phone"); setIdentifier(""); }}
              >
                <Phone className="h-4 w-4 mr-2" />
                เบอร์โทร
              </Button>
              <Button
                type="button"
                variant={identifierType === "email" ? "default" : "outline"}
                className="flex-1"
                onClick={() => { setIdentifierType("email"); setIdentifier(""); }}
              >
                <Mail className="h-4 w-4 mr-2" />
                อีเมล
              </Button>
            </div>

            <div className="space-y-2">
              <Label>
                {identifierType === "phone" ? "เบอร์โทรศัพท์" : "อีเมล"}
              </Label>
              <div className="relative">
                {identifierType === "phone" ? (
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                ) : (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  type={identifierType === "phone" ? "tel" : "email"}
                  inputMode={identifierType === "phone" ? "numeric" : "email"}
                  placeholder={identifierType === "phone" ? "0812345678" : "email@example.com"}
                  value={identifier}
                  onChange={(e) =>
                    setIdentifier(
                      identifierType === "phone"
                        ? normalizePhone(e.target.value)
                        : e.target.value
                    )
                  }
                  className="pl-10"
                  maxLength={identifierType === "phone" ? 15 : 320}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={requestMutation.isPending || !identifier}
            >
              {requestMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                "ส่งคำขอรีเซ็ตรหัสผ่าน"
              )}
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
