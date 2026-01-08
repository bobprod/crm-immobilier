const http = require('http');
const https = require('https');

// Configuration
const API_BASE = 'http://localhost:3001';
const USER_ID = 'cmi57ycue0000w3vunopeduv6';
const AGENCY_ID = 'cmk5fdg2f0000v5qcmie0wjpn';
const TOKEN = process.env.AUTH_TOKEN || 'test-token'; // À remplacer par un vrai token

// Utilitaires
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'X-User-Id': USER_ID,
                'X-Agency-Id': AGENCY_ID,
            },
        };

        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body, headers: res.headers });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Tests
async function runTests() {
    console.log('🧪 Testing Multi-Provider System...\n');

    try {
        // Test 1: GET /api/ai/orchestrate/providers/available
        console.log('📡 Test 1: GET /api/ai/orchestrate/providers/available');
        const result1 = await makeRequest('GET', '/api/ai/orchestrate/providers/available');

        if (result1.status === 200) {
            console.log('✅ Status: 200 OK');
            console.log('📊 Response:');
            console.log(JSON.stringify(result1.data, null, 2));

            // Analyse
            if (result1.data.available) {
                console.log(`\n📦 Available Providers: ${result1.data.available.length}`);
                result1.data.available.forEach((p) => {
                    const icon = p.available ? '✅' : '❌';
                    console.log(`  ${icon} ${p.provider} (${p.tier}) - ${p.available ? 'Available' : 'Not Available'}`);
                });
            }

            if (result1.data.strategy) {
                console.log(`\n🎯 Current Strategy:`);
                console.log(`  Search: ${result1.data.strategy.search.join(', ') || 'None'}`);
                console.log(`  Scrape: ${result1.data.strategy.scrape.join(', ') || 'None'}`);
            }
        } else {
            console.log(`❌ Status: ${result1.status}`);
            console.log('Response:', result1.data);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test 2: POST /api/ai/orchestrate/providers/preferences
        console.log('💾 Test 2: POST /api/ai/orchestrate/providers/preferences');

        const prefsData = {
            searchProviders: ['serpapi'],
            scrapingProviders: ['firecrawl'],
            autoFallback: true,
        };

        const result2 = await makeRequest('POST', '/api/ai/orchestrate/providers/preferences', prefsData);

        if (result2.status === 201 || result2.status === 200) {
            console.log(`✅ Status: ${result2.status}`);
            console.log('📝 Saved Preferences:');
            console.log(JSON.stringify(prefsData, null, 2));
        } else {
            console.log(`❌ Status: ${result2.status}`);
            console.log('Response:', result2.data);
        }

        console.log('\n' + '='.repeat(60) + '\n');

        // Test 3: Verify preferences were saved
        console.log('🔍 Test 3: Verify Preferences (GET again)');
        const result3 = await makeRequest('GET', '/api/ai/orchestrate/providers/available');

        if (result3.status === 200 && result3.data.strategy) {
            console.log('✅ Preferences verified');
            console.log(`📌 Strategy after save:`);
            console.log(`  Search: ${result3.data.strategy.search.join(', ') || 'None'}`);
            console.log(`  Scrape: ${result3.data.strategy.scrape.join(', ') || 'None'}`);
        }

        console.log('\n' + '='.repeat(60) + '\n');
        console.log('✅ All tests completed!\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

runTests();
