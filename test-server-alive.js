const http = require('http');

// Teste une requête simple
const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const data = JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
});

console.log('Attempting to connect to http://localhost:3001...');

const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(responseData);
            console.log('✅ Server is running!');
            console.log('Response:', json);
        } catch (e) {
            console.log('Server response:', responseData);
        }
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.log('❌ Server not responding:', e.message);
    process.exit(1);
});

req.write(data);
req.end();

setTimeout(() => {
    console.log('❌ Request timeout');
    process.exit(1);
}, 5000);
