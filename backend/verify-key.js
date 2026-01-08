const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const userId = 'cmi57ycue0000w3vunopeduv6';
        const keys = await prisma.userLlmProvider.findMany({
            where: { userId }
        });

        if (keys.length > 0) {
            console.log('✅ Clé API trouvée');
            console.log('Provider:', keys[0].provider);
            console.log('Clé (premiers 30):', keys[0].apiKey.substring(0, 30) + '...');
        } else {
            console.log('Insertion de la clé Gemini...');
            const result = await prisma.userLlmProvider.create({
                data: {
                    userId: userId,
                    provider: 'GEMINI',
                    apiKey: 'AIzaSyB4bB7pov7Cs62oo80R2mm7V-pCHIx0znA',
                    isActive: true,
                    priority: 1
                }
            });
            console.log('✅ Clé insérée - ID:', result.id);
        }
    } catch (e) {
        console.error('Erreur:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
