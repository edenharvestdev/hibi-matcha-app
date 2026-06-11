import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(conn);

// Duplicate customer groups (from previous analysis)
const duplicateGroups = [
  {
    name: "Aekavit Odklun",
    ids: [60001, 3510001, 4050002],
    email: "aekavitodklun@gmail.com",
  },
  {
    name: "กฤตยากร วงษาสืบ",
    ids: [4050005, 4050006],
    email: "mena.sobeast@gmail.com",
  },
  {
    name: "Warinlada K / Warinlada Khunlan",
    ids: [4290002, 4290006],
    email: "fah.warinlada@gmail.com",
  },
  {
    name: "ณัฐธิดา ปานปลอด",
    ids: [4380001, 5340002],
    email: "waewlove26@gmail.com",
  },
];

// Tables that reference customerId
const tables = [
  { name: "review_requests", col: "customerId" },
  { name: "point_claims", col: "customerId" },
  { name: "point_transactions", col: "customerId" },
  { name: "loyalty_points", col: "customerId" },
  { name: "branch_loyalty_points", col: "blpCustomerId" },
  { name: "codes", col: "customerId" },
  { name: "free_drink_codes", col: "fdCustomerId" },
  { name: "reward_redemptions", col: "customerId" },
  { name: "order_issues", col: "issueCustomerId" },
  { name: "customer_consents", col: "consentCustomerId" },
];

console.log("=== ตรวจสอบข้อมูลลูกค้าซ้ำทุกตาราง ===\n");

for (const group of duplicateGroups) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`กลุ่ม: ${group.name} (${group.email})`);
  console.log(`IDs: ${group.ids.join(", ")}`);
  console.log("=".repeat(60));

  // Check customer details
  for (const id of group.ids) {
    const [rows] = await conn.execute(
      `SELECT id, phone, name, email, createdAt FROM customers WHERE id = ?`,
      [id]
    );
    if (rows.length > 0) {
      const c = rows[0];
      console.log(`  Customer ID ${c.id}: ${c.name} | ${c.phone} | ${c.email} | สมัคร: ${c.createdAt}`);
    } else {
      console.log(`  Customer ID ${id}: *** ไม่พบในระบบ ***`);
    }
  }

  for (const table of tables) {
    const idList = group.ids.join(",");
    const [rows] = await conn.execute(
      `SELECT ${table.col} as cid, COUNT(*) as cnt FROM \`${table.name}\` WHERE ${table.col} IN (${idList}) GROUP BY ${table.col}`
    );
    if (rows.length > 0) {
      console.log(`\n  📋 ${table.name}:`);
      for (const r of rows) {
        console.log(`    - Customer ID ${r.cid}: ${r.cnt} รายการ`);
      }

      // Show details for review_requests and point_claims
      if (table.name === "review_requests") {
        const [details] = await conn.execute(
          `SELECT id, customerId, branchId, deliveryApp, orderId, status, createdAt FROM review_requests WHERE customerId IN (${idList}) ORDER BY createdAt`
        );
        for (const d of details) {
          console.log(`      → Review #${d.id}: ${d.deliveryApp} ${d.orderId} | status: ${d.status} | ${d.createdAt}`);
        }
      }

      if (table.name === "point_claims") {
        const [details] = await conn.execute(
          `SELECT id, customerId, branchId, claimDeliveryApp, claimPointOrderId, claimStatus, orderAmount, pointsAwarded, claimCreatedAt FROM point_claims WHERE customerId IN (${idList}) ORDER BY claimCreatedAt`
        );
        for (const d of details) {
          console.log(`      → Claim #${d.id}: ${d.claimDeliveryApp} ${d.claimPointOrderId} | ${d.orderAmount}฿ | pts: ${d.pointsAwarded || 0} | status: ${d.claimStatus} | ${d.claimCreatedAt}`);
        }
      }

      if (table.name === "loyalty_points") {
        const [details] = await conn.execute(
          `SELECT customerId, totalPoints, usedPoints, lifetimePoints, tier FROM loyalty_points WHERE customerId IN (${idList})`
        );
        for (const d of details) {
          console.log(`      → LP: total=${d.totalPoints} used=${d.usedPoints} lifetime=${d.lifetimePoints} tier=${d.tier}`);
        }
      }

      if (table.name === "point_transactions") {
        const [details] = await conn.execute(
          `SELECT id, customerId, txType, points, balanceAfter, orderAmount, description, createdAt FROM point_transactions WHERE customerId IN (${idList}) ORDER BY createdAt`
        );
        for (const d of details) {
          console.log(`      → Tx #${d.id}: ${d.txType} ${d.points}pts | balance=${d.balanceAfter} | ${d.orderAmount || ''}฿ | ${d.description || ''} | ${d.createdAt}`);
        }
      }

      if (table.name === "branch_loyalty_points") {
        const [details] = await conn.execute(
          `SELECT blpCustomerId, blpBranchId, blpTotalPoints, blpUsedPoints, blpLifetimePoints FROM branch_loyalty_points WHERE blpCustomerId IN (${idList})`
        );
        for (const d of details) {
          console.log(`      → Branch LP: cust=${d.blpCustomerId} branch=${d.blpBranchId} total=${d.blpTotalPoints} used=${d.blpUsedPoints} lifetime=${d.blpLifetimePoints}`);
        }
      }

      if (table.name === "codes") {
        const [details] = await conn.execute(
          `SELECT id, code, codeType, customerId, codeStatus, createdAt FROM codes WHERE customerId IN (${idList}) ORDER BY createdAt`
        );
        for (const d of details) {
          console.log(`      → Code #${d.id}: ${d.code} | type=${d.codeType} | status=${d.codeStatus} | ${d.createdAt}`);
        }
      }

      if (table.name === "free_drink_codes") {
        const [details] = await conn.execute(
          `SELECT id, fdCode, fdCustomerId, fdStatus, fdIssuedAt FROM free_drink_codes WHERE fdCustomerId IN (${idList}) ORDER BY fdIssuedAt`
        );
        for (const d of details) {
          console.log(`      → FDCode #${d.id}: ${d.fdCode} | status=${d.fdStatus} | ${d.fdIssuedAt}`);
        }
      }
    }
  }
}

console.log("\n\n=== สรุป ===");
await conn.end();
