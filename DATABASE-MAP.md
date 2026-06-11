# Hibi Matcha — แผนผังฐานข้อมูล (Database Map)

ฐานข้อมูลทั้งหมด **127 ตาราง** จัดเป็น **16 หมวดงาน (flow)** ตามช่องทางการทำงาน
ตัวเลขในวงเล็บ = จำนวนแถวข้อมูลที่ import มา (ประเมินจาก local MySQL)
🟢 = มีข้อมูลใช้งานจริง · ⚪ = ตารางว่าง (โมดูลที่ยังไม่เริ่มใช้/วางโครงไว้)

---

## 1. 👤 ผู้ใช้ & ยืนยันตัวตน (Auth & Users)
ระบบล็อกอิน, OAuth, รีเซ็ตรหัสผ่าน, ความยินยอมของลูกค้า
| ตาราง | จำนวน |
|---|---|
| `users` | 🟢 4 |
| `user_oauth_links` | ⚪ 0 |
| `customers` | 🟢 812 |
| `customer_consents` | 🟢 1,618 |
| `onboarding_progress` | 🟢 1 |
| `password_reset_requests` | 🟢 68 |
| `password_reset_tokens` | 🟢 64 |

## 2. 🎁 สะสมแต้ม & รางวัล (Loyalty & Rewards)
หัวใจของแอป — โค้ดรางวัล, แต้มสะสม, การเคลม, แลกรางวัล, รีวิว
| ตาราง | จำนวน |
|---|---|
| `loyalty_points` | 🟢 813 |
| `branch_loyalty_points` | 🟢 400 |
| `point_transactions` | 🟢 770 |
| `point_claims` | 🟢 725 |
| `codes` (โค้ดรางวัล) | 🟢 585 |
| `review_requests` | 🟢 705 |
| `review_menu_items` | 🟢 2 |
| `rewards` | 🟢 6 |
| `reward_categories` | 🟢 5 |
| `reward_redemptions` | 🟢 7 |
| `free_drink_campaigns` | ⚪ 0 |
| `free_drink_codes` | ⚪ 0 |

## 3. 🧾 ระบบขายหน้าร้าน (POS)
เมนู, ตัวเลือก, ออเดอร์, การชำระเงิน, ตั๋วครัว
| ตาราง | จำนวน |
|---|---|
| `pos_menu_items` | 🟢 131 |
| `pos_options` | 🟢 108 |
| `pos_option_groups` | 🟢 38 |
| `pos_categories` | 🟢 17 |
| `pos_payment_methods` | 🟢 9 |
| `pos_branch_menu_items` | 🟢 5 |
| `pos_orders` | 🟢 13 |
| `pos_order_items` | 🟢 17 |
| `pos_order_payments` | 🟢 15 |
| `pos_kitchen_tickets` | 🟢 16 |
| `pos_staff_pins` | 🟢 7 |
| `pos_menu_item_option_groups` | ⚪ 0 |
| `pos_order_item_options` | ⚪ 0 |
| `pos_retail_products` | ⚪ 0 |
| `pos_branch_retail_stock` | ⚪ 0 |
| `pos_discounts` | ⚪ 0 |
| `pos_daily_summaries` | ⚪ 0 |

## 4. 🏪 พนักงาน & สาขา (Staff & Branches)
ข้อมูลพนักงาน, สิทธิ์, สาขา, โซนบริการ, คอมมิชชัน, คะแนนผลงาน
| ตาราง | จำนวน |
|---|---|
| `staff` | 🟢 24 |
| `staff_permissions` | 🟢 158 |
| `staff_branches` | 🟢 14 |
| `branches` | 🟢 7 |
| `service_zones` | 🟢 6 |
| `commission_records` | 🟢 4 |
| `branch_commission_settings` | 🟢 3 |
| `in_store_sales` | 🟢 1 |
| `in_store_sale_staff` | 🟢 1 |
| `branch_performance_scores` | ⚪ 0 |

