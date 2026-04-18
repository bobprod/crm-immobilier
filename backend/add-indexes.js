const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const indexes = [
  `CREATE INDEX IF NOT EXISTS prospects_userid_idx ON prospects("userId")`,
  `CREATE INDEX IF NOT EXISTS prospects_email_idx ON prospects(email)`,
  `CREATE INDEX IF NOT EXISTS prospects_phone_idx ON prospects(phone)`,
  `CREATE INDEX IF NOT EXISTS prospects_status_idx ON prospects(status)`,
  `CREATE INDEX IF NOT EXISTS prospects_score_idx ON prospects(score)`,
  `CREATE INDEX IF NOT EXISTS prospects_deletedat_idx ON prospects("deletedAt")`,
  `CREATE INDEX IF NOT EXISTS prospects_user_status_deletedat_idx ON prospects("userId", status, "deletedAt")`,
  `CREATE INDEX IF NOT EXISTS prospects_user_createdat_idx ON prospects("userId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS prospects_agencyid_idx ON prospects("agencyId")`,
  `CREATE INDEX IF NOT EXISTS matches_score_idx ON matches(score)`,
  `CREATE INDEX IF NOT EXISTS matches_status_idx ON matches(status)`,
  `CREATE INDEX IF NOT EXISTS matches_prospectid_idx ON matches("prospectId")`,
  `CREATE INDEX IF NOT EXISTS matches_propertyid_idx ON matches("propertyId")`,
  `CREATE INDEX IF NOT EXISTS prospecting_leads_phone_idx ON prospecting_leads(phone)`,
];

async function run() {
  for (const sql of indexes) {
    try {
      await prisma.$executeRawUnsafe(sql);
      const name = sql.match(/INDEX IF NOT EXISTS (\w+)/)[1];
      console.log('✅ Created:', name);
    } catch (e) {
      const name = sql.match(/INDEX IF NOT EXISTS (\w+)/)[1];
      console.log('⚠️  Skip:', name, '-', e.message.substring(0, 60));
    }
  }

  // Verify
  const existing =
    await prisma.$queryRaw`SELECT indexname FROM pg_indexes WHERE tablename IN ('prospects','matches','prospecting_leads') ORDER BY tablename, indexname`;
  console.log('\n📊 All indexes:');
  existing.forEach((r) => console.log(' -', r.indexname));

  await prisma.$disconnect();
  console.log('\n✅ DONE');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
