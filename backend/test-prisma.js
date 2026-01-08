#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function test() {
    const prisma = new PrismaClient();

    try {
        console.log('Available models:');
        console.log('- prisma.users:', typeof prisma.users);
        console.log('- prisma.user:', typeof prisma.user);
        console.log('- prisma.agencyApiKeys:', typeof prisma.agencyApiKeys);

        console.log('\nTrying prisma.users.findUnique...');
        const user = await prisma.users.findUnique({
            where: { id: 'cmi57ycue0000w3vunopeduv6' },
            select: { id: true, email: true, agencyId: true }
        });
        console.log('Users query result:', user);
    } catch (e) {
        console.error('Users query error:', e.message);
    }

    try {
        console.log('\nTrying prisma.user.findUnique...');
        const user = await prisma.user.findUnique({
            where: { id: 'cmi57ycue0000w3vunopeduv6' },
            select: { id: true, email: true, agencyId: true }
        });
        console.log('User query result:', user);
    } catch (e) {
        console.error('User query error:', e.message);
    }

    await prisma.$disconnect();
}

test();
