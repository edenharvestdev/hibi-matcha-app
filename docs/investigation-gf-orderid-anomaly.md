# Investigation Report: GF OrderId Anomaly (GF-1190, GF-3831)

**Date:** 2026-05-26  
**Investigator:** Manus  
**Status:** Root cause identified — **User Input Error (ไม่ใช่ Bug ของระบบ)**

---

## 1. Summary

ระบบ **ไม่มี** code ที่ generate หรือ auto-append ตัวเลข/ตัวอักษรต่อท้าย GF number ปัญหาที่เกิดขึ้นเป็น **User Input Error** — ลูกค้ากรอกเลข GF ผิดเอง (พิมพ์เกินมา 1 ตัว)

---

## 2. Logic ปัจจุบัน (How orderId is generated)

### Frontend Flow (SubmitReview.tsx L221, ClaimPoints.tsx L259)

```
User กรอก gfNumber ใน Input field → trim() → ส่งเป็น orderId ตรงๆ
```

**ไม่มี:**
- Auto-formatting
- Prefix/suffix generation
- Number incrementing
- Retry with suffix logic
- Race condition handling (ไม่มี counter)

### Server Flow (routers.ts L809-869)

```
1. รับ input.orderId (= gfNumber ที่ user กรอก)
2. checkApprovedReviewExists(deliveryApp, orderId) → exact match
3. ถ้าไม่ซ้ำ → INSERT ลง DB ตรงๆ
4. ถ้า ER_DUP_ENTRY → throw CONFLICT error (ไม่ retry, ไม่ append suffix)
```

### Dedup Logic (db.ts L241-276)

```ts
// Grab: exact match on orderId
eq(reviewRequests.orderId, orderId)  // ← exact string match
```

**สำคัญ:** ระบบ dedup ใช้ **exact match** — ดังนั้น `GF-383` กับ `GF-3831` เป็นคนละ orderId ระบบจึงอนุญาตให้ insert ได้ทั้งคู่

---

## 3. Root Cause Analysis

### สาเหตุ: User Input Error

**หลักฐาน:**

| Evidence | Detail |
|----------|--------|
| **ไม่มี suffix logic ใน code** | ไม่มี function ไหนที่ append ตัวเลขต่อท้าย orderId |
| **Audit log ยืนยัน** | `submit_review: grab #GF-3831` — server รับค่า `GF-3831` มาจาก client ตรงๆ |
| **ลูกค้าคนเดียวกัน (4050002)** | ทั้ง GF-1190 และ GF-3831 มาจาก customer เดียวกัน |
| **Input field ไม่มี validation** | `onChange={(e) => setGfNumber(e.target.value)}` — รับทุกอย่างที่พิมพ์ |
| **ไม่มี format validation** | ไม่มี regex check ว่า GF number ต้องเป็น `GF-` + 1-3 digits เท่านั้น |
| **Grab GF numbers wrap at 999** | Max GF ในระบบ = 998, Min = 7 — Grab ใช้ 1-3 digits แล้ว reset |

### สมมติฐานที่ถูกตัดออก:

| Hypothesis | Why Eliminated |
|------------|----------------|
| Race condition | ไม่มี counter/sequence — user กรอกเอง |
| Retry + suffix | ไม่มี retry logic ใน submitReview |
| Server auto-append | Audit log แสดง orderId ที่รับมาจาก client ตรงๆ |
| OCR misread | SubmitReview ไม่มี OCR สำหรับ GF number |
| Database sequence | orderId ไม่ใช่ auto-increment |

---

## 4. Anomalous Records

### Type A: Suffix Digit (ลูกค้าพิมพ์เลขเกิน) — 2 records

| orderId | Customer | Branch | Date | Original GF |
|---------|----------|--------|------|-------------|
| GF-1190 | 4050002 | 30001 | 2026-05-25 | GF-119 (customer 8040004, branch 30001) |
| GF-3831 | 4050002 | 60001 | 2026-05-26 | GF-383 (customer 8220002, branch 2) |

> **ทั้ง 2 records มาจาก customer 4050002 คนเดียวกัน** — น่าจะเป็นลูกค้าที่พิมพ์เลขไม่ระวัง

### Type B: Suffix Letter (Grab format ใหม่?) — 4 records

