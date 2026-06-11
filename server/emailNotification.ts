/**
 * Email Notification Helper for Hibi Matcha
 * 
 * ใช้ Manus Forge API (built-in notification) สำหรับส่ง email
 * ถ้าไม่มี Forge API จะ fallback ไปใช้ Resend API (ต้องตั้งค่า RESEND_API_KEY)
 * 
 * รองรับ:
 * 1. Auto-reply email เมื่อลูกค้าส่งฟอร์ม D/F/I
 * 2. Admin follow-up email ตอบกลับลูกค้า
 */

import { ENV } from "./_core/env";

// ── Email Sending via Forge Notification API ──

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * ส่ง email ผ่าน Manus Forge Notification API
 * ถ้าส่งไม่ได้จะ return false (ไม่ throw error)
 */
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html } = params;

  if (!to || !to.includes("@")) {
    return { success: false, error: "Invalid email address" };
  }

  // Try Forge API email endpoint
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    try {
      const baseUrl = ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;
      const endpoint = new URL("webdevtoken.v1.WebDevService/SendEmail", baseUrl).toString();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${ENV.forgeApiKey}`,
          "content-type": "application/json",
          "connect-protocol-version": "1",
        },
        body: JSON.stringify({ to, subject, html }),
      });

      if (res.ok) {
        console.log(`[Email] Sent to ${to}: ${subject}`);
        return { success: true };
      }

      // If Forge email endpoint doesn't exist (404), try Resend fallback
      const status = res.status;
      if (status === 404 || status === 501) {
        console.warn(`[Email] Forge email endpoint not available (${status}), trying Resend fallback`);
        return sendViaResend(params);
      }

      const detail = await res.text().catch(() => "");
      console.warn(`[Email] Forge send failed (${status}): ${detail}`);
      return sendViaResend(params);
    } catch (err: any) {
      console.warn("[Email] Forge error:", err.message);
      return sendViaResend(params);
    }
  }

  // Fallback to Resend
  return sendViaResend(params);
}

/**
 * Fallback: ส่ง email ผ่าน Resend API
 */
async function sendViaResend(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("[Email] No Resend API key configured, email not sent");
    // Log the email content for debugging
    console.log(`[Email] Would send to: ${params.to}, Subject: ${params.subject}`);
    return { success: false, error: "No email service configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Hibi Matcha <noreply@hibimatcha.com>",
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    if (res.ok) {
      console.log(`[Email] Resend sent to ${params.to}: ${params.subject}`);
      return { success: true };
    }

    const err = await res.json().catch(() => ({}));
    console.warn("[Email] Resend failed:", res.status, err);
    return { success: false, error: `Resend error: ${res.status}` };
  } catch (err: any) {
    console.warn("[Email] Resend error:", err.message);
    return { success: false, error: err.message };
  }
}

// ── HTML Email Templates ──

const BRAND_COLOR = "#4a7c59";
const BRAND_BG = "#f0f7f2";

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: ${BRAND_COLOR}; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; }
    .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin: 4px 0 0; }
    .body { padding: 32px 24px; }
    .body h2 { color: ${BRAND_COLOR}; font-size: 18px; margin: 0 0 16px; }
    .body p { font-size: 14px; line-height: 1.7; margin: 0 0 12px; color: #444; }
    .info-box { background: ${BRAND_BG}; border-left: 4px solid ${BRAND_COLOR}; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .info-box p { margin: 4px 0; font-size: 13px; }
    .info-box strong { color: ${BRAND_COLOR}; }
    .footer { background: #fafafa; padding: 20px 24px; text-align: center; border-top: 1px solid #eee; }
    .footer p { font-size: 11px; color: #999; margin: 4px 0; }
    .btn { display: inline-block; background: ${BRAND_COLOR}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍵 Hibi Matcha</h1>
      <p>日 々 — ทุกวันกับมัทฉะ</p>
    </div>
    ${content}
    <div class="footer">
      <p>Hibi Matcha — Premium Matcha Cafe</p>
      <p>อีเมลนี้ส่งอัตโนมัติ กรุณาอย่าตอบกลับ</p>
    </div>
  </div>
</body>
</html>`;
}

