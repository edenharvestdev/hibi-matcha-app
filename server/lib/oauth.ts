/**
 * OAuth 2.0 provider helpers for Google, Facebook, LINE
 */

export type OAuthProvider = "google" | "facebook" | "line";

interface OAuthUserInfo {
  providerUserId: string;
  email: string | null;
  displayName: string | null;
}

// Google OAuth
export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<OAuthUserInfo> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error("Google token exchange failed");

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const user = await userRes.json();
  return { providerUserId: user.id, email: user.email || null, displayName: user.name || null };
}

// Facebook OAuth
export async function exchangeFacebookCode(code: string, redirectUri: string): Promise<OAuthUserInfo> {
  const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID || "",
    client_secret: process.env.FACEBOOK_APP_SECRET || "",
    redirect_uri: redirectUri,
    code,
  })}`);
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error("Facebook token exchange failed");

  const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${tokenData.access_token}`);
  const user = await userRes.json();
  return { providerUserId: user.id, email: user.email || null, displayName: user.name || null };
}

// LINE OAuth
export async function exchangeLineCode(code: string, redirectUri: string): Promise<OAuthUserInfo> {
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_CHANNEL_ID || "",
      client_secret: process.env.LINE_CHANNEL_SECRET || "",
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error("LINE token exchange failed");

  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();

  let email: string | null = null;
  if (tokenData.id_token) {
    try {
      const payload = JSON.parse(Buffer.from(tokenData.id_token.split(".")[1], "base64").toString());
      email = payload.email || null;
    } catch {}
  }
  return { providerUserId: profile.userId, email, displayName: profile.displayName || null };
}

// Generic exchange
export async function exchangeOAuthCode(provider: OAuthProvider, code: string, redirectUri: string): Promise<OAuthUserInfo> {
  switch (provider) {
    case "google": return exchangeGoogleCode(code, redirectUri);
    case "facebook": return exchangeFacebookCode(code, redirectUri);
    case "line": return exchangeLineCode(code, redirectUri);
  }
}
