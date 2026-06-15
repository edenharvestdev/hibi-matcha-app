# Migration Plan: Manus → Google Cloud

> **Goal**: ย้าย Hibi Matcha App ออกจาก Manus stack ไป Google Cloud ทั้งหมด
> เพื่อ vendor independence, control, และ flexibility ระยะยาว
> **Started**: 15 มิ.ย. 2026
> **Estimated**: ~15 working days + 1 week monitor

## Decisions (locked)

| Choice | Selected |
|---|---|
| Cloud platform | **Google Cloud** (Cloud SQL + GCS + Cloud Run + Cloud CDN) |
| GCP account | คุณยังไม่มี → ผมจะ guide setup |
| Region | `asia-southeast1` (Singapore) — ใกล้ลูกค้า TH สุด |
| Manus OAuth | **ตัดทิ้ง** — ใช้แค่ phone+password / Google / Facebook / LINE |
| AI/LLM (voice + OCR) | **OpenAI** (Whisper + GPT-4o vision) |
| URL strategy | **Cloud CDN หน้า GCS** — URL stable + เร็ว |
| Migration scope | **Full** — DB + 1,487 ไฟล์ |
| Downtime tolerance | **Near-zero** (target) — fallback dump-and-cutover ตอน off-hours |

## Folder structure ใน GCS (final)

```
gs://hibimatcha-data/                     asia-southeast1, single bucket
│
├── customers/                            👥 ลูกค้าสร้าง (PDPA-relevant)
│   ├── reviews/{deliveryApp}/{customerId}/{ts}-{nanoid}.{ext}
│   ├── point-claims/{customerId}/{ts}-{nanoid}.{ext}
│   ├── order-issues/{customerId}/{ts}-{nanoid}.{ext}
│   └── shop-payment-slips/{orderNumber}/{ts}-{nanoid}.{ext}
│
├── staff/                                👨‍💼 พนักงาน/สาขาสร้าง
│   ├── petty-cash/{branchId}/{YYYY-MM}/{ts}-{nanoid}.{ext}
│   └── in-store-slips/{branchId}/{YYYY-MM}/{ts}-{nanoid}.{ext}
│
├── content/                              🎨 admin upload (ไม่กระทบ PDPA)
│   ├── announcements/{ts}-{nanoid}.{ext}
│   ├── rewards/{ts}-{nanoid}.{ext}
│   ├── shop-products/{productId}-{ts}.{ext}
│   ├── pos-menu/{ts}-{nanoid}.{ext}
│   └── site/{key}-{ts}-{nanoid}.{ext}
│
└── system/                               ⚙️ backups + reports
    ├── db-snapshots/YYYY-MM-DD/snapshot.sql.gz
    └── reports/YYYY-MM/{report-name}.{ext}
```

URL pattern (ผ่าน CDN): `https://cdn.hibimatcha.love/customers/reviews/grab/4050002/1234567890-abc.jpg`

## Key prefix mapping (เก่า → ใหม่)

| Old (Manus key prefix) | New (GCS path) |
|---|---|
| `reviews/{customerId}-{ts}-{nanoid}.{ext}` | `customers/reviews/{deliveryApp}/{customerId}/{ts}-{nanoid}.{ext}` |
| `orders/{customerId}-{ts}-{nanoid}.{ext}` | `customers/reviews/{deliveryApp}/{customerId}/order-{ts}-{nanoid}.{ext}` |
| `point-claims/{customerId}-{ts}-{nanoid}.{ext}` | `customers/point-claims/{customerId}/{ts}-{nanoid}.{ext}` |
| `issues/{customerId}-{ts}-{nanoid}.{ext}` | `customers/order-issues/{customerId}/{ts}-{nanoid}.{ext}` |
| `shop-slips/{orderNumber}-{ts}.{ext}` | `customers/shop-payment-slips/{orderNumber}/{ts}.{ext}` |
| `petty-cash/{branchId}-{ts}-{nanoid}.{ext}` | `staff/petty-cash/{branchId}/{YYYY-MM}/{ts}-{nanoid}.{ext}` |
| `in-store-slips/{ts}.{ext}` | `staff/in-store-slips/{branchId}/{YYYY-MM}/{ts}.{ext}` |
| `announcements/{ts}-{nanoid}.{ext}` | `content/announcements/{ts}-{nanoid}.{ext}` |
| `rewards/{ts}-{nanoid}.{ext}` | `content/rewards/{ts}-{nanoid}.{ext}` |
| `shop-products/{ts}-{name}.{ext}` | `content/shop-products/{productId}-{ts}.{ext}` |
| `pos-menu-images/{ts}-{nanoid}.{ext}` | `content/pos-menu/{ts}-{nanoid}.{ext}` |
| `site-content/{key}-{ts}-{nanoid}.{ext}` | `content/site/{key}-{ts}-{nanoid}.{ext}` |

## Sprint plan + status

- [ ] **Sprint 0 — Pre-flight** (2-3 วัน) ← **ปัจจุบัน**
  - [ ] คุณ: สมัคร GCP account + activate billing — ดู `GCP-SETUP-GUIDE.md`
  - [ ] คุณ: สร้าง Project, Cloud SQL instance, GCS bucket
  - [ ] คุณ: สร้าง service account + ดาวน์โหลด key.json
  - [ ] คุณ: ส่งข้อมูล Project ID + JSON key ให้ผม
  - [ ] ผม: เขียน OpenAI integration spec
  - [ ] ผม: ตรวจสอบ TiDB binlog availability (replication feasibility)