// ── Type-specific templates ──

const TYPE_LABELS: Record<string, string> = {
  franchise: "แฟรนไชส์",
  wholesale: "สั่งซื้อชาราคาส่ง",
  event: "จัดงาน Event / ติดต่อธุรกิจ",
  other: "สอบถามข้อมูล",
};

interface InquiryData {
  type: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  message: string;
  budget?: string;
  province?: string;
}

/**
 * สร้าง auto-reply email สำหรับลูกค้าที่ส่งฟอร์ม D/F/I
 */
export function buildAutoReplyEmail(data: InquiryData): { subject: string; html: string } {
  const typeLabel = TYPE_LABELS[data.type] || "สอบถามข้อมูล";

  const typeMessages: Record<string, string> = {
    franchise: `<p>ขอบคุณที่สนใจ <strong>แฟรนไชส์ Hibi Matcha</strong> ค่ะ/ครับ ทีมงานฝ่ายพัฒนาธุรกิจจะตรวจสอบข้อมูลและติดต่อกลับภายใน <strong>2 วันทำการ</strong> เพื่อนัดหมายพูดคุยรายละเอียดเพิ่มเติม</p>
<p>ในระหว่างนี้ หากมีคำถามเพิ่มเติม สามารถติดต่อเราได้ทาง LINE Official Account หรือเบอร์โทรศัพท์ที่ระบุด้านล่าง</p>`,
    wholesale: `<p>ขอบคุณที่สนใจ <strong>สั่งซื้อชา Matcha ราคาส่ง</strong> จาก Hibi Matcha ค่ะ/ครับ เรานำเข้า Matcha คุณภาพสูงจากญี่ปุ่นและจีน พร้อมบริการเบลนด์ตามสูตรเฉพาะ</p>
<p>ทีมงานฝ่ายขายจะตรวจสอบข้อมูลและติดต่อกลับภายใน <strong>2 วันทำการ</strong> พร้อมรายละเอียดราคาและเงื่อนไขการสั่งซื้อ</p>`,
    event: `<p>ขอบคุณที่สนใจบริการ <strong>จัดงาน Event / ติดต่อธุรกิจ</strong> กับ Hibi Matcha ค่ะ/ครับ เรายินดีให้บริการจัดบูธ Matcha, Catering, และ Corporate Event</p>
<p>ทีมงานจะตรวจสอบรายละเอียดและติดต่อกลับภายใน <strong>2 วันทำการ</strong> เพื่อหารือเกี่ยวกับรูปแบบงานและงบประมาณ</p>`,
    other: `<p>ขอบคุณที่ติดต่อ <strong>Hibi Matcha</strong> ค่ะ/ครับ เราได้รับข้อมูลของท่านเรียบร้อยแล้ว</p>
<p>ทีมงานจะตรวจสอบและติดต่อกลับภายใน <strong>2 วันทำการ</strong></p>`,
  };

  const subject = `✅ Hibi Matcha — ได้รับข้อมูล${typeLabel}ของคุณแล้ว`;

  const html = emailWrapper(`
    <div class="body">
      <h2>สวัสดีคุณ ${data.name} 🙏</h2>
      ${typeMessages[data.type] || typeMessages.other}
      
      <div class="info-box">
        <p><strong>สรุปข้อมูลที่ส่ง:</strong></p>
        <p>📋 ประเภท: ${typeLabel}</p>
        <p>👤 ชื่อ: ${data.name}</p>
        <p>📞 เบอร์โทร: ${data.phone}</p>
        ${data.email ? `<p>📧 อีเมล: ${data.email}</p>` : ""}
        ${data.company ? `<p>🏢 บริษัท: ${data.company}</p>` : ""}
        ${data.province ? `<p>📍 จังหวัด: ${data.province}</p>` : ""}
        ${data.budget ? `<p>💰 งบประมาณ: ${data.budget}</p>` : ""}
        <p>💬 ข้อความ: ${data.message}</p>
      </div>

      <p>ขอบคุณที่สนใจสินค้าและบริการของ Hibi Matcha ค่ะ/ครับ ❤️</p>
      <p style="font-size: 13px; color: #888;">— ทีมงาน Hibi Matcha</p>
    </div>
  `);

  return { subject, html };
}

