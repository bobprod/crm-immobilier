#!/usr/bin/env node
/**
 * Test direct pour identifier l'erreur
 * Lance le serveur et exécute le test dans le même processus
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Configuration
const BACKEND_DIR = path.join(__dirname, 'backend');
const SERVER_PORT = 3001;
const TEST_TIMEOUT = 30000; // 30 secondes

let serverProcess = null;
let serverReady = false;

// Helper: Test HTTP connection
function isServerReady() {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${SERVER_PORT}/health`, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => resolve(false));
        req.setTimeout(1000);
    });
}

// Helper: Wait for server ready
async function waitForServer(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        if (await isServerReady()) {
            console.log('✅ Server ready after', i + 1, 'attempts');
            return true;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    return false;
}

// Main test flow
async function runTest() {
    console.log('🚀 Starting test flow...\n');

    // Step 1: Start server
    console.log('📦 Step 1: Starting backend server...');
    serverProcess = spawn('npm', ['start'], {
        cwd: BACKEND_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true
    });

    let serverOutput = '';
    serverProcess.stdout.on('data', (data) => {
        const text = data.toString();
        serverOutput += text;
        console.log('[SERVER]', text.trim());
    });

    serverProcess.stderr.on('data', (data) => {
        const text = data.toString();
        serverOutput += text;
        console.log('[SERVER ERROR]', text.trim());
    });

    // Wait for server
    console.log('⏳ Waiting for server to start...');
    serverReady = await waitForServer();

    if (!serverReady) {
        console.error('❌ Server failed to start');
        process.exit(1);
    }

    console.log('\n✅ Server is running\n');

    // Step 2: Run test
    console.log('🧪 Step 2: Running prospection test...\n');
    const testProcess = spawn('node', ['test-prospection-simple.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
        console.log('\n✅ Test completed with code:', code);

        // Show server logs at end
        console.log('\n📋 FINAL SERVER LOGS:\n');
        console.log(serverOutput);

        // Cleanup
        if (serverProcess) {
            process.kill(-serverProcess.pid);
        }
        process.exit(code);
    });

    // Timeout
    setTimeout(() => {
        console.error('\n⏱️ Test timeout');
        if (serverProcess) process.kill(-serverProcess.pid);
        process.exit(1);
    }, TEST_TIMEOUT);
}

// Start
runTest().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