## 5. 📊 ยอดขายรายวัน & รายงาน (Daily Sales)
บันทึกยอดขายรายวันแยกรายการ/ช่องทาง พร้อม audit
| ตาราง | จำนวน |
|---|---|
| `daily_sales_items` | 🟢 274 |
| `daily_sales_records` | 🟢 203 |
| `daily_sales_audit_logs` | 🟢 182 |
| `daily_sales_extra_channels` | 🟢 35 |
| `sales_categories` | 🟢 8 |

## 6. 💵 เงินสดย่อย & การเงิน (Petty Cash)
คำขอเบิกเงิน, รายการเงินสด, ใบเสร็จ, ตั้งค่า
| ตาราง | จำนวน |
|---|---|
| `petty_cash_transactions` | 🟢 76 |
| `petty_cash_receipt_images` | 🟢 45 |
| `petty_cash_fund_requests` | 🟢 13 |
| `petty_cash_settings` | 🟢 7 |

## 7. 📦 สต๊อก & คลังวัตถุดิบ (Stock / Inventory)
วัตถุดิบ, สูตร, การนับสต๊อก, โอนย้าย, ใบสั่งซื้อ, ซัพพลายเออร์
| ตาราง | จำนวน |
|---|---|
| `stock_ingredients` | 🟢 152 |
| `stock_branch_ingredients` | 🟢 150 |
| `stock_ingredient_categories` | 🟢 11 |
| `stock_daily_summaries` | 🟢 1 |
| `stock_recipes` · `stock_option_recipes` | ⚪ 0 |
| `stock_movements` · `stock_alerts` | ⚪ 0 |
| `stock_counts` · `stock_count_items` | ⚪ 0 |
| `stock_transfers` · `stock_transfer_items` | ⚪ 0 |
| `stock_purchase_orders` · `stock_purchase_order_items` | ⚪ 0 |
| `stock_suppliers` | ⚪ 0 |

## 8. 🛒 สั่งซื้อวัตถุดิบ & ต้นทุน (Ingredient Ordering & Costing)
แค็ตตาล็อกวัตถุดิบ, ใบสั่งซื้อ, ราคา, ต้นทุนเมนู, แจ้งเตือนต้นทุน
| ตาราง | จำนวน |
|---|---|
| `ingredient_catalog` | ⚪ 0 |
| `ingredient_orders` · `ingredient_order_items` | ⚪ 0 |
| `ingredient_order_issues` · `ingredient_order_status_logs` | ⚪ 0 |
| `ingredient_pricing` · `ingredient_price_catalog` | ⚪ 0 |
| `menu_cost_cache` · `food_cost_alerts` | ⚪ 0 |

## 9. 📋 มาตรฐานการทำงาน & สูตร (SOP)
SOP เมนู, วัตถุดิบ, ขั้นตอนเตรียม, การรับทราบ, ประวัติแก้ไข
| ตาราง | จำนวน |
|---|---|
| `sop_menu_items` | 🟢 157 |
| `sop_ingredients` | 🟢 52 |
| `sop_prep_steps` | 🟢 52 |
| `sop_menu_branch_variants` · `sop_suppliers` | ⚪ 0 |
| `sop_acknowledgments` · `sop_changelogs` · `sop_review_logs` | ⚪ 0 |

## 10. 📄 เอกสาร & ฝึกอบรม (DocGen & Training)
สร้างเอกสารอัตโนมัติ, เทมเพลต, คอร์สฝึกอบรม, OCR
| ตาราง | จำนวน |
|---|---|
| `docgen_documents` · `docgen_templates` · `docgen_template_configs` | ⚪ 0 |
| `docgen_menu_items` · `docgen_menu_branch_access` · `docgen_menu_branch_variants` | ⚪ 0 |
| `docgen_ingredients` · `docgen_prep_steps` · `docgen_delivery_info` | ⚪ 0 |
| `docgen_training_courses` · `docgen_training_lessons` | ⚪ 0 |
| `docgen_training_progress` · `docgen_training_quizzes` · `docgen_course_branch_access` | ⚪ 0 |
| `document_versions` · `ocr_logs` | ⚪ 0 |

