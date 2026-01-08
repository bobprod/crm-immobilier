const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkByokUsage() {
    try {
        const userId = 'cmi57ycue0000w3vunopeduv6';

        console.log('📊 Vérification du BYOK Gemini\n');

        // 1. Vérifier que la clé est configurée
        console.log('1️⃣ Clé API Gemini configurée:');
        const apiKeys = await prisma.userLlmProvider.findMany({
            where: { userId }
        });

        if (apiKeys.length > 0) {
            apiKeys.forEach((key) => {
                console.log(`   Provider: ${key.provider}`);
                console.log(`   Clé (premiers 30 chars): ${key.apiKey.substring(0, 30)}...`);
                console.log(`   Active: ${key.isActive}`);
                console.log(`   Priority: ${key.priority}\n`);
            });
        } else {
            console.log('   ❌ Aucune clé trouvée\n');
        }

        // 2. Vérifier les logs d'utilisation LLM
        console.log('2️⃣ Logs d\'utilisation LLM:');
        const usageLogs = await prisma.llmUsageLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 3
        });

        if (usageLogs.length > 0) {
            usageLogs.forEach((log) => {
                console.log(`   Provider: ${log.provider || 'N/A'}`);
                console.log(`   Tokens: ${log.tokensInput || 0} input + ${log.tokensOutput || 0} output`);
                console.log(`   Coût: $${log.cost || 0}`);
                console.log(`   Date: ${log.createdAt.toISOString()}\n`);
            });
        } else {
            console.log('   ℹ️ Aucun log trouvé (cela peut être normal si aucun appel LLM n\'a été effectué)\n');
        }

        // 3. Vérifier les prospections
        console.log('3️⃣ Prospections lancées:');
        const prospections = await prisma.prospection.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
                id: true,
                status: true,
                createdAt: true
            }
        });

        if (prospections.length > 0) {
            prospections.forEach((p) => {
                console.log(`   ID: ${p.id}`);
                console.log(`   Status: ${p.status}`);
                console.log(`   Date: ${p.createdAt.toISOString()}\n`);
            });
        } else {
            console.log('   ℹ️ Aucune prospection trouvée\n');
        }

        console.log('✅ Vérification BYOK terminée');
        console.log('\n📝 Résumé:');
        console.log(`   - Clé Gemini configurée: ${apiKeys.length > 0 ? '✅ OUI' : '❌ NON'}`);
        console.log(`   - Utilisée dans les logs LLM: ${usageLogs.length > 0 ? '✅ OUI' : '❓ À VÉRIFIER'}`);

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkByokUsage();
