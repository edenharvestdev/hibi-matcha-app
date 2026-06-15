/**
 * Pre-flight check for migration 0049 (review_requests unique indexes).
 *
 * Usage:
 *   pnpm tsx check-review-duplicates.mjs
 *
 * Prints any existing duplicate (deliveryApp, bookingId/shopeeOrderId/
 * linemanOrderId) groups so they can be resolved BEFORE applying the
 * migration. Adding a UNIQUE constraint on data containing duplicates
 * will fail with ER_DUP_ENTRY.
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = mysql.createPool(process.env.DATABASE_URL);
const db = drizzle(pool);

async function checkColumn(label, deliveryApp, column) {
  const [rows] = await db.execute(sql.raw(`
    SELECT \`${column}\` AS value, COUNT(*) AS cnt,
           GROUP_CONCAT(id ORDER BY id) AS ids,
           GROUP_CONCAT(DISTINCT status ORDER BY status) AS statuses
    FROM review_requests
    WHERE deliveryApp = '${deliveryApp}'
      AND \`${column}\` IS NOT NULL
      AND \`${column}\` <> ''
    GROUP BY \`${column}\`
    HAVING COUNT(*) > 1
  `));
  if (rows.length === 0) {
    console.log(`✅ ${label}: no duplicates`);
    return 0;
  }
  console.log(`❌ ${label}: ${rows.length} duplicate group(s)`);
  for (const r of rows) {
    console.log(`   - ${r.value} → ${r.cnt} rows (ids: ${r.ids}, statuses: ${r.statuses})`);
  }
  return rows.length;
}

async function main() {
  console.log('=== Pre-flight check for migration 0049 ===\n');
  let bad = 0;
  bad += await checkColumn('Grab bookingId',         'grab',    'bookingId');
  bad += await checkColumn('Shopee shopeeOrderId',   'shopee',  'shopeeOrderId');
  bad += await checkColumn('LINE MAN linemanOrderId','lineman', 'linemanOrderId');
  console.log();
  if (bad === 0) {
    console.log('✅ All clear — migration 0049 can be applied safely.');
  } else {
    console.log(`⚠️  Found ${bad} duplicate group(s). Resolve them first by:`);
    console.log('   - Picking the canonical row (usually approved/oldest)');
    console.log('   - Cancelling/deleting the others');
    console.log('   - Then re-run this script before applying migration 0049');
    process.exit(2);
  }
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
