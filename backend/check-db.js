#!/usr/bin/env node

const { execSync } = require('child_process');

// Exécuter une requête SQL directe
try {
    const result = execSync(`cd "${process.cwd()}" && npx prisma db execute --stdin`, {
        input: `SELECT u.id, u.email, u."agencyId" FROM "users" u WHERE u.id = 'cmi57ycue0000w3vunopeduv6' LIMIT 1;`,
        encoding: 'utf8'
    });
    console.log('User found:', result);
} catch (error) {
    console.error('Error:', error.message);

    // Essayer une autre approche
    console.log('\nTrying alternative approach...');
    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient({
            log: ['error', 'warn']
        });

        console.log('PrismaClient created, attempting findUnique...');
        prisma.user.findUnique({ where: { id: 'cmi57ycue0000w3vunopeduv6' } })
            .then(user => {
                console.log('User:', user);
                prisma.$disconnect();
            })
            .catch(err => {
                console.error('Query error:', err.message);
                prisma.$disconnect();
            });
    } catch (e) {
        console.error('Prisma client error:', e.message);
    }
}
