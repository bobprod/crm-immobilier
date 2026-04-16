const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const userId = 'tester';
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const platform = 'facebook';
  
  try {
    console.log("Testing getPlatformPerformance...");
    const count = await prisma.trackingEvent.count({
      where: {
        userId,
        platform,
        timestamp: { gte: startDate },
        data: { path: ['status'], equals: 'success' },
      },
    });
    console.log("getPlatformPerformance OK", count);
  } catch (e) {
    console.error("Error in getPlatformPerformance:", e.message);
  }
}
test().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
