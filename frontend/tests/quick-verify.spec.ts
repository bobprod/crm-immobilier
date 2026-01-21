import { test, expect } from '@playwright/test';

test.describe('Quick Test Button Verification', () => {
    test('Verify test buttons exist after rebuild', async ({ page }) => {
        console.log('\n========== QUICK VERIFICATION ==========\n');

        // Give server time to respond
        let attempt = 0;
        let response;

        while (attempt < 5) {
            try {
                response = await page.goto('http://localhost:3000/settings/ai-api-keys', {
                    waitUntil: 'domcontentloaded',
                    timeout: 15000,
                });
                if (response?.status() === 200) break;
            } catch (e) {
                console.log(`[Attempt ${attempt + 1}] Connection failed, retrying...`);
            }
            attempt++;
            await page.waitForTimeout(2000);
        }

        console.log(`[STATUS] Response: ${response?.status()}`);

        // Try login
        try {
            const emailField = await page.locator('input[type="email"]').first();
            if (await emailField.isVisible().catch(() => false)) {
                console.log('[LOGIN] Detected login page');
                await emailField.fill('test@example.com');
                await page.locator('input[type="password"]').first().fill('password123');
                await page.locator('button:has-text("Se connecter")').click().catch(() => { });
                await page.waitForTimeout(2000);
            }
        } catch (e) {
            console.log('[LOGIN] Login attempt skipped');
        }

        // Navigate to API keys
        await page.goto('http://localhost:3000/settings/ai-api-keys', {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
        }).catch(() => { });

        await page.waitForTimeout(2000);

        // Check for test buttons - JUST the key indicators
        const html = await page.content();

        const hasTester = html.includes('Tester');
        const hasTestTube = html.includes('TestTube');
        const hasHandleTest = html.includes('handleTestApiKey');
        const hasTestButtonComponent = html.match(/onClick=\{.*handleTestApiKey/);

        console.log(`\n[FINAL RESULTS]`);
        console.log(`  ✓ Contains "Tester": ${hasTester ? '✅ YES' : '❌ NO'}`);
        console.log(`  ✓ Contains "TestTube": ${hasTestTube ? '✅ YES' : '❌ NO'}`);
        console.log(`  ✓ Contains "handleTestApiKey": ${hasHandleTest ? '✅ YES' : '❌ NO'}`);
        console.log(`  ✓ Has test button event handler: ${hasTestButtonComponent ? '✅ YES' : '❌ NO'}`);

        // Count buttons
        const testBtnElements = await page.locator('button:has-text("Tester")').all();
        console.log(`\n[BUTTON COUNT] "Tester" buttons found: ${testBtnElements.length}`);

        // If no buttons, check why
        if (!hasTester) {
            console.log(`\n[DEBUGGING] If no Tester buttons:`);
            const allButtons = await page.locator('button').all();
            console.log(`  - Total buttons on page: ${allButtons.length}`);

            const inputs = await page.locator('input[type="password"]').all();
            console.log(`  - API Key inputs: ${inputs.length}`);
        }

        console.log('\n========== VERIFICATION END ==========\n');

        expect(hasTester || testBtnElements.length > 0).toBe(true);
    });
});
