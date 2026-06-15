-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0049: Per-app unique constraints on review_requests
-- ─────────────────────────────────────────────────────────────────────────────
-- Purpose: Prevent duplicate reviews for the SAME order across delivery apps
-- using the canonical unique key for each app:
--   • Grab    → bookingId (A-XXXXXXXXXXXXXX) — unique; GF numbers recycle 1-999
--   • Shopee  → shopeeOrderId (16-20 digit)
--   • LINE MAN→ linemanOrderId (LMF-YYMMDD-XXXXXXXXX)
--   • GPOS    → no unique enforced here (orderId = 13-digit receipt; rely on app)
--
-- MySQL allows multiple NULLs in a unique index, so each row only enforces
-- on the column relevant to ITS deliveryApp. (Rows of other apps have NULL
-- in non-relevant columns and don't collide.)
--
-- ⚠️ PRE-FLIGHT REQUIRED before applying to production:
--   1. Run `pnpm tsx server/check-review-duplicates.mjs` to detect existing
--      duplicate (deliveryApp, bookingId/shopeeOrderId/linemanOrderId) rows.
--   2. Manually merge or reject any duplicates found.
--   3. Then apply this migration.
-- Adding UNIQUE on existing data WITH duplicates will fail with ER_DUP_ENTRY.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `review_requests` ADD CONSTRAINT `unique_review_grab_booking` UNIQUE(`deliveryApp`,`bookingId`);--> statement-breakpoint
ALTER TABLE `review_requests` ADD CONSTRAINT `unique_review_shopee_orderid` UNIQUE(`deliveryApp`,`shopeeOrderId`);--> statement-breakpoint
ALTER TABLE `review_requests` ADD CONSTRAINT `unique_review_lineman_orderid` UNIQUE(`deliveryApp`,`linemanOrderId`);

-- Note: This migration does NOT include detected drift between schema.ts
-- and production DB (e.g. user_oauth_links table, audienceType column,
-- pct_entryMethod column, dropped unique_delivery_order index). Those were
-- applied to DB out-of-band and the schema.ts was updated to match. We
-- intentionally exclude them so this migration can run cleanly on prod.
