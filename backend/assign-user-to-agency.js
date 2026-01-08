#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignUserToAgency() {
    try {
        console.log('🔧 Assignation de l\'utilisateur à une agence...\n');

        // Récupérer ou créer une agence par défaut
        let agency = await prisma.agencies.findFirst({
            where: { name: 'Default Agency' }
        });

        if (!agency) {
            console.log('📝 Création d\'une agence par défaut...');
            agency = await prisma.agencies.create({
                data: {
                    name: 'Default Agency',
                    address: '123 Main Street, Paris',
                    phone: '+33123456789',
                    email: 'admin@default.com',
                }
            });
            console.log('✅ Agence créée:', agency.id);
        } else {
            console.log('✅ Agence trouvée:', agency.id);
        }

        // Assigner l'utilisateur à l'agence
        const user = await prisma.users.update({
            where: { id: 'cmi57ycue0000w3vunopeduv6' },
            data: { agencyId: agency.id }
        });

        console.log('\n✅ Utilisateur assigné à l\'agence!');
        console.log('📊 Résumé:');
        console.log(`  • Utilisateur: ${user.email} (${user.id})`);
        console.log(`  • Agence: ${agency.name} (${agency.id})`);

        // Maintenant vérifier que les clés API sont bien stockées
        const agencyKeys = await prisma.agencyApiKeys.findUnique({
            where: { agencyId: agency.id },
            select: { serpApiKey: true, firecrawlApiKey: true }
        });

        if (agencyKeys) {
            console.log('\n✅ Clés API trouvées pour l\'agence!');
            console.log(`  • SerpAPI: ${agencyKeys.serpApiKey ? '✅ Encrypted' : '❌ Missing'}`);
            console.log(`  • Firecrawl: ${agencyKeys.firecrawlApiKey ? '✅ Encrypted' : '❌ Missing'}`);
        } else {
            console.log('\n⚠️ Aucune clé API trouvée pour cette agence!');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

assignUserToAgency();
