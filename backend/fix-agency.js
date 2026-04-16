const { PrismaClient } = require('./node_modules/.prisma/client/index.js');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.users.findFirst({
    where: { email: 'admin@crm.com' },
    select: { id: true, agencyId: true, role: true },
  });
  console.log('User:', JSON.stringify(user));

  const agencies = await prisma.agencies.findMany({ select: { id: true, name: true } });
  console.log('Agencies:', JSON.stringify(agencies));

  if (!user) {
    console.log('User not found');
    return;
  }
  if (user.agencyId) {
    console.log('Already has agencyId:', user.agencyId);
    return;
  }
  if (agencies.length === 0) {
    console.log('No agencies found');
    return;
  }

  const updated = await prisma.users.update({
    where: { id: user.id },
    data: { agencyId: agencies[0].id },
  });
  console.log('agencyId assigned:', updated.agencyId);
}

run()
  .catch((e) => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
