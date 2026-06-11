import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("PWA Configuration", () => {
  const manifestPath = path.resolve(__dirname, "../client/public/manifest.json");
  const swPath = path.resolve(__dirname, "../client/public/sw.js");
  const offlinePath = path.resolve(__dirname, "../client/public/offline.html");
  const indexPath = path.resolve(__dirname, "../client/index.html");

  describe("manifest.json", () => {
    it("should exist and be valid JSON", () => {
      expect(fs.existsSync(manifestPath)).toBe(true);
      const content = fs.readFileSync(manifestPath, "utf-8");
      const manifest = JSON.parse(content);
      expect(manifest).toBeDefined();
    });

    it("should have required PWA fields", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(manifest.name).toBeDefined();
      expect(manifest.short_name).toBeDefined();
      expect(manifest.start_url).toBe("/");
      expect(manifest.display).toBe("standalone");
      expect(manifest.background_color).toBeDefined();
      expect(manifest.theme_color).toBeDefined();
      expect(manifest.icons).toBeDefined();
      expect(Array.isArray(manifest.icons)).toBe(true);
    });

    it("should have Thai language set", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(manifest.lang).toBe("th");
    });

    it("should have icons in multiple sizes", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const sizes = manifest.icons.map((i: any) => i.sizes);
      expect(sizes).toContain("192x192");
      expect(sizes).toContain("512x512");
      expect(sizes).toContain("72x72");
      expect(sizes).toContain("144x144");
      expect(sizes).toContain("180x180");
    });

    it("should have maskable icons", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const maskableIcons = manifest.icons.filter(
        (i: any) => i.purpose === "maskable"
      );
      expect(maskableIcons.length).toBeGreaterThanOrEqual(1);
    });

    it("should have at least one 'any' purpose icon", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const anyIcons = manifest.icons.filter(
        (i: any) => i.purpose === "any"
      );
      expect(anyIcons.length).toBeGreaterThanOrEqual(1);
    });

    it("should have shortcuts for quick actions", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(manifest.shortcuts).toBeDefined();
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
      expect(manifest.shortcuts.length).toBeGreaterThanOrEqual(2);

      // Each shortcut should have name and url
      manifest.shortcuts.forEach((shortcut: any) => {
        expect(shortcut.name).toBeDefined();
        expect(shortcut.url).toBeDefined();
        expect(shortcut.url.startsWith("/")).toBe(true);
      });
    });

    it("should have portrait orientation", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(manifest.orientation).toBe("portrait-primary");
    });

    it("should not prefer related applications", () => {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      expect(manifest.prefer_related_applications).toBe(false);
    });
  });

  describe("Service Worker (sw.js)", () => {
    it("should exist", () => {
      expect(fs.existsSync(swPath)).toBe(true);
    });

    it("should have install event listener", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("addEventListener('install'");
    });

    it("should have activate event listener", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("addEventListener('activate'");
    });

    it("should have fetch event listener", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("addEventListener('fetch'");
    });

    it("should skip API calls in fetch handler", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("/api/");
    });

    it("should have offline fallback", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("offline.html");
    });

    it("should have cache versioning", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toMatch(/CACHE_VERSION|hibi-matcha-v/);
    });

    it("should handle push notifications", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("addEventListener('push'");
    });

    it("should handle notification clicks", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("addEventListener('notificationclick'");
    });

    it("should use skipWaiting for immediate activation", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("self.skipWaiting()");
    });

    it("should use clients.claim for immediate control", () => {
      const content = fs.readFileSync(swPath, "utf-8");
      expect(content).toContain("self.clients.claim()");
    });
  });

  describe("Offline page (offline.html)", () => {
    it("should exist", () => {
      expect(fs.existsSync(offlinePath)).toBe(true);
    });

    it("should have Thai content", () => {
      const content = fs.readFileSync(offlinePath, "utf-8");
      expect(content).toContain("lang=\"th\"");
      expect(content).toContain("ไม่มีการเชื่อมต่อ");
    });

    it("should have retry functionality", () => {
      const content = fs.readFileSync(offlinePath, "utf-8");
      expect(content).toContain("retryConnection");
      expect(content).toContain("ลองใหม่");
    });

    it("should auto-retry when connection comes back", () => {
      const content = fs.readFileSync(offlinePath, "utf-8");
      expect(content).toContain("addEventListener('online'");
    });

    it("should have safe area support", () => {
      const content = fs.readFileSync(offlinePath, "utf-8");
      expect(content).toContain("safe-area-inset");
    });
  });

  describe("index.html PWA meta tags", () => {
    it("should have manifest link", () => {
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain('rel="manifest"');
      expect(content).toContain("manifest.json");
    });

    it("should have theme-color meta tag", () => {
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain('name="theme-color"');
    });

    it("should have apple-mobile-web-app-capable", () => {
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain('name="apple-mobile-web-app-capable"');
      expect(content).toContain('content="yes"');
    });

    it("should have apple-mobile-web-app-status-bar-style", () => {
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain('name="apple-mobile-web-app-status-bar-style"');
    });

    it("should have apple-mobile-web-app-title", () => {
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain('name="apple-mobile-web-app-title"');
      expect(content).toContain("Hibi Matcha");
    });

    it("should have apple-touch-icon links", () => {
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain('rel="apple-touch-icon"');
    });

    it("should have apple-touch-startup-image for iOS splash screens", () => {
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain('rel="apple-touch-startup-image"');
    });

    it("should have viewport-fit=cover for notched devices", () => {
      const content = fs.readFileSync(indexPath, "utf-8");
      expect(content).toContain("viewport-fit=cover");
    });

    it("should have multiple favicon sizes", () => {
      const content = fs.readFileSync(indexPath, "utf-8");
      const iconLinks = content.match(/rel="icon"/g);
      expect(iconLinks).not.toBeNull();
      expect(iconLinks!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("PWA Install Banner Component", () => {
    const bannerPath = path.resolve(
      __dirname,
      "../client/src/components/PWAInstallBanner.tsx"
    );
    const hookPath = path.resolve(
      __dirname,
      "../client/src/hooks/usePWAInstall.ts"
    );

    it("should have PWAInstallBanner component", () => {
      expect(fs.existsSync(bannerPath)).toBe(true);
    });

    it("should have usePWAInstall hook", () => {
      expect(fs.existsSync(hookPath)).toBe(true);
    });

    it("should handle iOS Safari detection", () => {
      const content = fs.readFileSync(bannerPath, "utf-8");
      expect(content).toContain("isIOSSafari");
      expect(content).toContain("iPad|iPhone|iPod");
    });

    it("should have iOS install guide component", () => {
      const content = fs.readFileSync(bannerPath, "utf-8");
      expect(content).toContain("IOSInstallGuide");
      expect(content).toContain("เพิ่มไปยังหน้าจอโฮม");
    });

    it("should handle dismiss with localStorage persistence", () => {
      const content = fs.readFileSync(bannerPath, "utf-8");
      expect(content).toContain("localStorage");
      expect(content).toContain("pwa-banner-dismissed");
    });

    it("should detect standalone mode", () => {
      const hookContent = fs.readFileSync(hookPath, "utf-8");
      expect(hookContent).toContain("display-mode: standalone");
      expect(hookContent).toContain("standalone");
    });

    it("should handle beforeinstallprompt event", () => {
      const hookContent = fs.readFileSync(hookPath, "utf-8");
      expect(hookContent).toContain("beforeinstallprompt");
    });

    it("should handle appinstalled event", () => {
      const hookContent = fs.readFileSync(hookPath, "utf-8");
      expect(hookContent).toContain("appinstalled");
    });
  });

  describe("CSS PWA Support", () => {
    const cssPath = path.resolve(__dirname, "../client/src/index.css");

    it("should have safe area inset support", () => {
      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain("safe-area-inset");
    });

    it("should have overscroll-behavior for iOS", () => {
      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain("overscroll-behavior");
    });

    it("should have standalone display mode media query", () => {
      const content = fs.readFileSync(cssPath, "utf-8");
      expect(content).toContain("display-mode: standalone");
    });
  });
});
