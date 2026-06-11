# Announcement System Analysis

## What already exists:
1. **DB Table**: `announcements` with title, content, type (announcement/promotion/event), targetGroup, imageUrl, promoCode, discountText, startDate, endDate, isActive, isPinned
2. **Backend**: Full CRUD in `routers.ts` under `announcements` router (listActive, listAll, create, update, delete, toggleActive)
3. **Admin Page**: `AdminAnnouncements.tsx` - full management UI
4. **Customer Page**: `Announcements.tsx` - lists active announcements with images, promo codes, dates
5. **Customer Home**: Menu item linking to `/customer/announcements`

## What's MISSING (user wants notification-style):
1. **No notification bell/badge** in header showing unread count
2. **No "read" tracking** - no way to know if customer has seen an announcement
3. **No notification popup/toast** when new announcement arrives
4. **No unread count** on the home page menu item

## Plan:
1. Add `customer_announcement_reads` table to track which announcements each customer has read
2. Add backend procedures: markAsRead, getUnreadCount
3. Add notification bell icon in MobileLayout header with unread badge
4. Add unread badge on the "ประกาศ" menu item in CustomerHome
5. Mark announcements as read when customer views them
