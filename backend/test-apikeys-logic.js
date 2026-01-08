#!/usr/bin/env node

/**
 * Test ApiKeysService directement pour voir exact ement où ça crash
 */

const { PrismaClient } = require('@prisma/client');

async function test() {
    const prisma = new PrismaClient();

    try {
        console.log('\n🔍 Testing ApiKeysService logic...\n');

        const userId = 'cmi57ycue0000w3vunopeduv6';
        const provider = 'serp';

        console.log(`1️⃣ Getting user key for ${provider}...`);
        try {
            const aiSettings = await prisma.ai_settings.findUnique({
                where: { userId },
            });
            console.log(`   AI Settings found:`, aiSettings ? '✅' : '❌ (not found, normal)');
        } catch (e) {
            console.log(`   ❌ Error accessing ai_settings:`, e.message);
        }

        console.log(`\n2️⃣ Getting agency key for ${provider}...`);
        const user = await prisma.users.findUnique({
            where: { email: 'test@example.com' }
        });

        if (user.agencyId) {
            try {
                const agencyKeys = await prisma.agencyApiKeys.findUnique({
                    where: { agencyId: user.agencyId }
                });
                console.log(`   ✅ Agency Keys found:`, agencyKeys ? 'yes' : 'no');
                if (agencyKeys) {
                    console.log(`      SerpAPI key:`, agencyKeys.serpApiKey ? '✅ encrypted' : '❌ missing');
                }
            } catch (e) {
                console.log(`   ❌ Error accessing agencyApiKeys:`, e.message);
            }
        }

        console.log(`\n3️⃣ Getting super admin key...`);
        try {
            const setting = await prisma.globalSettings.findUnique({
                where: { key: 'superadmin_serp_key' }
            });
            console.log(`   GlobalSettings found:`, setting ? '✅' : '❌ (not found, normal)');
        } catch (e) {
            console.log(`   ❌ Error accessing globalSettings:`, e.message);
        }

        console.log('\n✅ All Prisma operations completed!');

    } catch (error) {
        console.error('❌ Unhandled error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