- [ ] **Sprint 1 — Storage layer** (3-4 วัน)
  - [ ] เขียน `server/_core/storage-gcs.ts` (replace `server/storage.ts`)
  - [ ] เขียน helper `server/_core/storageKeys.ts` — `buildCustomerReviewKey`, `buildStaffPettyCashKey`, etc.
  - [ ] DB schema: เพิ่ม `imageKey` column ทุกตารางที่มี `imageUrl` (parallel — ยังไม่ลบของเก่า)
  - [ ] แก้ทุก storagePut() 12 จุด → ใช้ helper + เก็บทั้ง URL (เก่า) + key (ใหม่) ใน DB
  - [ ] Setup GCS bucket + IAM + lifecycle rules (90 วัน → Nearline)
  - [ ] Setup Cloud CDN + custom domain `cdn.hibimatcha.love`
  - [ ] Tests: upload integration test ใหม่

- [ ] **Sprint 2 — AI rewrite** (2 วัน)
  - [ ] Voice transcription: `server/_core/voiceTranscription.ts` → OpenAI Whisper
  - [ ] OCR petty cash: `server/lib/petty-cash-ocr.ts` → GPT-4o vision
  - [ ] เพิ่ม `OPENAI_API_KEY` env
  - [ ] A/B test เทียบผลลัพธ์ Manus vs OpenAI

- [ ] **Sprint 3 — Cloud SQL** (2-3 วัน)
  - [ ] ผม: research TiDB binlog → decide replication vs dump-cutover
  - [ ] dump TiDB → restore Cloud SQL → verify row counts
  - [ ] ทดสอบ app ต่อ Cloud SQL บน staging (DATABASE_URL switch)
  - [ ] Schema diff verify (drift จาก Sprint 1)

- [ ] **Sprint 4 — File migration** (2 วัน)
  - [ ] Script: list ไฟล์ Manus + read URL จาก DB → download
  - [ ] Script: upload to GCS ตาม folder structure ใหม่
  - [ ] Script: update DB — เก็บ key column (URL เก่ายังใช้ได้ — graceful)
  - [ ] Run บน staging ก่อน
  - [ ] Verify: random spot check 50 ไฟล์

- [ ] **Sprint 5 — Remove Manus OAuth** (1 วัน)
  - [ ] ลบ `OAUTH_SERVER_URL`, `OWNER_OPEN_ID` จาก env
  - [ ] ลบ Manus OAuth callback handler
  - [ ] Migration plan สำหรับลูกค้าที่เคย login ด้วย Manus → email แจ้งสลับ

- [ ] **Sprint 6 — Cutover** (1 วัน + monitor)
  - [ ] Deploy backend ไป Cloud Run (asia-southeast1)
  - [ ] DNS switch
  - [ ] Smoke test: register, login, claim, review, petty cash, push notification
  - [ ] Monitor 24 ชม.

- [ ] **Sprint 7 — Decommission** (1 วัน)
  - [ ] หลัง 30 วัน: ปิด TiDB Cloud
  - [ ] ปิด Manus storage
  - [ ] Update docs

## Cost estimate (เดือนละ)

| Service | Spec | Price |
|---|---|---|
| Cloud SQL `db-g1-small` MySQL 8.0 | 1.7GB RAM, 20GB SSD, daily backup | ~$30 (≈1,100฿) |
| Cloud Storage Standard | 50GB + 100GB egress | ~$15 (≈550฿) |
| Cloud CDN | 100GB CDN egress | ~$8 (≈300฿) |
| Cloud Run | always-on, e2-small equiv | ~$15 (≈550฿) |
| OpenAI API | ~1,000 voice transcribes + 500 OCR/mo | ~$10 (≈350฿) |
| Misc (logs, monitoring) | | ~$5 |
| **Total** | | **~$85/mo (≈ 3,000 ฿)** |

**Note**: ลด ~$15 ได้ถ้าใช้ Cloud Run scale-to-zero (แต่ cold start +1-2 วินาที)

## Risks tracked

- 🔴 **TiDB binlog**: Serverless tier อาจไม่เปิด binlog → replication ไม่ได้ → fallback dump-and-cutover (downtime 10-30 นาที)
- 🟡 **Existing Manus OAuth users**: ต้องนับว่ามีกี่คน + plan การ migrate
- 🟡 **DNS propagation**: cutover DNS อาจใช้เวลา 1-24 ชม.
- 🟢 **POS V2 external**: แยก app ไม่กระทบ
- 🟢 **Git backup**: session token หมดอายุแล้ว ตัดทิ้งได้

## Rollback plan

ทุก sprint จะมี rollback strategy ระบุชัด ก่อน execute Sprint 6 (cutover) ต้อง:
1. มี TiDB Cloud snapshot ล่าสุด (< 24 ชม.)
2. Backend code revert ได้ผ่าน `git revert`
3. DNS TTL ลด → 60 วิ ก่อน cutover (เผื่อ rollback DNS)
4. Manus storage ค้างไว้ 30 วันหลัง migrate (รอ verify)
