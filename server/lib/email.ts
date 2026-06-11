import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(to: string, otp: string, name: string) {
  await resend.emails.send({
    from: "Hibi Matcha <noreply@hibimatcha.love>",
    to,
    subject: "รหัส OTP รีเซ็ตรหัสผ่าน - Hibi Matcha",
    html: `<p>สวัสดีครับ คุณ ${name}</p><p>รหัส OTP ของคุณคือ <b>${otp}</b></p><p>หมดอายุใน 15 นาที 💚</p>`,
  });
}
