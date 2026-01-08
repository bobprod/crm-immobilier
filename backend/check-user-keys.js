#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const userId = 'cmi57ycue0000w3vunopeduv6';
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, agencyId: true }
    });

    console.log('User:', user);

    if (user && user.agencyId) {
        const keys = await prisma.agencyApiKeys.findUnique({
            where: { agencyId: user.agencyId },
            select: { id: true, agencyId: true, serpApiKey: true, firecrawlApiKey: true }
        });
        console.log('Keys:', keys);
    }

    await prisma.$disconnect();
}

checkUser().catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
