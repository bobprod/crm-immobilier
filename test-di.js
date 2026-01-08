#!/usr/bin/env node

/**
 * Test si ApiKeysService peut être injecté
 */

const { NestFactory } = require('@nestjs/core');
const { Module, Injectable } = require('@nestjs/common');
const path = require('path');

// Charger le module compilé
const { AppModule } = require(path.join(
    __dirname,
    'backend/dist/app.module'
));

async function test() {
    try {
        console.log('\n🔍 Testing DI...\n');

        const app = await NestFactory.createApplicationContext(AppModule);

        console.log('✅ AppModule loaded');

        // Essayer d'obtenir SerpApiService
        const serpApiService = app.get('SerpApiService');
        console.log('SerpApiService:', serpApiService ? '✅ Found' : '❌ NOT FOUND');

        // Essayer d'obtenir ApiKeysService
        const apiKeysService = app.get('ApiKeysService');
        console.log('ApiKeysService:', apiKeysService ? '✅ Found' : '❌ NOT FOUND');

        await app.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

test();
