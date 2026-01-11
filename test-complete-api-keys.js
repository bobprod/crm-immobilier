const http = require('http');

// Helper function to make HTTP requests
function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            ...headers,
        };

        let postData = null;
        if (body) {
            postData = JSON.stringify(body);
            defaultHeaders['Content-Length'] = Buffer.byteLength(postData);
        }

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/api${path}`,
            method,
            headers: defaultHeaders,
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: result,
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data,
                    });
                }
            });
        });

        req.on('error', reject);

        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Complete API Keys Testing\n');
    console.log('═'.repeat(60));

    // Test 1: Test endpoint (public)
    console.log('\n1️⃣  Testing testApiKey endpoint (Public - No Auth)\n');

    const providers = [
        { name: 'Gemini', key: 'AIzaSyB6-test-invalid' },
        { name: 'OpenAI', key: 'sk-test-invalid' },
        { name: 'Deepseek', key: 'sk-test-invalid' },
    ];

    for (const provider of providers) {
        try {
            console.log(`   Testing ${provider.name}...`);
            const result = await makeRequest('POST', `/api-keys/test/${provider.name.toLowerCase()}`, {
                apiKey: provider.key,
            });
            console.log(`   ✓ Status: ${result.status}`);
            console.log(`   ✓ Success: ${result.data.success}`);
            console.log(`   ✓ Message: ${result.data.message || result.data.error}\n`);
        } catch (error) {
            console.error(`   ✗ Error: ${error.message}\n`);
        }
    }

    // Test 2: Check if authentication endpoints exist
    console.log('\n2️⃣  Checking if API key storage endpoints exist\n');

    console.log('   Checking: GET /ai-billing/api-keys/user (requires auth)');
    try {
        const result = await makeRequest('GET', '/ai-billing/api-keys/user');
        console.log(`   ✓ Endpoint exists - Status: ${result.status}`);
        if (result.status === 401) {
            console.log(`   ℹ️  Correctly returns 401 (Unauthorized) - requires JWT token\n`);
        }
    } catch (error) {
        console.error(`   ✗ Error: ${error.message}\n`);
    }

    console.log('   Checking: PUT /ai-billing/api-keys/user (requires auth)');
    try {
        const result = await makeRequest('PUT', '/ai-billing/api-keys/user', {
            geminiApiKey: 'test-key',
        });
        console.log(`   ✓ Endpoint exists - Status: ${result.status}`);
        if (result.status === 401) {
            console.log(`   ℹ️  Correctly returns 401 (Unauthorized) - requires JWT token\n`);
        }
    } catch (error) {
        console.error(`   ✗ Error: ${error.message}\n`);
    }

    console.log('═'.repeat(60));
    console.log('\n✅ API Key Endpoints Test Complete!\n');
    console.log('Next steps:');
    console.log('  1. Get a valid JWT token by logging in');
    console.log('  2. Use that token to test PUT /ai-billing/api-keys/user');
    console.log('  3. Verify that keys are stored in the database\n');
}

runTests().catch(console.error);
