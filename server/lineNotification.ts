/**
 * LINE OA Notification Helper
 * 
 * ใช้ LINE Messaging API สำหรับส่ง Push Message แจ้งเตือนลูกค้า
 * ต้องตั้งค่า LINE_CHANNEL_ACCESS_TOKEN ใน environment variables
 * 
 * วิธีตั้งค่า:
 * 1. สร้าง LINE Official Account ที่ https://manager.line.biz/
 * 2. เปิด Messaging API ที่ LINE Developers Console
 * 3. สร้าง Channel Access Token (Long-lived)
 * 4. ตั้งค่า LINE_CHANNEL_ACCESS_TOKEN ใน Secrets
 * 
 * หมายเหตุ: Push Message ใช้ Message Quota ของ LINE OA
 * - Free Plan: 200 ข้อความ/เดือน
 * - Light Plan: ~5,000 ข้อความ/เดือน (~590 บาท)
 * - Standard Plan: ~15,000 ข้อความ/เดือน (~1,490 บาท)
 */

const LINE_API_BASE = "https://api.line.me/v2/bot";

function getAccessToken(): string | null {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || null;
}

export function isLineConfigured(): boolean {
  return !!getAccessToken();
}

/**
 * ส่ง Push Message ไปยัง LINE User ID
 */
export async function sendLinePushMessage(
  userId: string,
  messages: LineMessage[]
): Promise<{ success: boolean; error?: string }> {
  const token = getAccessToken();
  if (!token) {
    console.warn("[LINE] Channel Access Token not configured");
    return { success: false, error: "LINE not configured" };
  }

  try {
    const res = await fetch(`${LINE_API_BASE}/message/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: messages.slice(0, 5), // LINE allows max 5 messages per push
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[LINE] Push failed:", res.status, err);
      return { success: false, error: `LINE API error: ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[LINE] Push error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * ส่ง Multicast Message ไปยังหลาย LINE User IDs
 */
export async function sendLineMulticast(
  userIds: string[],
  messages: LineMessage[]
): Promise<{ success: boolean; error?: string }> {
  const token = getAccessToken();
  if (!token) {
    return { success: false, error: "LINE not configured" };
  }

  try {
    const res = await fetch(`${LINE_API_BASE}/message/multicast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userIds.slice(0, 500), // LINE allows max 500 recipients
        messages: messages.slice(0, 5),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: `LINE API error: ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ── Pre-built notification templates ──

/**
 * แจ้งลูกค้าว่าปัญหาออเดอร์ได้รับการตอบรับแล้ว
 */
export function buildIssueAcknowledgedMessage(issueCategory: string, branchName: string): LineMessage[] {
  return [{
    type: "flex",
    altText: `Hibi Matcha: ปัญหาของคุณได้รับการตอบรับแล้ว`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🍵 Hibi Matcha", size: "sm", color: "#4a7c59", weight: "bold" },
        ],
        paddingBottom: "none",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "ปัญหาได้รับการตอบรับแล้ว ✅", weight: "bold", size: "md" },
          { type: "text", text: `ประเภท: ${issueCategory}`, size: "sm", color: "#666666", margin: "md" },
          { type: "text", text: `สาขา: ${branchName}`, size: "sm", color: "#666666" },
          { type: "text", text: "เราจะดำเนินการแก้ไขภายใน 48 ชม.", size: "xs", color: "#999999", margin: "lg" },
        ],
      },
    },
  }];
}

/**
 * แจ้งลูกค้าว่าปัญหาออเดอร์ได้รับการแก้ไขแล้ว
 */
export function buildIssueResolvedMessage(issueCategory: string, resolution: string): LineMessage[] {
  return [{
    type: "flex",
    altText: `Hibi Matcha: ปัญหาของคุณได้รับการแก้ไขแล้ว`,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "🍵 Hibi Matcha", size: "sm", color: "#4a7c59", weight: "bold" },
        ],
        paddingBottom: "none",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "ปัญหาได้รับการแก้ไขแล้ว 🎉", weight: "bold", size: "md" },
          { type: "text", text: `ประเภท: ${issueCategory}`, size: "sm", color: "#666666", margin: "md" },
          { type: "text", text: `การแก้ไข: ${resolution}`, size: "sm", color: "#333333", wrap: true, margin: "sm" },
          { type: "text", text: "ขอบคุณที่แจ้งปัญหา ❤️", size: "xs", color: "#999999", margin: "lg" },
        ],
      },
    },
  }];
}

// ── LINE Message Types ──

export interface LineTextMessage {
  type: "text";
  text: string;
}

export interface LineFlexMessage {
  type: "flex";
  altText: string;
  contents: any; // Flex Message container
}

export type LineMessage = LineTextMessage | LineFlexMessage;
