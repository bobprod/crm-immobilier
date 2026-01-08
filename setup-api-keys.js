const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupApiKeys() {
    try {
        console.log('🔧 Injection des clés API...\n');

        // Firecrawl Key
        console.log('📝 Firecrawl...');
        const firecrawlResult = await prisma.apiKey.upsert({
            where: {
                provider_userId: {
                    provider: 'firecrawl',
                    userId: null, // Global key
                }
            },
            update: {
                apiKey: 'fc-5155e16eacdd413c9ca43947ed4c4434',
                isActive: true,
            },
            create: {
                provider: 'firecrawl',
                apiKey: 'fc-5155e16eacdd413c9ca43947ed4c4434',
                isActive: true,
                userId: null, // Global
            },
        });
        console.log('✅ Firecrawl configuré\n');

        // SerpAPI Key (si fourni)
        const serpApiKey = process.argv[2];
        if (serpApiKey) {
            console.log('📝 SerpAPI...');
            const serpResult = await prisma.apiKey.upsert({
                where: {
                    provider_userId: {
                        provider: 'serpapi',
                        userId: null,
                    }
                },
                update: {
                    apiKey: serpApiKey,
                    isActive: true,
                },
                create: {
                    provider: 'serpapi',
                    apiKey: serpApiKey,
                    isActive: true,
                    userId: null,
                },
            });
            console.log('✅ SerpAPI configuré\n');
        }

        // Pica AI Key (si fourni)
        const picaKey = process.argv[3];
        if (picaKey) {
          console.log('📝 Pica AI...');
          const picaResult = await prisma.apiKey.upsert({
            where: {
              provider_userId: {
                provider: 'pica',
                userId: null,
              }
            },
            update: {
              apiKey: picaKey,
              isActive: true,
            },
            create: {
              provider: 'pica',
              apiKey: picaKey,
              isActive: true,
              userId: null,
            },
          });
          console.log('✅ Pica AI configuré\n');
        }

        // Jina AI Key (si fourni)
        const jinaKey = process.argv[4];
        if (jinaKey) {
          console.log('📝 Jina.ai...');
          const jinaResult = await prisma.apiKey.upsert({
            where: {
              provider_userId: {
                provider: 'jina',
                userId: null,
              }
            },
            update: {
              apiKey: jinaKey,
              isActive: true,
            },
            create: {
              provider: 'jina',
              apiKey: jinaKey,
              isActive: true,
              userId: null,
            },
          });
          console.log('✅ Jina.ai configuré\n');
        }

        console.log('✅ Toutes les clés API ont été sauvegardées!');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

setupApiKeys();

