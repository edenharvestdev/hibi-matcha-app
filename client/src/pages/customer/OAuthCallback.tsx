import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useHibiAuth } from "@/hooks/useHibiAuth";

export default function OAuthCallback() {
  const [, setLocation] = useLocation();
  const { refresh } = useHibiAuth();
  const [status, setStatus] = useState<"loading" | "not_linked" | "error" | "linking">("loading");
  const [oauthData, setOauthData] = useState<{
    provider: string; providerUserId: string; email: string | null; displayName: string | null;
  } | null>(null);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [linkError, setLinkError] = useState("");

  const handleCallbackMut = trpc.oauth.handleCallback.useMutation();
  const linkAccountMut = trpc.oauth.linkAccount.useMutation();
  const loginMut = trpc.hibiAuth.login.useMutation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const stateParam = params.get("state");
    if (!code || !stateParam) { setStatus("error"); return; }

    let parsed: { provider: string };
    try {
      const decoded = atob(stateParam.replace(/-/g, "+").replace(/_/g, "/"));
      parsed = JSON.parse(decoded);
    } catch { setStatus("error"); return; }

    const redirectUri = `${window.location.origin}/oauth/callback`;
    handleCallbackMut.mutate(
      { provider: parsed.provider as any, code, redirectUri },
      {
        onSuccess: (result) => {
          if (result.status === "logged_in") {
            refresh();
            setLocation("/customer");
          } else {
            setOauthData(result);
            setStatus("not_linked");
          }
        },
        onError: () => setStatus("error"),
      }
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLink = async () => {
    if (!oauthData) return;
    setLinkError("");
    setStatus("linking");
    try {
      await loginMut.mutateAsync({ phone, password });
      await linkAccountMut.mutateAsync({
        provider: oauthData.provider as any,
        providerUserId: oauthData.providerUserId,
        email: oauthData.email,
        displayName: oauthData.displayName,
      });
      refresh();
      setLocation("/customer");
    } catch (err: any) {
      setLinkError(err?.message || "เกิดข้อผิดพลาด");
      setStatus("not_linked");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-gray-600">กำลังเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <div className="text-center space-y-4 max-w-sm mx-auto p-6">
          <p className="text-red-600 font-medium">เกิดข้อผิดพลาดในการเข้าสู่ระบบ</p>
          <Button onClick={() => setLocation("/login")} variant="outline">กลับหน้าเข้าสู่ระบบ</Button>
        </div>
      </div>
    );
  }

  const providerName = oauthData?.provider === "google" ? "Google" : oauthData?.provider === "facebook" ? "Facebook" : "LINE";
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-gray-800">เชื่อมโยงบัญชี {providerName}</h2>
          <p className="text-sm text-gray-500">
            กรุณาเข้าสู่ระบบด้วยเบอร์โทร + รหัสผ่าน เพื่อเชื่อมต่อกับ {providerName}
          </p>
          {oauthData?.email && (
            <p className="text-xs text-emerald-600">{oauthData.email}</p>
          )}
        </div>
        <div className="space-y-3">
          <Input placeholder="เบอร์โทรศัพท์" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input type="password" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} />
          {linkError && <p className="text-sm text-red-500">{linkError}</p>}
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleLink} disabled={status === "linking" || !phone || !password}>
            {status === "linking" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            เข้าสู่ระบบ & เชื่อมต่อ
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setLocation("/login")}>ยกเลิก</Button>
        </div>
      </div>
    </div>
  );
}
