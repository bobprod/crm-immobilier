
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.users.count();
    console.log(`User count: ${count}`);
    const users = await prisma.users.findMany({ take: 5 });
    console.log('Sample users:', users.map(u => ({ id: u.id, email: u.email })));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
