const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupApiKeys() {
    try {
        console.log('🔧 Injection des clés API dans AgencyApiKeys...\n');

        // D'abord, trouver ou créer une agence par défaut
        let agency = await prisma.agencies.findFirst({
            where: {
                name: { contains: 'Default' }
            }
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
            console.log('✅ Agence créée:', agency.id, '\n');
        }

        console.log('📝 Injection des clés API...');

        const serpApiKey = '4d1adc7a4c06ae306b4dea7cba496a87644a262689809b93d6250036be786fa8';
        const firecrawlApiKey = 'fc-5155e16eacdd413c9ca43947ed4c4434';

        // Upsert API keys
        const result = await prisma.agencyApiKeys.upsert({
            where: { agencyId: agency.id },
            update: {
                serpApiKey: serpApiKey,
                firecrawlApiKey: firecrawlApiKey,
                updatedAt: new Date(),
            },
            create: {
                agencyId: agency.id,
                serpApiKey: serpApiKey,
                firecrawlApiKey: firecrawlApiKey,
            },
        });

        console.log('✅ Clés API injectées avec succès!\n');
        console.log('📊 Résumé:');
        console.log('  • Agence ID:', agency.id);
        console.log('  • Agence Name:', agency.name);
        console.log('  • SerpAPI: ' + serpApiKey.substring(0, 20) + '...');
        console.log('  • Firecrawl: ' + firecrawlApiKey + '\n');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

setupApiKeys();