## 11. 🍵 เมนูกลาง & ตัวเลือก (Menu & Options)
เมนู/ตัวเลือกที่ใช้ร่วมระหว่างโมดูล (นอก POS) + ความพร้อมขายต่อสาขา
| ตาราง | จำนวน |
|---|---|
| `option_items` | 🟢 11 |
| `branch_menu_availability` | 🟢 11 |
| `menu_option_groups` | 🟢 8 |
| `option_groups` | 🟢 4 |

## 12. 🛍️ ร้านค้าออนไลน์ (Online Shop)
สินค้า, หมวดหมู่, ออเดอร์, ตะกร้า
| ตาราง | จำนวน |
|---|---|
| `shop_products` | 🟢 119 |
| `shop_orders` · `shop_order_items` | 🟢 1 |
| `shop_categories` | 🟢 1 |
| `cart_items` | ⚪ 0 |

## 13. 📢 ประกาศ & เนื้อหาเว็บ (Announcements & Content)
ประกาศ/โปรโมชัน, เทมเพลต, การอ่านของลูกค้า, เนื้อหาเว็บไซต์, ติดต่อเรา
| ตาราง | จำนวน |
|---|---|
| `site_content` | 🟢 349 |
| `customer_announcement_reads` | 🟢 198 |
| `announcement_templates` | 🟢 5 |
| `announcements` | 🟢 3 |
| `contact_inquiries` | 🟢 1 |

## 14. 🔔 การแจ้งเตือน (Notifications)
แจ้งเตือนพนักงาน + Web Push subscriptions
| ตาราง | จำนวน |
|---|---|
| `staff_notifications` | 🟢 3,496 |
| `push_subscriptions` | 🟢 22 |
| `staff_push_subscriptions` | 🟢 4 |

## 15. ⚠️ ปัญหาออเดอร์ & คุณภาพ (Order Issues)
แจ้งปัญหาออเดอร์พร้อมรูปประกอบ
| ตาราง | จำนวน |
|---|---|
| `order_issues` | 🟢 42 |
| `order_issue_images` | 🟢 54 |

## 16. 🔍 ตรวจสอบระบบ & อัตโนมัติ (Audit & Automation)
บันทึกการกระทำทั้งระบบ + เวิร์กโฟลว์อัตโนมัติ
| ตาราง | จำนวน |
|---|---|
| `audit_logs` | 🟢 4,539 |
| `automation_workflows` · `automation_logs` | ⚪ 0 |

## 🏢 แฟรนไชส์ (Franchise)
| ตาราง | จำนวน |
|---|---|
| `franchise_owners` · `franchise_agreements` | ⚪ 0 |

---

## สรุปภาพรวม flow

```
ลูกค้า (customers) ──► สแกน/รับโค้ด (codes) ──► สะสมแต้ม (loyalty_points)
        │                                              │
        ├─► รีวิว (review_requests) ──► รับแต้ม ◄───────┤
        └─► แลกรางวัล (rewards / reward_redemptions) ◄──┘

หน้าร้าน POS (pos_orders) ──► ครัว (pos_kitchen_tickets) ──► ชำระเงิน (pos_order_payments)
        │
        └─► ตัดสต๊อก (stock_*) ──► สั่งซื้อวัตถุดิบ (ingredient_*) ──► ต้นทุน (menu_cost_cache)

พนักงาน (staff) ─► สิทธิ์ (staff_permissions) ─► สาขา (branches) ─► คอมมิชชัน (commission_records)
ยอดขายรายวัน (daily_sales_*) + เงินสดย่อย (petty_cash_*) ─► รายงาน

ทุก action ──► audit_logs (ตรวจสอบย้อนหลัง)
```

**โมดูลที่ใช้งานจริง (🟢):** Loyalty, POS, Staff/Branches, Daily Sales, Petty Cash, Stock (บางส่วน), SOP, Shop, Announcements, Notifications, Order Issues, Audit
**โมดูลที่วางโครงไว้แต่ยังไม่เริ่มใช้ (⚪ ว่างทั้งหมด):** Ingredient Ordering, DocGen/Training, Franchise, Automation, Stock (ส่วนเคลื่อนไหว/นับ/โอน/PO)