/**
 * สร้าง follow-up email จาก Admin ตอบกลับลูกค้า
 */
export function buildFollowUpEmail(data: {
  customerName: string;
  inquiryType: string;
  adminMessage: string;
  adminName?: string;
}): { subject: string; html: string } {
  const typeLabel = TYPE_LABELS[data.inquiryType] || "สอบถามข้อมูล";

  const subject = `📩 Hibi Matcha — อัปเดตเกี่ยวกับ${typeLabel}`;

  const html = emailWrapper(`
    <div class="body">
      <h2>สวัสดีคุณ ${data.customerName} 🙏</h2>
      <p>ทีมงาน Hibi Matcha ขอแจ้งอัปเดตเกี่ยวกับ <strong>${typeLabel}</strong> ที่ท่านได้สอบถามเข้ามา:</p>
      
      <div class="info-box">
        <p style="white-space: pre-wrap; line-height: 1.8;">${data.adminMessage}</p>
      </div>

      <p>หากมีคำถามเพิ่มเติม สามารถตอบกลับอีเมลนี้ หรือติดต่อเราผ่าน LINE Official Account ได้เลยค่ะ/ครับ</p>
      <p>ขอบคุณที่สนใจสินค้าและบริการของ Hibi Matcha ค่ะ/ครับ ❤️</p>
      <p style="font-size: 13px; color: #888;">— ${data.adminName || "ทีมงาน Hibi Matcha"}</p>
    </div>
  `);

  return { subject, html };
}

/**
 * สร้าง email แจ้งสถานะปัญหาออเดอร์ (C)
 */
export function buildIssueStatusEmail(data: {
  customerName: string;
  category: string;
  status: string;
  resolution?: string;
}): { subject: string; html: string } {
  const categoryLabels: Record<string, string> = {
    wrong_order: "ออเดอร์ผิด",
    missing_item: "ของไม่ครบ",
    quality: "คุณภาพสินค้า",
    damaged: "สินค้าเสียหาย",
    late_delivery: "จัดส่งล่าช้า",
    other: "อื่นๆ",
  };

  const statusLabels: Record<string, string> = {
    acknowledged: "ได้รับการตอบรับแล้ว",
    resolved: "แก้ไขเรียบร้อยแล้ว",
    closed: "ปิดเรื่องแล้ว",
  };

  const catLabel = categoryLabels[data.category] || data.category;
  const statusLabel = statusLabels[data.status] || data.status;
  const subject = `🍵 Hibi Matcha — ปัญหา${catLabel}: ${statusLabel}`;

  const html = emailWrapper(`
    <div class="body">
      <h2>สวัสดีคุณ ${data.customerName} 🙏</h2>
      <p>ขอแจ้งอัปเดตเกี่ยวกับปัญหาที่ท่านแจ้งเข้ามา:</p>
      
      <div class="info-box">
        <p><strong>ประเภทปัญหา:</strong> ${catLabel}</p>
        <p><strong>สถานะ:</strong> ${statusLabel}</p>
        ${data.resolution ? `<p><strong>การแก้ไข:</strong> ${data.resolution}</p>` : ""}
      </div>

      ${data.status === "resolved" ? `<p>ขอบคุณที่แจ้งปัญหา เราจะนำไปปรับปรุงบริการให้ดียิ่งขึ้น ❤️</p>` : `<p>ทีมงานกำลังดำเนินการ จะแจ้งให้ทราบเมื่อมีความคืบหน้า</p>`}
      <p style="font-size: 13px; color: #888;">— ทีมงาน Hibi Matcha</p>
    </div>
  `);

  return { subject, html };
}
