import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const agency = await prisma.agencies.findFirst({
            orderBy: { createdAt: 'asc' },
        });

        if (!agency) {
            throw new Error('No agency found.');
        }

        const user = await prisma.users.update({
            where: { email: 'admin@crm.com' },
            data: { agencyId: agency.id },
        });

        console.log('✅ Admin user assigned to agency:', {
            userId: user.id,
            agencyId: agency.id,
        });
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    console.error('❌ Failed to assign admin agency:', error);
    process.exit(1);
});
