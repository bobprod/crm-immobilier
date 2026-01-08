#!/usr/bin/env node

const http = require('http');

async function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    console.log('\n🚀 TEST FIRECRAWL + LLM (sans SerpAPI)\n');

    try {
        // 1. Auth
        console.log('1️⃣  Authentification...');
        const auth = await request('POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        if (auth.status !== 200) {
            console.error('❌ Auth failed:', auth.body);
            return;
        }
        const token = auth.body.accessToken;
        console.log(`✅ JWT obtenu`);

        // 2. Test Firecrawl seul (scraping d'une URL)
        console.log('\n2️⃣  Test Firecrawl (scrape une URL)...');
        const firecrawlRes = await request('POST', '/api/ai-orchestrator/test-firecrawl', {
            url: 'https://www.seloger.com/immobilier/achat/immeuble/paris-75/paris-15-75015/annonces.html',
            formats: ['markdown']
        }, token);

        console.log(`Status: ${firecrawlRes.status}`);
        if (firecrawlRes.status === 200 || firecrawlRes.status === 201) {
            console.log(`✅ Firecrawl a scrapé le contenu`);
            if (firecrawlRes.body.data) {
                console.log(`📄 Contenu scrapé: ${firecrawlRes.body.data.substring(0, 200)}...`);
            }
        } else {
            console.log(`❌ Firecrawl échoue:`, firecrawlRes.body);
        }

        // 3. Test LLM seul (analyser du texte)
        console.log('\n3️⃣  Test LLM (analyser un texte)...');
        const llmRes = await request('POST', '/api/ai-orchestrator/test-llm', {
            prompt: 'Extrais les informations de contact (nom, email, téléphone) du texte suivant: Jean Dupont, email: jean@example.com, tél: 06 12 34 56 78',
            model: 'gpt-4'
        }, token);

        console.log(`Status: ${llmRes.status}`);
        if (llmRes.status === 200 || llmRes.status === 201) {
            console.log(`✅ LLM a analysé le texte`);
            if (llmRes.body.response) {
                console.log(`📝 Réponse LLM: ${llmRes.body.response.substring(0, 200)}...`);
            }
        } else {
            console.log(`❌ LLM échoue:`, llmRes.body);
        }

        // 4. Test complet: Prospection avec Firecrawl + LLM (pas SerpAPI)
        console.log('\n4️⃣  Test prospection complète (Firecrawl + LLM, sans SerpAPI)...');
        const prospRes = await request('POST', '/api/prospecting-ai/start', {
            zone: 'Paris 15',
            targetType: 'vendeurs',
            propertyType: 'appartement',
            maxLeads: 3,
            // Force d'utiliser Firecrawl + LLM
            options: {
                skipSerpApi: true,
                useLocalUrls: [
                    'https://www.seloger.com/immobilier/achat/immeuble/paris-75/',
                    'https://www.leboncoin.fr/vi/paris/immobilier/vente/'
                ]
            }
        }, token);

        console.log(`Status: ${prospRes.status}`);
        console.log(`Response:`, JSON.stringify(prospRes.body, null, 2));

        if (prospRes.status === 201 || prospRes.status === 200) {
            const result = prospRes.body;
            if (result.status === 'success') {
                console.log(`\n✅ Prospection RÉUSSIE!`);
                console.log(`📊 Leads trouvés: ${result.leads.length}`);
                result.leads.forEach((lead, i) => {
                    console.log(`  ${i + 1}. ${lead.name || 'N/A'} - ${lead.email || 'N/A'}`);
                });
            } else if (result.status === 'failed') {
                console.log(`\n❌ Prospection échouée`);
                console.log(`Erreurs:`, result.errors);
            } else {
                console.log(`\n⏳ Prospection en cours ou incomplète`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

runTest();
