const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const userId = 'tester';
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  try {
    console.log("Testing getTopEvents...");
    const limit = 5;
    const events = await prisma.trackingEvent.groupBy({
      by: ['eventName'],
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      _count: true,
      orderBy: {
        _count: {
          eventName: 'desc',
        },
      },
      take: limit,
    });
    console.log("getTopEvents OK", events);
  } catch (e) {
    console.error("Error in getTopEvents:", e.message);
  }
}
test().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
