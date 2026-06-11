# รายงานสิทธิ์การใช้งานระบบ — Hibi Matcha

## สรุปพนักงานทั้งหมดในระบบ

### พนักงานที่ Active (ใช้งานได้)

| รหัส | ชื่อ | ตำแหน่ง | สาขาหลัก | สถานะ |
|------|------|---------|----------|-------|
| HBHQ-00 | Updated Staff | super_admin | - (ไม่ผูกสาขา) | ✅ Active |
| HBHQ-01 | Nitiruj | super_admin | - (ไม่ผูกสาขา) | ✅ Active |
| HBCN-03 | Extra | super_admin | - (ไม่ผูกสาขา) | ✅ Active |
| TMD000 | พี่ชาติสุดหล่อ | super_admin | - (ไม่ผูกสาขา) | ✅ Active |
| EM009 | Dev.Paul | super_admin | - (ไม่ผูกสาขา) | ✅ Active |
| (ไม่มีรหัส) | Ramby | super_admin | - (ไม่ผูกสาขา) | ✅ Active |
| HBCN-01 | ชนากานต์ บุญเพ็ง(แทน) | area_manager | - (ดูแลหลายสาขา) | ✅ Active |
| HBCN-04 | parit sirisut | area_manager | - (ดูแลหลายสาขา) | ✅ Active |
| HB02 | Nawamin111 | branch_owner | HB03-Nawamin111 | ✅ Active |
| HB01-01 | ธีรภัทร์ อุ่นเพ็ญ(ปัน) | branch_manager | HB01-Ladprao107 | ✅ Active |
| HB02-01 | อรวรรณ ชิณศรี(แป้ง) | branch_manager | HB02-Samyan | ✅ Active |
| HB03-01 | อานีซะห์ สาและ(นี) | branch_manager | HB03-Nawamin111 | ✅ Active |
| HBCN-02 | ณัฐชยา แก้วศรี(มายด์) | branch_manager | HB04-Saphan Khwai | ✅ Active |
| HB05-01 | กัญญารัตน์ นิ่มอนงค์(เนย) | branch_manager | HB05-Nak Niwat48 | ✅ Active |
| HB01-04 | เมลดา กนกธำรงพัชร(เมย์) | branch_staff | HB01-Ladprao107 | ✅ Active |
| HB02-02 | อรพรรณ ย้อยนวล(ตอง) | branch_staff | HB02-Samyan | ✅ Active |
| HB04-01 | นัดดา ทองสุข(ชมพู่) | branch_staff | HB04-Saphan Khwai | ✅ Active |
| HB05-02 | ปลายฟ้า ศรีมีชัย | branch_staff | HB05-Nak Niwat48 | ✅ Active |
| (ไม่มีรหัส) | Commission Staff | branch_staff | HB01-Ladprao107 | ✅ Active |

### พนักงานที่ Inactive (ถูกระงับ)

| รหัส | ชื่อ | ตำแหน่ง | หมายเหตุ |
|------|------|---------|---------|
| EM007 | วาส | super_admin | ❌ ถูกระงับ |
| EM008 | วาส | super_admin | ❌ ถูกระงับ |
| HB01-02 | นภัสรภรณ์ ผุดแจ่มใส(เอ๊ะ) | branch_staff | ❌ ถูกระงับ |

---

## Area Manager — สาขาที่ดูแล

| รหัส | ชื่อ | สาขาที่ดูแล |
|------|------|------------|
| HBCN-01 | ชนากานต์ บุญเพ็ง(แทน) | HB01-Ladprao107, HB02-Samyan, HB04-Saphan Khwai, HB05-Nak Niwat48, Hibi House |
| HBCN-02 | ณัฐชยา แก้วศรี(มายด์) | HB01-Ladprao107, HB02-Samyan, HB04-Saphan Khwai, HB05-Nak Niwat48 |
| HBCN-03 | Extra | HB01-Ladprao107, HB02-Samyan, HB03-Nawamin111 |
| HBCN-04 | parit sirisut | HB01-Ladprao107 |

---

## ระบบทั้งหมดและสิทธิ์การเข้าถึงตามตำแหน่ง

### ระบบหลัก (Features)

