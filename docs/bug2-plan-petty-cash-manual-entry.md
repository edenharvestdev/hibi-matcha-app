# Bug #2 Implementation Plan: PettyCash Scan/Manual Toggle

**วันที่:** 2026-05-25  
**สถานะ:** PLAN ONLY — รอ approve ก่อนเขียนโค้ด  
**Branch:** `phase1-discovery`

---

## 1. Files to Modify

| ไฟล์ | ประเภทการแก้ | รายละเอียด |
|------|-------------|------------|
| `client/src/pages/branch/PettyCash.tsx` | **Primary** | เพิ่ม mode toggle UI + state + validation logic + manual entry creation |
| `server/routers.ts` (L3470-3551) | **Secondary** | แก้ `addExpense` procedure: เปลี่ยน `receiptImages` จาก `.min(1)` เป็น `.min(0)` + เพิ่ม optional `entryMethod` field |
| `drizzle/schema.ts` (L696-711) | **Optional (Phase 2)** | เพิ่ม column `pct_entryMethod` ENUM('ocr','manual') — **เสนอเท่านั้น ยังไม่ apply** |

**ไฟล์ที่ไม่ต้องแก้:** `server/db.ts` (createPettyCashTransaction รับ object ตรงๆ ไม่ validate field), `client/src/components/ui/*` (ใช้ component ที่มีอยู่)

---

## 2. UI Changes

### 2.1 ตำแหน่งใน Dialog

ตำแหน่ง: **ใต้ DialogDescription, เหนือ hidden file inputs** (ระหว่าง L1042 กับ L1045)

```
DialogHeader (ลงรายจ่าย)
DialogDescription (แนบสลิป/ใบเสร็จ — แต่ละรูป = 1 รายการแยก)
─────────────────────────────────────────────
[📷 แนบสลิป (OCR)]  [✍️ กรอกเอง]     ← NEW: mode toggle
─────────────────────────────────────────────
(ถ้า scan mode) → ปุ่มถ่ายรูป + เลือกรูป
(ถ้า manual mode) → ปุ่ม "+ เพิ่มรายการ" สร้าง entry เปล่า
─────────────────────────────────────────────
Entry list (เหมือนเดิม — fields: amount, category, description, date)
Total summary
Submit button
```

### 2.2 Component Pattern

ใช้ **inline segmented button group** (2 ปุ่มติดกัน ใน `div` เดียว) ไม่ใช่ Tabs component เพราะ:
- Tabs ใช้สำหรับ content panels ขนาดใหญ่ (ดู PettyCash.tsx L749 — overview/transactions/deposits)
- ที่นี่เป็นแค่ toggle mode ขนาดเล็กภายใน dialog
- Pattern: `div.flex.gap-0.rounded-lg.border.overflow-hidden` + 2 ปุ่มที่ highlight ตาม state

```
<div className="flex rounded-lg border overflow-hidden">
  <button className={mode==='scan' ? 'bg-primary text-white' : 'bg-muted'}>📷 แนบสลิป</button>
  <button className={mode==='manual' ? 'bg-primary text-white' : 'bg-muted'}>✍️ กรอกเอง</button>
</div>
```

### 2.3 State ที่ต้องเพิ่ม

```typescript
const [expenseMode, setExpenseMode] = useState<'scan' | 'manual'>('scan');
```

- **Default = `'scan'`** — เพื่อ encourage OCR usage (ตาม requirement)
- Reset เมื่อ `resetExpenseForm()` ถูกเรียก (กลับเป็น `'scan'`)

### 2.4 Manual Mode: ปุ่ม "+ เพิ่มรายการ"

เมื่อ `expenseMode === 'manual'`:
- ซ่อนปุ่ม "ถ่ายรูป" + "เลือกรูป"
- แสดงปุ่ม **"+ เพิ่มรายการ"** ที่สร้าง entry เปล่า:

```typescript
const addManualEntry = () => {
  const newEntry: ExpenseEntry = {
    id: crypto.randomUUID(),
    amount: '',
    description: '',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    note: '',
    receipts: [],        // ← ว่าง (ไม่บังคับรูป)
    ocrResult: null,
    ocrLoading: false,
    ocrProgress: 0,
    confidence: null,
  };
  setExpEntries(prev => [...prev, newEntry]);
};
```

