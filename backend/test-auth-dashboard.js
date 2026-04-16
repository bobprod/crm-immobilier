const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken'); // Need to find secret
const axios = require('axios');

async function run() {
  try {
    // Generate a quick JWT if possible using process.env.JWT_SECRET or from nest-config
    let secret = process.env.JWT_SECRET || 'super-secret-key';
    const fs = require('fs');
    if (fs.existsSync('.env')) {
       const env = fs.readFileSync('.env', 'utf8');
       const match = env.match(/JWT_SECRET=(.*)/);
       if (match) secret = match[1];
    }
    
    const token = jwt.sign({ userId: 'tester', email: 'test@example.com' }, secret);
    console.log("Token:", token.substring(0, 15) + "...");
    const res = await axios.get('http://localhost:3001/api/marketing-tracking/analytics/dashboard', {
       headers: { Authorization: `Bearer ${token}` }
    });
    console.log(res.data);
  } catch (e) {
    if (e.response) {
      console.log('Status', e.response.status);
      console.log('Error data', e.response.data);
    } else {
      console.log(e.message);
    }
  }
}
run();
