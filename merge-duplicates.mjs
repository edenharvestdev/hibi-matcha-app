import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Merge plan: keep the ID with most data, move data from others, then delete others
const mergeGroups = [
  {
    name: "Aekavit Odklun",
    keepId: 4050002,
    deleteIds: [60001, 3510001],
    // 60001 has: 1 point_claim, 1 order_issue
    // 3510001 has: nothing (just consents + empty loyalty)
  },
  {
    name: "กฤตยากร วงษาสืบ",
    keepId: 4050006,
    deleteIds: [4050005],
    // 4050005 has: nothing (just consents + empty loyalty)
  },
  {
    name: "Warinlada K / Warinlada Khunlan",
    keepId: 4290006,
    deleteIds: [4290002],
    // 4290002 has: nothing (just consents + empty loyalty)
  },
  {
    name: "ณัฐธิดา ปานปลอด",
    keepId: 4380001,
    deleteIds: [5340002],
    // 5340002 has: nothing (just consents + empty loyalty)
  },
];

// Tables that reference customerId (with their column names)
const customerRefTables = [
  { table: "review_requests", col: "customerId" },
  { table: "point_claims", col: "customerId" },
  { table: "point_transactions", col: "customerId" },
  { table: "codes", col: "customerId" },
  { table: "free_drink_codes", col: "fdCustomerId" },
  { table: "reward_redemptions", col: "customerId" },
  { table: "order_issues", col: "issueCustomerId" },
];

console.log("=== เริ่มรวมลูกค้าซ้ำ ===\n");

for (const group of mergeGroups) {
  console.log(`\n--- ${group.name} ---`);
  console.log(`เก็บ ID: ${group.keepId} | ลบ IDs: ${group.deleteIds.join(", ")}`);

  for (const deleteId of group.deleteIds) {
    // Step 1: Move all data references from deleteId → keepId
    for (const ref of customerRefTables) {
      const [result] = await conn.execute(
        `UPDATE \`${ref.table}\` SET \`${ref.col}\` = ? WHERE \`${ref.col}\` = ?`,
        [group.keepId, deleteId]
      );
      if (result.affectedRows > 0) {
        console.log(`  ✅ ย้าย ${ref.table}: ${result.affectedRows} รายการ จาก ${deleteId} → ${group.keepId}`);
      }
    }

    // Step 2: Move branch_loyalty_points (special - might conflict on unique constraint)
    const [blpRows] = await conn.execute(
      `SELECT blpBranchId, blpTotalPoints, blpUsedPoints, blpLifetimePoints FROM branch_loyalty_points WHERE blpCustomerId = ?`,
      [deleteId]
    );
    for (const blp of blpRows) {
      // Check if keepId already has entry for this branch
      const [existing] = await conn.execute(
        `SELECT id, blpTotalPoints, blpUsedPoints, blpLifetimePoints FROM branch_loyalty_points WHERE blpCustomerId = ? AND blpBranchId = ?`,
        [group.keepId, blp.blpBranchId]
      );
      if (existing.length > 0) {
        // Merge points
        await conn.execute(
          `UPDATE branch_loyalty_points SET blpTotalPoints = blpTotalPoints + ?, blpUsedPoints = blpUsedPoints + ?, blpLifetimePoints = blpLifetimePoints + ? WHERE id = ?`,
          [blp.blpTotalPoints, blp.blpUsedPoints, blp.blpLifetimePoints, existing[0].id]
        );
        console.log(`  ✅ รวม branch_loyalty_points branch ${blp.blpBranchId}: +${blp.blpTotalPoints} pts`);
      } else {
        // Move entry
        await conn.execute(
          `UPDATE branch_loyalty_points SET blpCustomerId = ? WHERE blpCustomerId = ? AND blpBranchId = ?`,
          [group.keepId, deleteId, blp.blpBranchId]
        );
        console.log(`  ✅ ย้าย branch_loyalty_points branch ${blp.blpBranchId}`);
      }
    }
    // Delete remaining branch_loyalty_points for deleteId
    await conn.execute(`DELETE FROM branch_loyalty_points WHERE blpCustomerId = ?`, [deleteId]);

    // Step 3: Merge loyalty_points into keepId
    const [deleteLp] = await conn.execute(
      `SELECT totalPoints, usedPoints, lifetimePoints FROM loyalty_points WHERE customerId = ?`,
      [deleteId]
    );
    if (deleteLp.length > 0 && (deleteLp[0].totalPoints > 0 || deleteLp[0].lifetimePoints > 0)) {
      await conn.execute(
        `UPDATE loyalty_points SET totalPoints = totalPoints + ?, usedPoints = usedPoints + ?, lifetimePoints = lifetimePoints + ? WHERE customerId = ?`,
        [deleteLp[0].totalPoints, deleteLp[0].usedPoints, deleteLp[0].lifetimePoints, group.keepId]
      );
      console.log(`  ✅ รวม loyalty_points: +${deleteLp[0].totalPoints} total, +${deleteLp[0].lifetimePoints} lifetime`);
    }
    // Delete loyalty_points for deleteId
    await conn.execute(`DELETE FROM loyalty_points WHERE customerId = ?`, [deleteId]);

    // Step 4: Delete customer_consents for deleteId
    const [consentResult] = await conn.execute(
      `DELETE FROM customer_consents WHERE consentCustomerId = ?`,
      [deleteId]
    );
    if (consentResult.affectedRows > 0) {
      console.log(`  ✅ ลบ customer_consents: ${consentResult.affectedRows} รายการ`);
    }

    // Step 5: Delete the duplicate customer
    const [deleteResult] = await conn.execute(
      `DELETE FROM customers WHERE id = ?`,
      [deleteId]
    );
    if (deleteResult.affectedRows > 0) {
      console.log(`  ✅ ลบ customer ID ${deleteId} สำเร็จ`);
    } else {
      console.log(`  ⚠️ ไม่พบ customer ID ${deleteId} (อาจถูกลบไปแล้ว)`);
    }
  }

  // Step 6: Normalize phone for keepId (remove dashes, +66 prefix)
  const [keepCustomer] = await conn.execute(
    `SELECT phone FROM customers WHERE id = ?`,
    [group.keepId]
  );
  if (keepCustomer.length > 0) {
    let cleanPhone = keepCustomer[0].phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("66") && cleanPhone.length >= 11) {
      cleanPhone = "0" + cleanPhone.slice(2);
    }
    if (cleanPhone !== keepCustomer[0].phone) {
      await conn.execute(
        `UPDATE customers SET phone = ? WHERE id = ?`,
        [cleanPhone, group.keepId]
      );
      console.log(`  ✅ Normalize phone: "${keepCustomer[0].phone}" → "${cleanPhone}"`);
    }
  }
}

// Verify results
console.log("\n\n=== ตรวจสอบผลลัพธ์ ===");
for (const group of mergeGroups) {
  const [rows] = await conn.execute(
    `SELECT id, phone, name, email FROM customers WHERE id IN (${[group.keepId, ...group.deleteIds].join(",")})`,
  );
  console.log(`\n${group.name}:`);
  for (const r of rows) {
    console.log(`  ID ${r.id}: ${r.name} | ${r.phone} | ${r.email}`);
  }
  if (rows.length === 1) {
    console.log(`  ✅ เหลือ 1 ID เรียบร้อย`);
  } else {
    console.log(`  ⚠️ ยังเหลือ ${rows.length} IDs!`);
  }
}

await conn.end();
console.log("\n=== เสร็จสิ้น ===");