- จำกัด max 10 entries เหมือนเดิม (`expEntries.length >= 10` → disable ปุ่ม)
- **Optional:** ยังสามารถแนบรูปเพิ่มได้ทีหลัง (ปุ่มเล็กๆ ใน entry card) — **Phase 2**

---

## 3. Validation Changes

### 3.1 Client-side (`handleSubmitExpense`)

| เงื่อนไข | ปัจจุบัน (L556) | หลังแก้ |
|-----------|-----------------|---------|
| Entry count | `expEntries.length === 0` → block | เหมือนเดิม (ทั้ง 2 mode ต้องมีอย่างน้อย 1 entry) |
| Receipt required | implicit (entry สร้างจากรูปเท่านั้น) | **scan mode:** เหมือนเดิม (entry มีรูปเสมอ) / **manual mode:** ไม่ check รูป |
| Amount required | `!amount \|\| amount <= 0` → error | เหมือนเดิม (ทั้ง 2 mode) |
| Description required | `!entry.description.trim()` → error | เหมือนเดิม (ทั้ง 2 mode) |

**Error message เปลี่ยน:**
- ปัจจุบัน: `"กรุณาแนบรูปสลิป/ใบเสร็จอย่างน้อย 1 รายการ"` (L556)
- หลังแก้: ข้อความนี้จะ **ไม่แสดง** ใน manual mode (เพราะ entry สร้างจากปุ่ม ไม่ใช่จากรูป)
- แทนที่ด้วย: `"กรุณาเพิ่มรายการอย่างน้อย 1 รายการ"` (generic สำหรับทั้ง 2 mode)

### 3.2 Server-side (`addExpense` procedure, L3475-3479)

**ปัจจุบัน:**
```typescript
receiptImages: z.array(z.object({...})).min(1, "กรุณาแนบรูปสลิป/ใบเสร็จอย่างน้อย 1 รูป"),
```

**หลังแก้:**
```typescript
receiptImages: z.array(z.object({...})).default([]),  // ← min(0), allow empty
entryMethod: z.enum(['ocr', 'manual']).optional(),    // ← NEW: track source
```

- `receiptUrl` ใน DB จะเป็น `null` สำหรับ manual entries (column เป็น nullable อยู่แล้ว ✓)
- ไม่มี receipt_images row สำหรับ manual entries (loop `for (const img of input.receiptImages)` จะ skip เพราะ array ว่าง)

### 3.3 Submit button disable condition

**ปัจจุบัน (L1271):**
```
disabled={addExpenseMut.isPending || expEntries.length === 0 || expEntries.some(e => e.ocrLoading)}
```

**หลังแก้:**
```
disabled={addExpenseMut.isPending || expEntries.length === 0 || expEntries.some(e => e.ocrLoading)}
```
→ **ไม่เปลี่ยน** — เงื่อนไขเดิมใช้ได้ทั้ง 2 mode (manual entries ไม่มี ocrLoading)

---

## 4. Database Changes

### 4.1 สถานะปัจจุบัน

ตาราง `petty_cash_transactions` **ไม่มี** column `entry_method` หรือ `source`:

