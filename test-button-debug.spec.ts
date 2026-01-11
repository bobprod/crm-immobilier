import { test, expect } from '@playwright/test';

test.describe('Button Click Debug - "Enregistrer les clés LLM"', () => {
    test('Debug: Click button and capture all actions', async ({ page, context }) => {
        console.log('🔍 Starting button click debug test...\n');

        // 1. Check environment
        console.log('📋 Step 1: Checking environment');
        console.log(`   Frontend URL: http://localhost:3000`);
        console.log(`   Backend URL: http://localhost:3001\n`);

        // 2. Navigate
        console.log('📍 Step 2: Navigating to settings page');
        await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
        await page.waitForLoadState('domcontentloaded');
        console.log('   ✅ Page loaded\n');

        // 3. Intercept console messages
        page.on('console', msg => console.log(`   [CONSOLE] ${msg.type()}: ${msg.text()}`));

        // 4. Intercept requests
        page.on('request', request => {
            if (request.url().includes('ai-billing')) {
                console.log(`   [REQUEST] ${request.method()} ${request.url()}`);
            }
        });

        page.on('response', response => {
            if (response.url().includes('ai-billing')) {
                console.log(`   [RESPONSE] ${response.status()} ${response.url()}`);
            }
        });

        // 5. Check if logged in
        console.log('📍 Step 3: Checking authentication');
        const token = await page.evaluate(() => localStorage.getItem('token'));
        if (token) {
            console.log(`   ✅ Token found: ${token.substring(0, 20)}...\n`);
        } else {
            console.log('   ❌ NO TOKEN IN LOCALSTORAGE\n');
            console.log('   ⚠️  This is likely the issue - not authenticated!\n');
        }

        // 6. Check API URL
        console.log('📍 Step 4: Checking API URL environment');
        const apiUrl = await page.evaluate(() => {
            return (window as any).__NEXT_PUBLIC_API_URL__ || process.env.NEXT_PUBLIC_API_URL;
        });
        console.log(`   API URL: ${apiUrl}\n`);

        // 7. Click LLM tab
        console.log('📍 Step 5: Clicking LLM tab');
        const llmTab = page.locator('[data-testid="tab-llm"]');
        const tabExists = await llmTab.isVisible({ timeout: 5000 }).catch(() => false);

        if (tabExists) {
            await llmTab.click();
            await page.waitForTimeout(500);
            console.log('   ✅ LLM tab clicked\n');
        } else {
            console.log('   ❌ LLM tab not found!\n');
            throw new Error('LLM tab not found');
        }

        // 8. Find button
        console.log('📍 Step 6: Finding save button');
        const button = page.locator('[data-testid="button-save-llm"]');
        const buttonVisible = await button.isVisible({ timeout: 5000 }).catch(() => false);

        if (buttonVisible) {
            console.log('   ✅ Button found and visible');

            // Get button details
            const buttonText = await button.innerText();
            const isDisabled = await button.isDisabled();
            const boundingBox = await button.boundingBox();

            console.log(`   Button text: ${buttonText}`);
            console.log(`   Disabled: ${isDisabled}`);
            console.log(`   Position: ${JSON.stringify(boundingBox)}\n`);
        } else {
            console.log('   ❌ Button not found or not visible!\n');
            throw new Error('Button not found');
        }

        // 9. Check if we need to fill some data first
        console.log('📍 Step 7: Filling test data');
        const apiKeyInput = page.locator('[data-testid="input-openaiApiKey"]');
        if (await apiKeyInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await apiKeyInput.fill('sk-test123456789');
            console.log('   ✅ Test API key filled\n');
        }

        // 10. Click button
        console.log('📍 Step 8: Clicking "Enregistrer les clés LLM" button');
        try {
            await button.click({ force: true, timeout: 10000 });
            console.log('   ✅ Button click executed\n');
        } catch (error) {
            console.log(`   ❌ Click failed: ${error}\n`);
            throw error;
        }

        // 11. Wait for response
        console.log('📍 Step 9: Waiting for response...');
        await page.waitForTimeout(2000);
        console.log('   ✅ Waited 2 seconds\n');

        // 12. Check for toast
        console.log('📍 Step 10: Looking for toast notification');
        const successToast = page.locator('text=/✅|Clés LLM sauvegardées|Erreur|Authentification/');
        const toastVisible = await successToast.isVisible({ timeout: 5000 }).catch(() => false);

        if (toastVisible) {
            const toastText = await successToast.innerText();
            console.log(`   ✅ Toast found: ${toastText}\n`);
        } else {
            console.log('   ❌ NO TOAST APPEARED\n');
        }

        // 13. Check console for errors
        console.log('📍 Step 11: Checking for JavaScript errors');
        const errors = await page.evaluate(() => {
            return (window as any).__errors__ || [];
        });

        if (errors.length > 0) {
            console.log(`   ⚠️  Found ${errors.length} errors in console\n`);
        } else {
            console.log('   ✅ No JS errors detected\n');
        }

        // 14. Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📊 SUMMARY');
        console.log('═══════════════════════════════════════════════════════════\n');

        if (!token) {
            console.log('❌ ISSUE FOUND: User not authenticated (no token)');
            console.log('   Solution: Log in first before accessing settings\n');
        } else if (!apiUrl) {
            console.log('❌ ISSUE FOUND: NEXT_PUBLIC_API_URL not configured');
            console.log('   Solution: Set NEXT_PUBLIC_API_URL in .env.local\n');
        } else {
            console.log('✅ All checks passed');
            console.log('   Button should be functional\n');
        }

        console.log('═══════════════════════════════════════════════════════════\n');
    });

    test('Action: Click button with minimal setup', async ({ page }) => {
        console.log('\n🎯 Testing button click with authentication...\n');

        // Set up localStorage with token
        await page.context().addInitScript(() => {
            localStorage.setItem('token', 'test-jwt-token-' + Date.now());
            localStorage.setItem('userId', 'test-user-id');
        });

        // Navigate
        await page.goto('http://localhost:3000/settings', { waitUntil: 'domcontentloaded' });

        // Wait a bit for hydration
        await page.waitForTimeout(1000);

        // Click LLM tab
        const llmTab = page.locator('[data-testid="tab-llm"]');
        if (await llmTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await llmTab.click();
            await page.waitForTimeout(500);
        }

        // Find and click button
        const button = page.locator('[data-testid="button-save-llm"]');

        console.log('Clicking button...');

        // Listen for network requests
        const requestPromise = page.waitForResponse(
            response => response.url().includes('ai-billing/api-keys'),
            { timeout: 10000 }
        ).catch(() => {
            console.log('No API response within timeout');
            return null;
        });

        // Click button
        await button.click();

        // Wait for request
        const response = await requestPromise;

        if (response) {
            console.log(`✅ API request made: ${response.status()}`);
            const body = await response.json();
            console.log(`Response: ${JSON.stringify(body, null, 2)}`);
        } else {
            console.log('❌ No API request detected');
        }

        // Check for toast
        await page.waitForTimeout(1000);
        const toast = page.locator('text=/✅|❌|Clés/');
        if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log(`✅ Toast appeared: ${await toast.innerText()}`);
        } else {
            console.log('❌ No toast appeared');
        }
    });
});