| ระบบ | super_admin | area_manager | branch_owner | branch_manager | branch_staff |
|------|:-----------:|:------------:|:------------:|:--------------:|:------------:|
| **Dashboard & Reports** | ✅ ทุกสาขา | ✅ สาขาที่ดูแล | ✅ สาขาตนเอง | ✅ สาขาตนเอง | ❌ |
| **จัดการสาขา** | ✅ สร้าง/แก้/ลบ | ❌ | ❌ | ❌ | ❌ |
| **จัดการพนักงาน (ทั้งระบบ)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **จัดการพนักงาน (ในสาขา)** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **อนุมัติรีวิว** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ออกโค้ดชดเชย (CL)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ใช้โค้ด (Redeem)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ให้แต้มลูกค้า** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **หักแต้มลูกค้า** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **เงินสดย่อย (Petty Cash)** | ✅ ทุกสาขา | ✅ สาขาที่ดูแล | ✅ เติม+ดู | ✅ เบิก+ดู | ⚠️ ขึ้นกับ settings |
| **ยอดขายรายวัน (Daily Sales)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ปัญหาออเดอร์ (Order Issues)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ประกาศ (Announcements)** | ✅ สร้าง/แก้/ลบ | ✅ อ่าน | ✅ อ่าน | ✅ อ่าน | ✅ อ่าน |
| **แคมเปญเครื่องดื่มฟรี** | ✅ สร้าง/แก้ | ❌ | ❌ | ❌ | ❌ |
| **จัดการเมนูรีวิว** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **จัดการ Option Groups** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **จัดการ Reward Categories** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Site Content Management** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Franchise Owners** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Service Zones** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Impersonate (ทดสอบ)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Multi-Branch Overview** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Commission Reports** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **In-Store Product Sales** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Branch Menu Availability** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Password Reset (admin)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **ยกเลิกโค้ด** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **POS v2 (ระบบแยก)** | ✅ | ✅ | ✅ | ✅ | ✅ |

### ระบบลูกค้า (Customer-facing)

| ระบบ | ลูกค้า (customer) |
|------|:-----------------:|
| ดูแต้มสะสม | ✅ |
| ดูโค้ดของตนเอง | ✅ |
| เลือกเมนูจากโค้ด | ✅ |
| ส่งรีวิว | ✅ |
| แจ้งปัญหาออเดอร์ | ✅ |
| ดูประกาศ | ✅ |
| ยินยอม PDPA | ✅ |
| ติดต่อสอบถาม | ✅ (ไม่ต้อง login) |

---

## Permissions ที่กำหนดให้แต่ละคน (จาก DB)

### super_admin (ได้ทุก permission อัตโนมัติ — ไม่ต้องกำหนดแยก)
- HBHQ-00, HBHQ-01, HBCN-03, TMD000, EM009, Ramby

### area_manager

| รหัส | Permissions ที่กำหนด |
|------|---------------------|
| HBCN-01 | approve_reviews, manage_accounting, manage_customers, manage_issues, view_customers, view_reports |
| HBCN-04 | approve_points, approve_reviews, manage_customers, manage_issues, view_reports |

### branch_manager

| รหัส | Permissions ที่กำหนด |
|------|---------------------|
| HBCN-02 | approve_points, approve_reviews, manage_accounting, manage_issues |
| HB01-01 | (ไม่มี record — ใช้ default: approve_reviews, approve_points, manage_issues, manage_accounting) |
| HB02-01 | (ไม่มี record — ใช้ default) |
| HB03-01 | (ไม่มี record — ใช้ default) |
| HB05-01 | (ไม่มี record — ใช้ default) |

### branch_staff

| รหัส | Permissions ที่กำหนด |
|------|---------------------|
| Commission Staff | approve_points |
| HB01-04, HB02-02, HB04-01, HB05-02 | (ไม่มี record — ใช้ default: approve_points) |

---

## สาขาและสถานะระบบเงินสดย่อย

| สาขา | isActive | allowedRole | หมายเหตุ |
|------|:--------:|:-----------:|---------|
| HB01-Ladprao107 สาขาลาดพร้าว107 | ✅ | branch_manager | เฉพาะ manager เบิกได้ |
| HB02-Samyan สาขาสามย่าน | ✅ | branch_manager | เฉพาะ manager เบิกได้ |
| HB03-Nawamin111 สาขานวมินทร์ 111 | ✅ | both | manager + staff เบิกได้ |
| HB04-Saphan Khwai | ✅ | branch_manager | เฉพาะ manager เบิกได้ |
| HB05-Nak Niwat48 | ✅ | branch_manager | เฉพาะ manager เบิกได้ |
| test | ✅ | both | manager + staff เบิกได้ |
| Hibi House | ✅ | both | manager + staff เบิกได้ |

---

## ปัญหาที่พบ

1. **Ramby** (super_admin) และ **Commission Staff** (branch_staff) — ไม่มี employeeCode ทำให้ login ด้วยรหัสพนักงานไม่ได้
2. **EM007, EM008** (วาส) — ถูกระงับ (isActive = 0) ใช้งานไม่ได้
3. **HB01-02** (นภัสรภรณ์) — ถูกระงับ ใช้งานไม่ได้
4. **HBCN-04** (parit) — เป็น area_manager แต่ดูแลเฉพาะ HB01 สาขาเดียว
5. **HB04-01** (นัดดา) — เป็น branch_staff ที่ HB04 แต่ petty cash ตั้งเป็น `branch_manager` only → ไม่สามารถเบิกเงินสดย่อยได้
6. **HB05-02** (ปลายฟ้า) — เช่นเดียวกัน เป็น staff ที่ HB05 ซึ่ง petty cash ตั้งเป็น `branch_manager` only
