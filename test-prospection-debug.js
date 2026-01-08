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
                    resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
                } catch {
                    resolve({ status: res.statusCode, body: data, headers: res.headers });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    console.log('\n🚀 TEST PROSPECTION DEBUG\n');

    try {
        // 1. Auth
        console.log('1️⃣ Authentification...');
        const auth = await request('POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });
        console.log(`Status: ${auth.status}`);
        if (auth.status !== 200) {
            console.error('❌ Auth failed:', auth.body);
            return;
        }
        const token = auth.body.accessToken;
        console.log(`✅ JWT: ${token.substring(0, 50)}...`);
        console.log(`User from token:`, auth.body.user);

        // 2. Test JWT decode to see what's inside
        console.log('\n2️⃣ Analyzing JWT token...');
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = Buffer.from(parts[1], 'base64').toString();
            console.log('Token payload:', JSON.parse(payload));
        }

        // 3. Start prospection with debug
        console.log('\n3️⃣ Starting prospection...');
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
                    console.log(`Status: ${res.statusCode}`);
                    console.log(`Full Response:`, JSON.stringify(body, null, 2));

                    if (body.errors && body.errors.length > 0) {
                        console.log('\n❌ ERRORS:');
                        body.errors.forEach(err => console.log('  -', err));
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
