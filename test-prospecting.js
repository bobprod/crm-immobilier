const http = require('http');

const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWk1N3ljdWUwMDAwdzN2dW5vcGVkdXY2IiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkFHRU5UIiwiaWF0IjoxNzY3ODA5Mzk1LCJleHAiOjE3Njc4MTI5OTV9.ugmzwIG2-N4LXCkJkjcRHUooTvrsX7o_0lq5gpRaxbA';

const postData = JSON.stringify({
    zone: 'Paris 15',
    targetType: 'vendeurs',
    propertyType: 'appartement',
    maxLeads: 5
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/prospecting-ai/start',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${JWT}`
    }
};

console.log('🚀 Lancement de la prospection avec clé Gemini BYOK...\n');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`✅ Réponse reçue (status: ${res.statusCode})`);
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Erreur: ${e.message}`);
});

req.write(postData);
req.end();
