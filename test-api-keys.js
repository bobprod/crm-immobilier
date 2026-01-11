const http = require('http');

function testApiKey(provider, apiKey) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            apiKey: apiKey,
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: `/api/api-keys/test/${provider}`,
            'Content-Length': Buffer.byteLength(postData),
        },
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
                    provider,
                    status: res.statusCode,
                    result,
                });
            } catch (e) {
                resolve({
                    provider,
                    status: res.statusCode,
                    result: data,
                });
            }
        });
    });

    req.on('error', (error) => {
        reject(error);
    });

    req.write(postData);
    req.end();
});
}

async function runTests() {
    console.log('🧪 Testing API Keys Endpoints\n');

    const tests = [
        { provider: 'gemini', apiKey: 'AIzaSyB6-test-invalid-key' },
        { provider: 'openai', apiKey: 'sk-test-invalid-key' },
        { provider: 'deepseek', apiKey: 'sk-test-invalid-key' },
    ];

    for (const test of tests) {
        try {
            console.log(`\n📝 Testing ${test.provider.toUpperCase()}...`);
            const result = await testApiKey(test.provider, test.apiKey);
            console.log(`   Status: ${result.status}`);
            console.log(`   Result:`, JSON.stringify(result.result, null, 2));
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
}

runTests();
