import { test, expect, Page } from '@playwright/test';

test.describe('Button Click - Direct Test', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        const context = await browser.newContext({
            extraHTTPHeaders: {
                'Authorization': 'Bearer test-token-' + Date.now(),
            },
        });
        page = await context.newPage();
    });

    test('1️⃣ Simple: Just click and see what happens', async () => {
        console.log('\n=== TEST 1: Simple Click ===\n');

        // Set token in localStorage
        await page.goto('http://localhost:3000/settings');

        // Inject token
        await page.evaluate(() => {
            localStorage.setItem('token', 'test-jwt-token-12345');
        });

        // Reload to pick up token
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Click LLM tab
        await page.click('[data-testid="tab-llm"]').catch(() => console.log('Tab not found'));
        await page.waitForTimeout(500);

        // Click button
        console.log('Attempting to click button...');

        try {
            await page.click('[data-testid="button-save-llm"]', { timeout: 5000 });
            console.log('✅ Button clicked successfully');
        } catch (e) {
            console.log(`❌ Button click failed: ${e}`);
        }

        // Wait and check for toast
        await page.waitForTimeout(2000);

        // Try to find any toast text
        const allText = await page.innerText('body');
        if (allText.includes('Clés') || allText.includes('Erreur') || allText.includes('Authentification')) {
            console.log('✅ Response text found on page');
        } else {
            console.log('❌ No response text found');
        }
    });

    test('2️⃣ Check: Is button clickable?', async () => {
        console.log('\n=== TEST 2: Button State Check ===\n');

        await page.goto('http://localhost:3000/settings');
        await page.evaluate(() => {
            localStorage.setItem('token', 'test-jwt-token-12345');
        });
        await page.reload();

        // Click tab
        await page.click('[data-testid="tab-llm"]').catch(() => { });
        await page.waitForTimeout(500);

        // Check button state
        const button = page.locator('[data-testid="button-save-llm"]');

        const isVisible = await button.isVisible().catch(() => false);
        console.log(`Visible: ${isVisible}`);

        const isEnabled = await button.isEnabled().catch(() => false);
        console.log(`Enabled: ${isEnabled}`);

        const isDisabled = await button.isDisabled().catch(() => false);
        console.log(`Disabled: ${isDisabled}`);

        if (isVisible && isEnabled) {
            console.log('✅ Button should be clickable');

            // Try clicking
            await button.click().catch(e => console.log(`Click error: ${e}`));
        } else {
            console.log('❌ Button is not clickable');
        }
    });

    test('3️⃣ Network: Monitor API calls', async () => {
        console.log('\n=== TEST 3: Network Monitoring ===\n');

        const requests: any[] = [];

        page.on('request', request => {
            if (request.url().includes('ai-billing')) {
                requests.push({
                    method: request.method(),
                    url: request.url(),
                });
                console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
            }
        });

        page.on('response', response => {
            if (response.url().includes('ai-billing')) {
                console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
            }
        });

        await page.goto('http://localhost:3000/settings');
        await page.evaluate(() => {
            localStorage.setItem('token', 'test-jwt-token-12345');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Click tab
        await page.click('[data-testid="tab-llm"]').catch(() => { });
        await page.waitForTimeout(500);

        // Click button
        console.log('\nClicking button now...\n');
        await page.click('[data-testid="button-save-llm"]').catch(() => { });

        // Wait for requests
        await page.waitForTimeout(3000);

        if (requests.length > 0) {
            console.log(`\n✅ ${requests.length} API request(s) detected`);
        } else {
            console.log('\n❌ No API requests detected after button click!');
        }
    });

    test('4️⃣ Console: Check for errors', async () => {
        console.log('\n=== TEST 4: Console Logging ===\n');

        const consoleLogs: any[] = [];

        page.on('console', msg => {
            consoleLogs.push({
                type: msg.type(),
                text: msg.text(),
            });
            console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
        });

        await page.goto('http://localhost:3000/settings');
        await page.evaluate(() => {
            localStorage.setItem('token', 'test-jwt-token-12345');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');

        await page.click('[data-testid="tab-llm"]').catch(() => { });
        await page.waitForTimeout(500);

        console.log('\nClicking button...\n');
        await page.click('[data-testid="button-save-llm"]').catch(() => { });

        await page.waitForTimeout(2000);

        const errors = consoleLogs.filter(l => l.type === 'error');
        if (errors.length > 0) {
            console.log(`\n❌ Found ${errors.length} console error(s):`);
            errors.forEach(e => console.log(`   - ${e.text}`));
        } else {
            console.log('\n✅ No console errors');
        }
    });
});
