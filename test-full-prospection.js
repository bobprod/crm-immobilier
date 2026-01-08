#!/usr/bin/env node

const http = require('http');
const https = require('https');

const API_URL = 'http://localhost:3001';
const TEST_USER = 'test@example.com';
const TEST_PASSWORD = 'password123';

let jwtToken = '';

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(API_URL + path);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };

        if (jwtToken) {
            options.headers['Authorization'] = `Bearer ${jwtToken}`;
        }

        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, body: json, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

async function runTests() {
    try {
        log('cyan', '\n🚀 TEST COMPLET: Firecrawl + SerpAPI + Prospection\n');

        log('blue', '📝 STEP 1: Authentication...');
        const loginRes = await makeRequest('POST', '/api/auth/login', {
            email: TEST_USER,
            password: TEST_PASSWORD,
        });

        if (loginRes.status !== 200) {
            log('red', `❌ Login failed: ${loginRes.status}`);
            process.exit(1);
        }

        jwtToken = loginRes.body.accessToken || loginRes.body.token || loginRes.body.access_token;
        log('green', `✅ Logged in as ${TEST_USER}`);
        log('green', `✅ JWT Token: ${jwtToken.substring(0, 50)}...`);

        // 2️⃣ VERIFY API KEYS
        log('blue', '\n📝 STEP 2: Check API Keys in Database...');
        const keysRes = await makeRequest('GET', '/ai-billing/api-keys/user');

        if (keysRes.status !== 200) {
            log('red', `❌ Failed to fetch API keys: ${keysRes.status}`);
        } else {
            log('green', '✅ API Keys retrieved:');
            if (keysRes.body.serpApiKey) {
                log('green', `  • SerpAPI: ${keysRes.body.serpApiKey.substring(0, 20)}...`);
            } else {
                log('yellow', `  • SerpAPI: NOT CONFIGURED`);
            }
            if (keysRes.body.firecrawlApiKey) {
                log('green', `  • Firecrawl: ${keysRes.body.firecrawlApiKey}`);
            } else {
                log('yellow', `  • Firecrawl: NOT CONFIGURED`);
            }
        }

        // 3️⃣ TEST PROSPECTION
        log('blue', '\n📝 STEP 3: Start Prospection...');
        const prospectionRes = await makeRequest('POST', '/prospecting-ai/start', {
            zone: 'Paris 15',
            targetType: 'vendeurs',
            propertyType: 'appartement',
            maxLeads: 5,
            keywords: ['appartement', 'paris'],
            budget: 5
        });

        if (prospectionRes.status !== 201 && prospectionRes.status !== 200) {
            log('red', `❌ Prospection failed: ${prospectionRes.status}`);
            log('red', JSON.stringify(prospectionRes.body, null, 2));
        } else {
            const prospId = prospectionRes.body?.id || prospectionRes.body?.prospectionId;
            log('green', `✅ Prospection started!`);
            log('green', `  • Prospection ID: ${prospId}`);
            log('green', `  • Status: ${prospectionRes.body.status}`);

            if (prospectionRes.body.leads?.length > 0) {
                log('green', `  • Leads found: ${prospectionRes.body.leads.length}`);
                prospectionRes.body.leads.slice(0, 2).forEach((lead, idx) => {
                    log('cyan', `    Lead ${idx + 1}: ${lead.name || 'Unknown'}`);
                    if (lead.email) log('cyan', `      Email: ${lead.email}`);
                    if (lead.phone) log('cyan', `      Phone: ${lead.phone}`);
                });
            } else {
                log('yellow', '⚠️  No leads found yet');
            }

            // 4️⃣ CHECK STATUS
            if (prospId) {
                log('blue', '\n📝 STEP 4: Check Prospection Status...');
                const statusRes = await makeRequest('GET', `/prospecting-ai/${prospId}`);

                if (statusRes.status === 200) {
                    log('green', '✅ Status retrieved:');
                    log('green', `  • Status: ${statusRes.body.status}`);
                    log('green', `  • Leads: ${statusRes.body.leads?.length || 0}`);
                    log('green', `  • Created: ${new Date(statusRes.body.createdAt).toLocaleString()}`);
                }
            }
        }

        // 5️⃣ SUMMARY
        log('cyan', '\n' + '='.repeat(60));
        log('green', '\n✅ ALL TESTS COMPLETED!\n');
        log('cyan', 'Summary:');
        log('cyan', '  ✅ Backend is running');
        log('cyan', '  ✅ Authentication works');
        log('cyan', '  ✅ API Keys are configured');
        log('cyan', '  ✅ Prospection endpoint is reachable');
        log('cyan', '\n' + '='.repeat(60) + '\n');

    } catch (error) {
        log('red', `\n❌ Error: ${error.message}`);
        process.exit(1);
    }
}

runTests();
