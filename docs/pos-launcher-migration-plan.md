# POS → Launcher Migration Plan

**วันที่:** 2026-05-25  
**Scope:** ลบ 14 หน้า POS เดิม → แทนที่ด้วย 1 หน้า POSLauncher  
**Branch:** phase1-discovery  

---

## 1. Files to Delete (14 ไฟล์ + 2 supporting)

### POS Pages (14 ไฟล์ — 3,775 lines total)

| # | Path | Lines | Description |
|---|------|-------|-------------|
| 1 | `client/src/pages/pos/POSLogin.tsx` | 171 | Staff PIN login |
| 2 | `client/src/pages/pos/POSBranch.tsx` | 153 | Branch hub/dashboard |
| 3 | `client/src/pages/pos/POSTerminal.tsx` | 1,005 | Main POS terminal |
| 4 | `client/src/pages/pos/KitchenDisplay.tsx` | 155 | Kitchen ticket display |
| 5 | `client/src/pages/pos/MenuManagement.tsx` | 482 | Admin menu CRUD |
| 6 | `client/src/pages/pos/CategoryManagement.tsx` | 151 | Admin category CRUD |
| 7 | `client/src/pages/pos/OptionManagement.tsx` | 201 | Admin option groups |
| 8 | `client/src/pages/pos/RetailManagement.tsx` | 142 | Admin retail items |
| 9 | `client/src/pages/pos/DiscountManagement.tsx` | 137 | Admin discounts |
| 10 | `client/src/pages/pos/PaymentMethodManagement.tsx` | 128 | Admin payment methods |
| 11 | `client/src/pages/pos/StaffPinManagement.tsx` | 278 | Admin staff PINs |
| 12 | `client/src/pages/pos/OrderList.tsx` | 290 | Admin order list |
| 13 | `client/src/pages/pos/Reports.tsx` | 241 | Admin POS reports |
| 14 | `client/src/pages/pos/BranchMenuCatalog.tsx` | 241 | Branch menu catalog |

### Supporting Files (2 ไฟล์ — ลบได้เพราะไม่มีใครใช้นอก POS pages)

| # | Path | Description |
|---|------|-------------|
| 15 | `client/src/components/pos/ReceiptPrint.tsx` | ESC/POS receipt printing |
| 16 | `client/src/components/pos/KitchenTicketPrint.tsx` | Kitchen ticket printing |

### Context File (1 ไฟล์ — ลบได้)

| # | Path | Description |
|---|------|-------------|
| 17 | `client/src/contexts/POSBranchContext.tsx` | POS branch context (ใช้เฉพาะใน POS pages) |

**รวม: 17 ไฟล์ลบ, ~4,000+ lines removed**

---

## 2. Files to Create (1 ไฟล์)

| Path | Description |
|------|-------------|
| `client/src/pages/pos/POSLauncher.tsx` | หน้า launcher เดียว: เลือกสาขา + เปิด POS V2 |

**ขนาดประมาณ:** ~80-100 lines

---

## 3. Files to Modify (3 ไฟล์)

| Path | Changes |
|------|---------|
| `client/src/App.tsx` | ลบ 14 lazy imports (L112-125), ลบ 14 routes (L240-255), เพิ่ม 1 lazy import POSLauncher, เพิ่ม route `/pos` → POSLauncher, เพิ่ม catch-all `/pos/:rest*` → redirect to `/pos` |
| `client/src/pages/admin/AdminDashboard.tsx` | ลบ POS section ใน quickLinks (L272-280, 9 items), แทนที่ด้วย 1 link ไป `/pos` "เปิด POS V2", ลบ branch card link `/pos/${branch.id}` (L106) → เปลี่ยนเป็น `/pos` |
| `client/src/pages/admin/BranchManagement.tsx` | ลบ/แก้ link ไป `/admin/pos/staff-pins` (L143) → ลบหรือเปลี่ยนเป็น toast "ใช้ POS V2" |

---

## 4. Database Changes

**ไม่มี** — เก็บ tables ทั้งหมดไว้ (POS V2 จะ reuse):
- `pos_menu_items`, `pos_categories`, `pos_option_groups`, `pos_options`
- `pos_orders`, `pos_order_items`, `pos_discounts`
- `pos_payment_methods`, `pos_staff_pins`
- `pos_branch_menu_items`, `pos_retail_items`

---

## 5. API/Router Changes

**ไม่มี** — เก็บ `pos` router ใน `server/routers.ts` (L5133+) ทั้งหมดไว้ เพราะ:
- POS V2 จะเรียก API เดิมผ่าน tRPC
- Test files (`server/pos.test.ts`, `server/pos-enhancements.test.ts`) ยังต้อง pass

---

## 6. Environment Variables ที่ต้องเพิ่ม

| Variable | Value (placeholder) | Description |
|----------|-------------------|-------------|
| `VITE_POS_V2_URL` | `https://pos-v2.placeholder` | URL ของ POS V2 app (จะเปลี่ยนเป็น URL จริงทีหลัง) |

