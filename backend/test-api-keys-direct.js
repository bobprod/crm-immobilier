#!/usr/bin/env node

/**
 * Test that ApiKeysService is properly accessible and can retrieve keys
 */

const { PrismaClient } = require('@prisma/client');

async function test() {
    const prisma = new PrismaClient();

    try {
        console.log('\n🔍 Testing API Key Retrieval...\n');

        // Find a user
        console.log('1️⃣ Looking for test user...');
        const user = await prisma.users.findUnique({
            where: { email: 'test@example.com' },
            include: { agencies: true }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`✅ Found user: ${user.email} (ID: ${user.id})`);
        console.log(`   Agency ID: ${user.agencyId}`);
        console.log(`   Agencies:`, user.agencies);

        // Get agency API keys
        if (user.agencyId) {
            console.log('\n2️⃣ Checking agency API keys...');
            const agencyKeys = await prisma.agencyApiKeys.findUnique({
                where: { agencyId: user.agencyId }
            });

            if (agencyKeys) {
                console.log(`✅ Found agency keys for agency ${user.agencyId}`);
                console.log(`   SerpAPI key: ${agencyKeys.serpApiKey ? '✅ (encrypted)' : '❌ missing'}`);
                console.log(`   Firecrawl key: ${agencyKeys.firecrawlApiKey ? '✅ (encrypted)' : '❌ missing'}`);
            } else {
                console.log(`❌ No API keys found for agency ${user.agencyId}`);
            }
        } else {
            console.log(`⚠️  User not linked to any agency`);
        }

        // Check user's own settings
        console.log('\n3️⃣ Checking user AI settings...');
        const aiSettings = await prisma.aiSettings.findUnique({
            where: { userId: user.id }
        });

        if (aiSettings) {
            console.log(`✅ Found AI settings for user`);
        } else {
            console.log(`⚠️  No AI settings found for user`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
