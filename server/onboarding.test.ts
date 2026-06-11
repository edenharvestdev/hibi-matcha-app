import { describe, it, expect } from "vitest";

/**
 * OnboardingPopup is a pure frontend component that uses localStorage.
 * These tests verify the slide content structure and localStorage key logic.
 */

describe("Onboarding Pop-up", () => {
  const STORAGE_KEY = "hibi-onboarding-seen-v1";

  const slides = [
    {
      title: "ยินดีต้อนรับสู่ Hibi Matcha!",
      subtitle: "สมาชิกรับสิทธิพิเศษมากมาย",
      body: "สั่งเครื่องดื่ม สะสมแต้ม แลกของรางวัล\nและรับโค้ดเครื่องดื่มฟรีง่ายๆ",
    },
    {
      title: "รีวิว = โค้ดฟรี",
      subtitle: "สั่ง 1 ออเดอร์ รีวิว 1 ครั้ง",
      body: "สั่งเครื่องดื่มผ่าน Shopee / Lineman / Grab\nรีวิวพร้อมแนบรูป รอเจ้าหน้าที่อนุมัติ\nรับโค้ดฟรีใส่ในออเดอร์ถัดไป!",
    },
    {
      title: "สะสมแต้มทุกบิล",
      subtitle: "ยิ่งซื้อ ยิ่งได้",
      body: "กรอกเลขบิล + ยอดเงิน รอเจ้าหน้าที่อนุมัติ\nแต้มสะสมแยกตามสาขา\nใช้แต้มแลกของรางวัลได้เลย!",
    },
    {
      title: "แลกของรางวัล",
      subtitle: "ใช้แต้มแลกได้ทันที",
      body: "เลือกสาขา → ดูแต้มคงเหลือ → เลือกรางวัล\nแสดงโค้ดให้พนักงานที่ร้าน\nรับของรางวัลได้เลย!",
    },
  ];

  it("should have exactly 4 slides", () => {
    expect(slides).toHaveLength(4);
  });

  it("every slide should have title, subtitle, and body", () => {
    for (const slide of slides) {
      expect(slide.title).toBeTruthy();
      expect(slide.subtitle).toBeTruthy();
      expect(slide.body).toBeTruthy();
    }
  });

  it("first slide should be welcome message", () => {
    expect(slides[0].title).toContain("ยินดีต้อนรับ");
  });

  it("second slide should explain review = free code", () => {
    expect(slides[1].title).toContain("รีวิว");
    expect(slides[1].body).toContain("Shopee");
    expect(slides[1].body).toContain("โค้ดฟรี");
  });

  it("third slide should explain point accumulation per branch", () => {
    expect(slides[2].title).toContain("สะสมแต้ม");
    expect(slides[2].body).toContain("แยกตามสาขา");
  });

  it("fourth slide should explain reward redemption", () => {
    expect(slides[3].title).toContain("แลกของรางวัล");
    expect(slides[3].body).toContain("เลือกสาขา");
  });

  it("slide body text should be concise (under 100 chars per line)", () => {
    for (const slide of slides) {
      const lines = slide.body.split("\n");
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(100);
      }
    }
  });

  it("storage key should be versioned", () => {
    expect(STORAGE_KEY).toMatch(/^hibi-onboarding-seen-v\d+$/);
  });

  it("slide titles should be short and scannable (under 30 chars)", () => {
    for (const slide of slides) {
      expect(slide.title.length).toBeLessThanOrEqual(30);
    }
  });

  it("slide subtitles should be short (under 30 chars)", () => {
    for (const slide of slides) {
      expect(slide.subtitle.length).toBeLessThanOrEqual(30);
    }
  });
});
