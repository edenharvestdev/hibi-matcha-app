# Sprint 0: Google Cloud Setup Guide

> Step-by-step สำหรับคุณทำตาม
> ใช้เวลาประมาณ **1-2 ชั่วโมง** + รอ verification ของ Google
> ทุก step มี ✅ checkbox ให้กากบาทเมื่อเสร็จ

---

## ✋ ก่อนเริ่ม — สิ่งที่ต้องเตรียม

- [x] บัตรเครดิต/เดบิต ที่จ่าย **USD** ได้ (Google Cloud bill เป็น USD)
  - แนะนำบัตร KBank Debit Visa หรือ KTC ที่เปิดใช้งานต่างประเทศแล้ว
- [x] หมายเลขโทรศัพท์มือถือสำหรับยืนยัน SMS
- [x] Google account (ถ้ามี Gmail ใช้อันนั้นได้เลย)
- [x] เวลาว่าง 1-2 ชั่วโมง ติดต่อกัน

---

## Step 1: สร้าง Google Cloud account (15 นาที)

- [x] **1.1** เปิด [https://console.cloud.google.com](https://console.cloud.google.com)
- [x] **1.2** Login ด้วย Google account
- [x] **1.3** ยอมรับ Terms of Service (มี "Free trial $300" สำหรับ account ใหม่ — ใช้ได้ 90 วัน)
- [x] **1.4** กด **Activate** เพื่อใส่บัตรเครดิต
  - **Note**: บัตรจะถูกหัก $0.01 ชั่วคราวเพื่อ verify แล้วคืน
  - **Note**: ระหว่าง $300 free trial จะไม่ถูกหักจริง

✅ **Done when**: เห็นหน้า Google Cloud Console พร้อม credit "$300"

---

## Step 2: สร้าง Project (5 นาที)

- [x] **2.1** มุมบนซ้าย คลิก dropdown ข้างคำว่า "Google Cloud" → "**New Project**"
- [x] **2.2** ใส่ค่า:
  - Project name: `hibi-matcha-prod`
  - Project ID: `hibi-matcha-prod` (Google จะเติมเลข random ถ้าซ้ำ — ก็ใช้ตามนั้น)
  - Location: ปล่อยว่าง
- [x] **2.3** กด **Create** → รอประมาณ 30 วินาที
- [x] **2.4** เลือก project นี้จาก dropdown มุมบน

📝 **เก็บข้อมูลไว้ส่งให้ผม:**

```
https://console.cloud.google.com/welcome/new?project=hibi-matcha-prod
```

✅ **Done when**: บนสุดของ Console เห็นชื่อ project `hibi-matcha-prod`

---

## Step 3: เปิด APIs ที่จำเป็น (3 นาที)

- [x] **3.1** ไปที่ [https://console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library)
- [x] **3.2** ค้นหาและกด **Enable** ทีละตัว:
  - [ ] **Cloud SQL Admin API**
  - [ ] **Cloud Storage API** (ถ้าค้นไม่เจอเป็น "Cloud Storage" ก็ enable ได้)
  - [ ] **Cloud Run Admin API**
  - [ ] **Cloud Build API**
  - [ ] **Secret Manager API**
  - [ ] **Compute Engine API** (สำหรับ Cloud SQL networking)
  - [ ] **Cloud Resource Manager API**

✅ **Done when**: ทุก API ขึ้น "API Enabled" แล้ว

---

## Step 4: สร้าง Cloud SQL instance (15 นาที + รอ provision 5-10 นาที)

- [ ] **4.1** ไปที่ [https://console.cloud.google.com/sql/instances](https://console.cloud.google.com/sql/instances)
- [ ] **4.2** กด **Create Instance** → เลือก **MySQL**
- [ ] **4.3** ตั้งค่า:
  - **Instance ID**: `hibi-matcha-db`
  - **Password**: กด **Generate** แล้วก๊อปเก็บ — ใช้ตอน connect
  - **Database version**: `MySQL 8.0`
  - **Region**: `asia-southeast1 (Singapore)` ⚠️ สำคัญ
  - **Zonal availability**: `Single zone` (ถูกกว่า — production ค่อย upgrade เป็น Highly available)
- [ ] **4.4** เลื่อนลง **Customize your instance** → เปลี่ยน:
  - **Machine type**: `Shared core` → `db-g1-small` (1.7 GB RAM)
    - ⚠️ ถ้าค่าเริ่มต้นเป็น `db-n1-standard-1` (~~$50/mo) ต้องเปลี่ยนเป็น g1-small (~~$25/mo)
  - **Storage type**: `SSD`
  - **Storage capacity**: `20 GB` + เปิด **Enable automatic storage increases**
  - **Connections**:
    - ✅ **Public IP** (เพื่อให้ Cloud Run + เครื่อง dev คุณต่อได้)
    - **Authorized networks**: ใส่ IP ของคุณ (กดลิงก์ "What's my IP" ถ้าไม่รู้) ตั้งชื่อ "dev-machine"
  - **Data Protection**:
    - ✅ **Enable automated backups** — เลือก time `19:00` (= ตี 2 ไทย ลูกค้าน้อยสุด)
    - **Backups to retain**: `7`
    - ✅ **Enable point-in-time recovery**
- [ ] **4.5** กด **Create Instance** → รอ ~5-10 นาที (status เปลี่ยนเป็น "Ready")
- [ ] **4.6** เปิด instance ที่สร้าง → คลิก tab **Databases** → กด **Create Database**:
  - Name: `hibi_matcha`
  - Character set: `utf8mb4`
  - Collation: `utf8mb4_unicode_ci`
- [ ] **4.7** Tab **Users** → กด **Add User Account**:
  - Username: `hibimatcha_app`
  - Password: gen ใหม่ ก๊อปเก็บ
  - Host name: `%` (allow from anywhere)

📝 **เก็บข้อมูลไว้ส่งให้ผม:**

```
Cloud SQL Public IP: ___________________
Connection name: hibi-matcha-prod:asia-southeast1:hibi-matcha-db
Database name: hibi_matcha
User: hibimatcha_app
Password: _______________________________  (เก็บปลอดภัย — อย่าส่งผ่าน chat)
Root password: __________________________  (เก็บปลอดภัย)
```

✅ **Done when**: instance status = "Ready", database `hibi_matcha` สร้างเรียบร้อย

---

## Step 5: สร้าง Cloud Storage bucket (5 นาที)

- [ ] **5.1** ไปที่ [https://console.cloud.google.com/storage/browser](https://console.cloud.google.com/storage/browser)
- [ ] **5.2** กด **Create**
- [ ] **5.3** ตั้งค่า:
  - **Name**: `hibimatcha-data` (ถ้าซ้ำ Google จะให้เลือกใหม่ — แนะนำ `hibimatcha-data-prod`)
  - **Location type**: `Region`
  - **Location**: `asia-southeast1 (Singapore)` ⚠️ ต้องเหมือนกับ Cloud SQL
  - **Storage class**: `Standard`
  - **Access control**: `Uniform`
  - **Public access prevention**: ✅ **Enforced** (สำคัญ — บังคับใช้ signed URL หรือ CDN)
  - **Object versioning**: ปิดไว้ก่อน
  - **Encryption**: `Google-managed encryption key`
- [ ] **5.4** กด **Create** → bucket พร้อมใช้
- [ ] **5.5** เข้า bucket แล้วสร้าง folder ว่างๆ ตามที่กำหนด:
  - กด **Create folder** ทีละอัน:
    - `customers/`
    - `staff/`
    - `content/`
    - `system/`
  - (Subfolder ที่ลึกกว่านี้ผมจะสร้างจากโค้ดตอน upload)

- [ ] **5.6** ตั้ง **Lifecycle rule** (ลด cost ระยะยาว):
  - Tab **Lifecycle** → **Add a rule**
  - Action: **Set storage class to Nearline**
  - Conditions: **Age** > `90` days
  - Apply to: All objects
  - Save

📝 **เก็บข้อมูลไว้ส่งให้ผม:**

```
Bucket name: ___________________________
```

✅ **Done when**: bucket แสดงใน Storage browser พร้อม 4 folders

---

## Step 6: สร้าง Service Account + Key (10 นาที)

- [ ] **6.1** ไปที่ [https://console.cloud.google.com/iam-admin/serviceaccounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
- [ ] **6.2** กด **Create Service Account**
- [ ] **6.3** ตั้งค่า:
  - **Service account name**: `hibimatcha-app`
  - **Service account ID**: `hibimatcha-app` (auto-fill)
  - **Description**: `Backend service account for Hibi Matcha app`
- [ ] **6.4** กด **Create and Continue**
- [ ] **6.5** **Grant roles** เพิ่มทีละตัว:
  - [ ] `Cloud SQL Client` (`roles/cloudsql.client`)
  - [ ] `Storage Object Admin` (`roles/storage.objectAdmin`)
  - [ ] `Secret Manager Secret Accessor` (`roles/secretmanager.secretAccessor`)
- [ ] **6.6** กด **Continue** → **Done**
- [ ] **6.7** กลับหน้ารายการ service accounts → คลิกที่ `hibimatcha-app`
- [ ] **6.8** Tab **Keys** → **Add Key** → **Create new key** → **JSON** → **Create**
- [ ] **6.9** ไฟล์ JSON จะดาวน์โหลดอัตโนมัติ — เก็บไว้ที่ `~/Desktop/hibimatcha-sa-key.json`
  - ⚠️ **ห้ามแชร์ไฟล์นี้กับใคร — ห้าม commit ขึ้น git** เป็นกุญแจเข้าระบบทั้งหมด
  - ผมจะให้ที่อยู่เก็บไฟล์ที่ปลอดภัยใน Sprint 1

📝 **เก็บข้อมูลไว้ส่งให้ผม:**

```
Service account email: hibimatcha-app@hibi-matcha-prod.iam.gserviceaccount.com
JSON key path: ~/Desktop/hibimatcha-sa-key.json (อยู่ในเครื่องคุณ)
```

✅ **Done when**: ดาวน์โหลด JSON key ได้แล้ว มีข้อมูล `"private_key"` ข้างใน

---

## Step 7: ตั้ง Budget Alert (5 นาที)

ป้องกันค่าใช้จ่ายพุ่งโดยไม่ตั้งใจ

- [ ] **7.1** ไปที่ [https://console.cloud.google.com/billing/budgets](https://console.cloud.google.com/billing/budgets)
- [ ] **7.2** **Create Budget**
- [ ] **7.3** ตั้งค่า:
  - **Name**: `hibi-matcha-monthly-budget`
  - **Time range**: `Monthly`
  - **Projects**: เลือกแค่ `hibi-matcha-prod`
  - **Amount**: `$120` (≈ 4,000฿ — เผื่อมาก กว่า estimated $85)
  - **Alert thresholds**: 50%, 90%, 100% — แจ้งเตือน email
- [ ] **7.4** **Save**

✅ **Done when**: เห็น budget ใน list พร้อม email notification

---

## Step 8: ส่งข้อมูลให้ผม (สำคัญ!)

หลังทำ Step 1-7 เสร็จ ส่งข้อมูลพวกนี้ให้ผม **ทาง chat นี้** (ผมจะเก็บใส่ `.env` ที่อยู่ในเครื่องคุณ ไม่หลุดที่ไหน):

```
Project ID:           ___________________
Cloud SQL connection: hibi-matcha-prod:asia-southeast1:hibi-matcha-db
Cloud SQL public IP:  ___________________
Cloud SQL DB name:    hibi_matcha
Cloud SQL user:       hibimatcha_app
GCS bucket name:      ___________________
SA email:             hibimatcha-app@hibi-matcha-prod.iam.gserviceaccount.com
JSON key path:        ~/Desktop/hibimatcha-sa-key.json
```

**ห้ามส่ง:**

- รหัสผ่าน Cloud SQL (ผมไม่ต้องใช้ — จะอ่านจาก env ที่คุณตั้ง)
- เนื้อหาข้างใน JSON key (ผมจะอ่านจาก path)

---

## Step 9 (Optional แต่แนะนำ): ติดตั้ง gcloud CLI ในเครื่อง

ช่วยให้ผม automate งาน Cloud SQL / GCS ได้

- [ ] macOS:
  ```bash
  brew install --cask google-cloud-sdk
  gcloud init
  gcloud auth application-default login
  gcloud config set project hibi-matcha-prod
  ```
- [ ] Verify:
  ```bash
  gcloud sql instances list
  gsutil ls
  ```

✅ **Done when**: รัน 2 commands ข้างบนแล้วเห็น instance + bucket

---

## ❓ ติดขัดตรงไหน?

Step ไหนงงให้บอกเลย — ผมจะช่วย screenshot/screen-share guide เพิ่ม

ถ้า Step 4 (Cloud SQL pricing) งงเรื่อง machine tier — ส่ง screenshot หน้า "Customize your instance" ก่อนกด Create มาให้ดู ผมเช็ค price ให้

---

## ⏭️ Step ถัดไป (หลังจากนี้)

**Sprint 1 เริ่มทันทีที่ผมได้ข้อมูล Step 8**:

- ผมจะเขียน `server/_core/storage-gcs.ts`
- เขียน `server/_core/storageKeys.ts` กำหนด folder structure
- แก้ 12 จุด upload ใน `server/routers.ts`
- คุณจะ test upload ใน staging ก่อน switch prod

