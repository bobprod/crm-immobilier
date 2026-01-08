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
    console.log('\n🚀 TEST DIRECT API KEYS\n');

    try {
        // 1. Auth
        console.log('1️⃣ Authentification...');
        const auth = await request('POST', '/api/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        if (auth.status !== 200) {
            console.error('❌ Auth failed:', auth.body);
            return;
        }
        const token = auth.body.accessToken;
        const userId = auth.body.user?.id || 'cmi57ycue0000w3vunopeduv6';
        console.log(`✅ JWT: ${token.substring(0, 40)}...`);
        console.log(`✅ UserId: ${userId}`);

        // 2. Test direct API Keys endpoint
        console.log('\n2️⃣ Test API Keys Directement...');
        const keysRes = await request('POST', '/api/debug/get-api-keys', {
            userId: userId,
            provider: 'serp'
        }, token);

        console.log(`Status: ${keysRes.status}`);
        console.log(`Response:`, JSON.stringify(keysRes.body, null, 2));

        if (keysRes.status === 200 || keysRes.status === 201) {
            console.log(`✅ API Keys retrieved successfully!`);
        } else {
            console.log(`❌ Failed to get API keys`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

runTest();