| orderId | Customer | Branch | Date |
|---------|----------|--------|------|
| GF-816T | 3900003 | 2 | 2026-03-28 |
| GF-977T | 4500001 | 2 | 2026-04-04 |
| GF-129F | 8010002 | 60001 | 2026-05-08 |
| GF-487T | 8400002 | 2 | 2026-05-14 |

> **อาจเป็น Grab format ใหม่** ที่มีตัวอักษรต่อท้าย (T, F) — ต้อง verify กับ Grab จริง

### Type C: Test data — 1 record

| orderId | Note |
|---------|------|
| GF-TEST-001 | Test data จาก dev |

---

## 5. ความถี่ของปัญหา

| Metric | Value |
|--------|-------|
| Total Grab reviews | 218 |
| Normal format (GF-1 to GF-999) | 210 (96.3%) |
| Anomalous (all types) | 8 (3.7%) |
| **Suffix digit (bug ที่ถามถึง)** | **2 records (0.9%)** |
| Suffix letter (อาจเป็น format ใหม่) | 4 records (1.8%) |
| Test data | 1 record |
| Other | 1 record |
| **ลูกค้าที่ทำผิดซ้ำ** | **1 คน (customer 4050002)** |
| **ช่วงเวลาที่เกิด** | 2026-05-25 ถึง 2026-05-26 (2 วันล่าสุด) |

---

## 6. ทำไมระบบไม่ block

**เพราะ:**
1. `review_requests` table **ไม่มี unique constraint** บน `(deliveryApp, orderId)` — ต่างจาก `point_claims` ที่มี `unique_claim_delivery_order`
2. Dedup check ใช้ **exact match** — `GF-383` ≠ `GF-3831` จึงไม่ถูก block
3. Input field **ไม่มี format validation** — ไม่มี regex ตรวจว่า GF number ต้องเป็น 1-3 digits

---

## 7. Recommended Fixes (ไม่ได้ apply — รายงานเท่านั้น)

### Fix 1: Frontend Input Validation (แนะนำ — impact ต่ำ, ป้องกันได้ทันที)

```tsx
// เพิ่ม regex validation ใน SubmitReview.tsx + ClaimPoints.tsx
const GF_REGEX = /^GF-\d{1,3}[A-Z]?$/;
// หรือถ้า Grab มี format ใหม่:
const GF_REGEX = /^GF-\d{1,3}[A-Z]?$/;
```

**File:** `client/src/pages/customer/SubmitReview.tsx` L196-197  
**File:** `client/src/pages/customer/ClaimPoints.tsx` L245-249

### Fix 2: Server-side Validation (defense in depth)

```ts
// routers.ts L809 — เพิ่มใน submitReview mutation
if (input.deliveryApp === 'grab') {
  if (!/^GF-\d{1,3}[A-Z]?$/.test(input.orderId)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "เลข GF ไม่ถูกต้อง — ต้องเป็น GF- ตามด้วยตัวเลข 1-3 หลัก (เช่น GF-383)" });
  }
}
```

**File:** `server/routers.ts` L809 (submitReview) + L1329 (submitClaim)

### Fix 3: Unique Constraint (ป้องกัน duplicate ที่ DB level)

```sql
-- เพิ่ม unique constraint เหมือน point_claims
ALTER TABLE review_requests ADD UNIQUE INDEX unique_review_delivery_order (deliveryApp, orderId);
```

> **⚠️ ต้องระวัง:** ถ้ามี GF number ซ้ำข้ามสาขา (Grab reset GF ทุกวัน) อาจต้องเป็น `(deliveryApp, orderId, branchId)` แทน

### Fix 4: Data Correction (สำหรับ 2 records ที่ผิด)

ต้อง verify กับลูกค้า/Grab ว่า GF number จริงคืออะไร แล้ว UPDATE orderId + gfNumber

---

## 8. Conclusion

**ไม่ใช่ bug ของระบบ** — เป็น user input error จากลูกค้า 1 คน (customer 4050002) ที่พิมพ์เลข GF เกินมา 1 ตัว (GF-119 → GF-1190, GF-383 → GF-3831)

**ระบบขาด:**
1. Input format validation (frontend + server)
2. Unique constraint บน review_requests (ต่างจาก point_claims ที่มี)

**ไม่มี:** race condition, retry logic, auto-suffix, counter bug, OCR misread
