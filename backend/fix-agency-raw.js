const { PrismaClient } = require('./node_modules/.prisma/client/index.js');
const prisma = new PrismaClient();

async function run() {
  // Use raw SQL to update agencyId directly (bypass any schema mismatch)
  const result = await prisma.$queryRaw`
    SELECT id, email, role, "agencyId" FROM users WHERE email = 'admin@crm.com' LIMIT 1
  `;
  console.log('User raw:', JSON.stringify(result));

  const agencies = await prisma.$queryRaw`SELECT id, name FROM agencies LIMIT 3`;
  console.log('Agencies:', JSON.stringify(agencies));

  if (result.length > 0 && agencies.length > 0) {
    const userId = result[0].id;
    const agencyId = agencies[0].id;
    const update = await prisma.$executeRaw`
      UPDATE users SET "agencyId" = ${agencyId} WHERE id = ${userId}
    `;
    console.log('Rows updated:', update);
    console.log('agencyId assigned:', agencyId, 'to user:', userId);
  }
}

run()
  .catch((e) => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