ใช้ `webdev_request_secrets` เพื่อ set ค่า

---

## 7. Edge Cases (8 กรณี)

| # | Case | Handling |
|---|------|----------|
| 1 | User กดลิงก์เก่า `/pos/1/terminal` | Catch-all route redirect ไป `/pos` (launcher) |
| 2 | User กดลิงก์เก่า `/admin/pos/menu` | Catch-all route redirect ไป `/pos` |
| 3 | User ไม่มีสาขา (admin ที่ไม่ผูกสาขา) | Super admin เห็นทุกสาขา (ใช้ `branches.list`), ถ้า list ว่าง → แสดง "ไม่พบสาขา" |
| 4 | Pop-up blocker block `window.open()` | Fallback: แสดง link ให้ user คลิกเอง + toast warning |
| 5 | Token expired ตอน redirect | ฝั่ง POS V2 handle — ไม่ต้องทำอะไรฝั่ง launcher (note ไว้ใน code comment) |
| 6 | `VITE_POS_V2_URL` ยังเป็น placeholder | แสดง warning badge "POS V2 ยังไม่พร้อม" + disable ปุ่ม หรือ toast warning |
| 7 | User ไม่ได้ login (ไม่มี hibi_session) | Redirect ไป login page (เหมือน pattern เดิมของ admin pages) |
| 8 | Branch dropdown มี 50+ สาขา | ใช้ searchable select (combobox) แทน plain dropdown |

---

## 8. Manual Test Scenarios (6 scenarios)

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | เปิด launcher ปกติ | Login → ไป `/pos` | เห็น dropdown สาขา + ปุ่ม "เปิด POS V2" |
| 2 | เลือกสาขา + เปิด POS V2 | เลือกสาขาจาก dropdown → กดปุ่ม | `window.open` ไป URL placeholder + params `?token=...&branch=ID` |
| 3 | กดลิงก์เก่า | ไป `/pos/1/terminal` | Redirect ไป `/pos` (launcher) |
| 4 | กดลิงก์ admin เก่า | ไป `/admin/pos/menu` | Redirect ไป `/pos` |
| 5 | ไม่เลือกสาขา + กดปุ่ม | กดปุ่มโดยไม่เลือก dropdown | ปุ่ม disabled หรือ toast error "กรุณาเลือกสาขา" |
| 6 | AdminDashboard links | ไป Admin Dashboard | POS section แสดง 1 link "เปิด POS V2" แทน 9 links เดิม |

---

## 9. Estimated Effort

**Medium (~3-4 ชั่วโมง)**

| Task | Time |
|------|------|
| ลบ 17 ไฟล์ | 5 min |
| สร้าง POSLauncher.tsx | 30 min |
| แก้ App.tsx (routes) | 20 min |
| แก้ AdminDashboard.tsx | 20 min |
| แก้ BranchManagement.tsx | 10 min |
| Set env variable | 5 min |
| TypeScript check + fix imports | 30 min |
| Run existing tests (ensure no break) | 15 min |
| Write vitest for launcher | 30 min |
| Manual test + polish | 30 min |

---

## 10. Risk Assessment

**ระดับ: ต่ำ-กลาง**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ลบไฟล์แล้ว import ค้างใน App.tsx | สูง | ต่ำ | `tsc --noEmit` จับได้ทันที |
| POS backend tests fail เพราะลบ frontend | ต่ำ | ต่ำ | ไม่แตะ server code — tests ทำงานอิสระ |
| User งง ที่ POS หายไป | กลาง | กลาง | แสดง message ชัดเจนใน launcher + redirect ลิงก์เก่า |
| AdminDashboard quick links section ว่างเกินไป | ต่ำ | ต่ำ | เก็บ 1 card "POS V2" ไว้ + อาจเพิ่ม description |
| `POSBranchContext` ถูกใช้ที่อื่นที่ไม่เห็น | ต่ำ | กลาง | `grep -rn` ยืนยันแล้วว่าใช้เฉพาะใน POS pages |

**Mitigation หลัก:**
- Checkpoint ก่อนเริ่มลบ (rollback ได้ทันที)
- `tsc --noEmit` หลังลบทุกไฟล์
- Run `pnpm test` ยืนยัน POS backend tests ยัง pass

---

## Implementation Order (เมื่อ approve)

1. Set `VITE_POS_V2_URL` env variable
2. สร้าง `POSLauncher.tsx`
3. แก้ `App.tsx` — เพิ่ม route ใหม่ + ลบ routes เก่า + ลบ lazy imports
4. ลบ 17 ไฟล์ POS
5. แก้ `AdminDashboard.tsx` — ลบ POS quick links, เพิ่ม 1 link launcher
6. แก้ `BranchManagement.tsx` — ลบ link ไป staff-pins
7. `tsc --noEmit` → 0 errors
8. `pnpm test` → all pass (POS backend tests ไม่กระทบ)
9. เขียน vitest สำหรับ launcher (ถ้าจำเป็น)
10. Save checkpoint
