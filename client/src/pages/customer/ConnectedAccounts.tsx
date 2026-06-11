import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useState } from "react";

const PROVIDERS = [
  { id: "google" as const, name: "Google", color: "bg-white border border-gray-200", icon: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )},
  { id: "facebook" as const, name: "Facebook", color: "bg-[#1877F2]", icon: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )},
  { id: "line" as const, name: "LINE", color: "bg-[#06C755]", icon: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
      <path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  )},
];

export default function ConnectedAccounts() {
  const [, setLocation] = useLocation();
  const { session } = useHibiAuth();
  const oauthEnabled = import.meta.env.VITE_ENABLE_OAUTH === "true";
  if (!oauthEnabled) { setLocation("/customer"); return null; }
  const linkedQuery = trpc.oauth.listLinked.useQuery(undefined, { enabled: !!session });
  const unlinkMut = trpc.oauth.unlinkAccount.useMutation({
    onSuccess: () => linkedQuery.refetch(),
  });
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = (provider: "google" | "facebook" | "line") => {
    setConnecting(provider);
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const state = JSON.stringify({ provider, mode: "link", ts: Date.now() });
    const stateB64 = btoa(state).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    let url = "";
    if (provider === "google") {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        redirect_uri: redirectUri, response_type: "code",
        scope: "openid email profile", state: stateB64,
        access_type: "offline", prompt: "select_account",
      });
      url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } else if (provider === "facebook") {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_FACEBOOK_APP_ID || "",
        redirect_uri: redirectUri, response_type: "code",
        scope: "email,public_profile", state: stateB64,
      });
      url = `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
    } else {
      const params = new URLSearchParams({
        response_type: "code", client_id: import.meta.env.VITE_LINE_CHANNEL_ID || "",
        redirect_uri: redirectUri, state: stateB64, scope: "profile openid email",
      });
      url = `https://access.line.me/oauth2/v2.1/authorize?${params}`;
    }
    window.location.href = url;
  };

  const linked = linkedQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-md mx-auto p-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/customer")} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">บัญชีที่เชื่อมต่อ</h1>
        </div>

        <p className="text-sm text-gray-500">เชื่อมต่อบัญชี Social เพื่อเข้าสู่ระบบได้สะดวกยิ่งขึ้น</p>

        <div className="space-y-3">
          {PROVIDERS.map((p) => {
            const link = linked.find((l) => l.provider === p.id);
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.color}`}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                  {link ? (
                    <p className="text-xs text-emerald-600 truncate">{link.email || "เชื่อมต่อแล้ว"}</p>
                  ) : (
                    <p className="text-xs text-gray-400">ยังไม่ได้เชื่อมต่อ</p>
                  )}
                </div>
                {link ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => unlinkMut.mutate({ id: link.id })}
                    disabled={unlinkMut.isPending}
                  >
                    ยกเลิก
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => handleConnect(p.id)}
                    disabled={connecting === p.id}
                  >
                    {connecting === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "เชื่อมต่อ"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
