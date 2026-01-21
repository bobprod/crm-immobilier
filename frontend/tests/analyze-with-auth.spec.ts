import { test, expect } from '@playwright/test';

test.describe('Analyze /settings/ai-api-keys After Login', () => {
    test('Login and analyze API keys page', async ({ page }) => {
        console.log('\n========== AUTHENTICATION & PAGE ANALYSIS ==========\n');

        // Step 1: Navigate to settings page (should redirect to login)
        let response = await page.goto('http://localhost:3000/settings/ai-api-keys', {
            waitUntil: 'networkidle',
        });
        console.log(`[1] Initial navigation status: ${response?.status()}`);

        // Check if we're on login page
        const emailInput = await page.locator('input[type="email"], input[placeholder*="mail"], input[placeholder*="Email"]').first();
        const isLoginPage = await emailInput.isVisible().catch(() => false);

        if (isLoginPage) {
            console.log('[2] Detected login page - attempting authentication');

            // Try to find credentials from environment or defaults
            const email = process.env.TEST_EMAIL || 'test@example.com';
            const password = process.env.TEST_PASSWORD || 'password123';

            // Fill email
            await emailInput.fill(email);
            console.log(`[3] Filled email: ${email}`);

            // Fill password
            const passwordInput = await page.locator('input[type="password"]').first();
            await passwordInput.fill(password);
            console.log('[4] Filled password');

            // Click login button
            const loginButton = await page.locator('button:has-text("Se connecter"), button:has-text("Login"), button:has-text("Sign in")').first();
            await loginButton.click();
            console.log('[5] Clicked login button');

            // Wait for navigation
            await page.waitForNavigation().catch(() => { });
            await page.waitForTimeout(2000);

            console.log('[6] After login navigation attempt');
        }

        // Step 2: Now navigate to the API keys page
        response = await page.goto('http://localhost:3000/settings/ai-api-keys', {
            waitUntil: 'networkidle',
        });
        console.log(`\n[API KEYS PAGE] Response status: ${response?.status()}`);

        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'api-keys-page-analysis.png', fullPage: true });
        console.log('📸 Screenshot saved: api-keys-page-analysis.png');

        // Analyze the page
        const pageTitle = await page.title();
        console.log(`[PAGE TITLE] ${pageTitle}`);

        // Find all inputs
        const allInputs = await page.locator('input').all();
        console.log(`\n[TOTAL INPUTS FOUND] ${allInputs.length}`);

        // Categorize inputs
        let apiKeyInputCount = 0;
        console.log('\n--- API KEY INPUTS DETAIL ---');
        for (let i = 0; i < allInputs.length; i++) {
            const input = allInputs[i];
            const placeholder = await input.getAttribute('placeholder');
            const type = await input.getAttribute('type');
            const visible = await input.isVisible();

            if (visible && (type === 'password' || type === 'text' || !type)) {
                // Likely an API key input
                apiKeyInputCount++;
                const value = await input.inputValue();
                const ariaLabel = await input.getAttribute('aria-label');
                const name = await input.getAttribute('name');

                console.log(`\n[API KEY INPUT ${apiKeyInputCount}]`);
                console.log(`  - Type: ${type || 'text'}`);
                console.log(`  - Placeholder: ${placeholder}`);
                console.log(`  - Name: ${name}`);
                console.log(`  - Aria-Label: ${ariaLabel}`);
                if (value) console.log(`  - Has value: yes (length: ${value.length})`);
            }
        }

        // Find all buttons
        const allButtons = await page.locator('button').all();
        console.log(`\n[TOTAL BUTTONS FOUND] ${allButtons.length}`);

        // Check for test buttons
        let testButtonCount = 0;
        console.log('\n--- BUTTON ANALYSIS ---');
        for (let i = 0; i < allButtons.length; i++) {
            const button = allButtons[i];
            const text = await button.textContent().catch(() => '');
            const visible = await button.isVisible().catch(() => false);
            const ariaLabel = await button.getAttribute('aria-label');

            if (visible && text?.trim()) {
                console.log(`[BUTTON ${i + 1}] "${text.trim()}"`);

                if (text.includes('Test') || text.includes('Tester') || text.includes('Valider')) {
                    testButtonCount++;
                }
            }
        }

        console.log(`\n[TEST BUTTONS COUNT] ${testButtonCount}`);

        // Check for SVG icons or specific patterns
        const eyeIcons = await page.locator('svg[data-testid*="eye"], button:has(svg), [class*="eye"]').all();
        console.log(`[EYE/TOGGLE ICONS] ${eyeIcons.length}`);

        // Get all text to understand structure
        const pageText = await page.textContent('body');
        console.log(`\n[PAGE TEXT LENGTH] ${pageText?.length || 0} characters`);

        // Check for provider names
        const providers = ['OpenAI', 'Gemini', 'DeepSeek', 'Anthropic', 'OpenRouter', 'Mistral', 'Grok', 'Cohere'];
        console.log('\n--- PROVIDER SECTIONS ---');
        for (const provider of providers) {
            const found = pageText?.includes(provider) || false;
            console.log(`  - ${provider}: ${found ? '✅' : '❌'}`);
        }

        // Check HTML for missing elements
        const htmlContent = await page.content();
        const hasButton = htmlContent.includes('Button') || htmlContent.includes('<button');
        const hasTestTubeIcon = htmlContent.includes('TestTube') || htmlContent.includes('test-tube');
        const hasHandleTest = htmlContent.includes('handleTestApiKey') || htmlContent.includes('handleTest');

        console.log('\n--- CODE PATTERNS ---');
        console.log(`  - Has buttons: ${hasButton ? '✅' : '❌'}`);
        console.log(`  - Has test tube icon: ${hasTestTubeIcon ? '✅' : '❌'}`);
        console.log(`  - Has test handler: ${hasHandleTest ? '✅' : '❌'}`);

        // Summary
        console.log(`\n========== SUMMARY ==========`);
        console.log(`API Key Inputs Found: ${apiKeyInputCount}`);
        console.log(`Test Buttons Found: ${testButtonCount}`);
        console.log(`Need to add test buttons: ${apiKeyInputCount > testButtonCount ? 'YES ⚠️' : 'NO ✅'}`);

        console.log('\n========== PAGE ANALYSIS END ==========\n');

        // Don't fail on errors for analysis
        expect(response?.status()).toBeLessThan(500);
    });
});