```sql
CREATE TABLE petty_cash_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pct_branchId INT NOT NULL,
  pct_type ENUM('deposit','expense','adjustment') NOT NULL,
  pct_amount INT NOT NULL,
  pct_description VARCHAR(500) NOT NULL,
  pct_category VARCHAR(100),
  pct_receiptUrl VARCHAR(1000),      -- nullable ✓ (manual entries = NULL)
  pct_transferMethod ENUM('cash','transfer','promptpay'),
  pct_transactionDate TIMESTAMP NOT NULL,
  pct_balanceAfter INT NOT NULL,
  pct_createdBy INT NOT NULL,
  pct_createdByName VARCHAR(255),
  pct_note TEXT,
  pct_createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 Proposal: เพิ่ม `pct_entryMethod` column

```sql
ALTER TABLE petty_cash_transactions
ADD COLUMN pct_entryMethod ENUM('ocr','manual') DEFAULT NULL;
```

**เหตุผล:**
- Track ว่า entry มาจาก OCR scan หรือกรอกเอง
- ใช้สำหรับ analytics: % ของ entry ที่ใช้ OCR vs manual
- `DEFAULT NULL` = backward compatible (entry เก่าทั้งหมดจะเป็น NULL = ถือว่า 'ocr' โดย implicit)

**ข้อเสนอ:**
- **Option A (แนะนำ):** เพิ่ม column นี้ตอน implement — additive, ไม่กระทบ data เก่า, 1 ALTER TABLE
- **Option B:** Skip ไปก่อน — ใช้ `pct_receiptUrl IS NULL` เป็น proxy สำหรับ manual (แต่ไม่ precise เพราะ OCR fail + user ลบรูปก็เป็น NULL ได้)

**รอ confirm จาก user ว่าจะเลือก Option A หรือ B**

---

## 5. Edge Cases

| # | กรณี | การจัดการ |
|---|------|-----------|
| 1 | **สลับจาก scan → manual กลางทาง** (มี entries จากรูปแล้ว) | **เก็บ entries ไว้ทั้งหมด** — ไม่ลบ ไม่ reset; entries ที่มีรูปจะยังแสดงรูป; user สามารถเพิ่ม manual entry เข้าไปอีก; submit จะส่งทั้งหมดรวมกัน |
| 2 | **สลับจาก manual → scan กลางทาง** (มี manual entries แล้ว) | **เก็บ entries ไว้ทั้งหมด** — เหมือนข้อ 1; user สามารถถ่ายรูปเพิ่ม (สร้าง entry ใหม่จาก OCR); submit ส่งทั้งหมด |
| 3 | **Manual entry ที่ไม่กรอก amount/description** | Validation เดิมจับได้: `"รายการ 01: กรุณากรอกจำนวนเงิน"` / `"กรุณากรอกรายละเอียด"` — ไม่ต้องแก้ |
| 4 | **Manual entry + อยากแนบรูปทีหลัง** | **Phase 1:** ไม่รองรับ (ต้องสลับไป scan mode แล้วถ่ายรูปใหม่ = entry ใหม่) / **Phase 2:** เพิ่มปุ่ม "แนบรูป" ใน entry card |
| 5 | **Backward compatibility — entry เก่าใน DB** | ไม่กระทบ: `pct_entryMethod = NULL` สำหรับ entry เก่า; UI แสดงรูปจาก `receipt_images` ตามปกติ; ถ้าไม่มีรูปก็ไม่แสดง |
| 6 | **Server reject เพราะ receiptImages.min(1)** | ต้องแก้ server validation ก่อน deploy — ถ้าแก้แค่ client จะ error 400 |
| 7 | **expEntries.length >= 10 (max limit)** | ทั้ง 2 mode ใช้ limit เดียวกัน — ปุ่ม "เพิ่มรายการ" disable เมื่อถึง 10 |
| 8 | **Dialog close แล้วเปิดใหม่** | `resetExpenseForm()` clear ทุกอย่าง + reset mode กลับเป็น `'scan'` |
| 9 | **OCR loading ขณะสลับ mode** | ไม่ block การสลับ — entries ที่กำลัง OCR ยังทำงานต่อ; submit button ยัง disabled จนกว่า OCR เสร็จ |
| 10 | **Amount = 0 หรือ negative ใน manual mode** | Validation เดิมจับ: `!amount || amount <= 0` → error toast |

---

## 6. Manual Test Scenarios

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | เปิด dialog → เลือก "กรอกเอง" → กด "+ เพิ่มรายการ" → กรอก amount + description → กด "บันทึก" | บันทึกสำเร็จ, toast แสดงยอดคงเหลือ, `pct_receiptUrl = NULL`, `pct_entryMethod = 'manual'` |
| 2 | เปิด dialog → default "แนบสลิป" → ถ่ายรูป → OCR อ่าน → แก้ข้อมูล → กด "บันทึก" | บันทึกสำเร็จ (flow เดิม), รูปอยู่ใน S3, `pct_entryMethod = 'ocr'` |
| 3 | เปิด dialog → "แนบสลิป" → ถ่ายรูป 1 → สลับไป "กรอกเอง" → กด "+ เพิ่มรายการ" → กรอกข้อมูล → กด "บันทึก" | บันทึก 2 รายการ: entry 1 มีรูป, entry 2 ไม่มีรูป |
| 4 | เปิด dialog → "กรอกเอง" → กด "+ เพิ่มรายการ" → ไม่กรอก amount → กด "บันทึก" | Toast error: "รายการ 01: กรุณากรอกจำนวนเงิน" |
| 5 | เปิด dialog → "กรอกเอง" → ไม่เพิ่มรายการ → กด "บันทึก" | Toast error: "กรุณาเพิ่มรายการอย่างน้อย 1 รายการ" |
| 6 | เปิด dialog → "กรอกเอง" → เพิ่ม 3 รายการ → ลบรายการ 2 → กด "บันทึก" | บันทึก 2 รายการ, numbering ถูกต้อง (01, 02) |
| 7 | เปิด dialog → ทำอะไรก็ได้ → ปิด dialog → เปิดใหม่ | Mode กลับเป็น "แนบสลิป", entries ว่าง |
| 8 | เปิด dialog → "แนบสลิป" → ถ่ายรูป → OCR กำลังทำงาน → สลับไป "กรอกเอง" | OCR ยังทำงานต่อ, entry จากรูปยังแสดง, submit disabled จนกว่า OCR เสร็จ |

---

## 7. Estimated Effort

**Small (< 1 day)**

| งาน | เวลาโดยประมาณ |
|------|---------------|
| Client: เพิ่ม mode toggle + manual entry button + validation | 30-45 นาที |
| Server: แก้ `receiptImages` validation + เพิ่ม `entryMethod` field | 15 นาที |
| DB: ALTER TABLE (ถ้าเลือก Option A) | 5 นาที |
| Schema.ts: เพิ่ม column definition | 5 นาที |
| Vitest: เขียน test สำหรับ addExpense with empty receipts | 20 นาที |
| Manual testing (8 scenarios) | 20 นาที |
| **รวม** | **~2 ชั่วโมง** |

---

## 8. ความเสี่ยง

| ระดับ | ความเสี่ยง | Mitigation |
|-------|-----------|------------|
| **ต่ำ** | Additive change — ไม่ลบ feature เดิม, ไม่แก้ logic เดิม | Default mode = 'scan' ทำให้ user ส่วนใหญ่ยังใช้ flow เดิม |
| **ต่ำ** | DB migration (ถ้าเลือก Option A) | `ALTER TABLE ADD COLUMN ... DEFAULT NULL` — ไม่กระทบ row เดิม, ไม่ lock table นาน (TiDB online DDL) |
| **ต่ำ** | Server validation change (min(1) → min(0)) | ยังมี client-side check ว่าต้องมีอย่างน้อย 1 entry; server แค่ไม่ reject empty receipt array |
| **ต่ำมาก** | Regression ใน scan mode | ไม่แก้ `handleReceiptCapture` / `triggerOcr` / OCR flow เลย — แค่ซ่อน/แสดง UI ตาม mode |
| **ไม่มี** | Data loss | ไม่ DROP column, ไม่ DELETE data, ไม่แก้ existing records |

**หมายเหตุเรื่อง Project Knowledge:**

> "for every petty cash disbursement, the system must require an attached image of the receipt or slip, and this step should be mandatory"

ข้อนี้เป็น original design requirement ที่ระบุว่า **ต้องแนบรูปเสมอ** แต่ user ได้ request ให้เพิ่ม "กรอกเอง" option อย่างชัดเจน ซึ่งหมายความว่า requirement เปลี่ยนแล้ว — manual mode เป็น exception สำหรับกรณีที่ไม่มีสลิป/สลิปหาย โดย default ยังคงเป็น scan mode เพื่อ encourage การแนบรูป

---

## สรุป Implementation Order

```
1. ALTER TABLE (ถ้า approve Option A)
2. drizzle/schema.ts — เพิ่ม pct_entryMethod column
3. server/routers.ts — แก้ addExpense validation
4. client PettyCash.tsx — เพิ่ม UI toggle + manual entry logic
5. Vitest — เขียน test
6. npx tsc --noEmit → 0 errors
7. pnpm test → all pass
8. Manual test 8 scenarios
9. webdev_save_checkpoint
```

---

**รอ approve plan ก่อนเริ่มเขียนโค้ด**
