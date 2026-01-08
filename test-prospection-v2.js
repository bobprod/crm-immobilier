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
    console.log('\n🚀 TEST AVEC LOGGING DÉTAILLÉ\n');

    try {
        const auth = await request('POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        if (auth.status !== 200) {
            console.error('❌ Auth failed');
            return;
        }

        const token = auth.body.accessToken;
        console.log('✅ Authentifié');

        const prospReq = http.request({
            hostname: 'localhost',
            port: 3001,
            path: '/api/prospecting-ai/start',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const body = JSON.parse(data);
                    console.log(`\nStatus: ${res.statusCode}\n`);

                    if (body.errors && body.errors.length > 0) {
                        console.log('❌ ERREURS:');
                        body.errors.forEach(err => {
                            console.log(`  ${err}`);
                        });
                    }

                    if (body.status === 'success') {
                        console.log(`✅ Succès! ${body.leads.length} leads trouvées`);
                    }
                } catch (e) {
                    console.log('Response:', data);
                }
            });
        });

        prospReq.on('error', (e) => console.error('Request error:', e));
        prospReq.write(JSON.stringify({
            zone: 'Paris 15',
            targetType: 'vendeurs',
            propertyType: 'appartement',
            maxLeads: 5
        }));
        prospReq.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

runTest();
