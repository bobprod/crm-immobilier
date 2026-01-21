import { test, expect } from '@playwright/test';

test.describe('Analyze /settings/ai-api-keys Page Structure', () => {
    test('Detailed page analysis and structure inspection', async ({ page }) => {
        console.log('\n========== PAGE ANALYSIS START ==========\n');

        // Navigate to the page
        const response = await page.goto('http://localhost:3000/settings/ai-api-keys', {
            waitUntil: 'networkidle',
        });

        console.log(`[STATUS] Page response: ${response?.status()}`);
        if (response?.status() === 200) {
            console.log('✅ Page loaded successfully');
        } else {
            console.log(`❌ Page returned status ${response?.status()}`);
        }

        // Wait a moment for page to fully render
        await page.waitForTimeout(2000);

        // Take screenshot
        await page.screenshot({ path: 'page-analysis-screenshot.png', fullPage: true });
        console.log('📸 Screenshot saved: page-analysis-screenshot.png');

        // Get page title
        const title = await page.title();
        console.log(`\n[PAGE TITLE] ${title}`);

        // Get all text content
        const bodyText = await page.textContent('body');
        const pageLength = bodyText?.length || 0;
        console.log(`[CONTENT LENGTH] ${pageLength} characters`);

        // Check for auth errors
        const errorMessages = await page.locator('[class*="error"]').allTextContents();
        if (errorMessages.length > 0) {
            console.log(`[ERRORS FOUND] ${errorMessages.join(', ')}`);
        }

        // Find all inputs
        const allInputs = await page.locator('input').all();
        console.log(`\n[TOTAL INPUTS FOUND] ${allInputs.length}`);

        console.log('\n--- API KEY INPUTS ANALYSIS ---');
        for (let i = 0; i < allInputs.length; i++) {
            const input = allInputs[i];
            const placeholder = await input.getAttribute('placeholder');
            const value = await input.inputValue();
            const type = await input.getAttribute('type');
            const visible = await input.isVisible();
            const className = await input.getAttribute('class');
            console.log(`\n[INPUT ${i + 1}]`);
            console.log(`  - Visible: ${visible}`);
            console.log(`  - Type: ${type}`);
            console.log(`  - Placeholder: ${placeholder}`);
            console.log(`  - Class: ${className}`);
            if (value) console.log(`  - Value: ${value.substring(0, 50)}...`);
        }

        // Find all buttons
        const allButtons = await page.locator('button').all();
        console.log(`\n[TOTAL BUTTONS FOUND] ${allButtons.length}`);

        console.log('\n--- BUTTONS ANALYSIS ---');
        const buttonTexts = new Set<string>();
        for (let i = 0; i < allButtons.length; i++) {
            const button = allButtons[i];
            const text = await button.textContent();
            const visible = await button.isVisible();
            const disabled = await button.getAttribute('disabled');
            if (text?.trim()) {
                buttonTexts.add(text.trim());
                console.log(`[BUTTON ${i + 1}] "${text.trim()}" - Visible: ${visible}, Disabled: ${disabled || 'false'}`);
            }
        }

        // Search for test/validate buttons specifically
        const testButtons = await page.locator('button:has-text("Tester"), button:has-text("Test"), button:has-text("Valider")').all();
        console.log(`\n[TEST BUTTONS SPECIFICALLY] Found: ${testButtons.length}`);
        for (let i = 0; i < testButtons.length; i++) {
            const btn = testButtons[i];
            const text = await btn.textContent();
            console.log(`  - Button ${i + 1}: "${text?.trim()}"`);
        }

        // Check for SVG icons (Test tube icon, etc)
        const svgIcons = await page.locator('svg').all();
        console.log(`\n[SVG ICONS FOUND] ${svgIcons.length}`);

        // Find all labels (for API key names)
        const labels = await page.locator('label').all();
        console.log(`\n[LABELS FOUND] ${labels.length}`);
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            const text = await label.textContent();
            if (text?.trim()) console.log(`  - Label ${i + 1}: "${text.trim()}"`);
        }

        // Check main content sections
        const cards = await page.locator('[class*="card"], section, article').all();
        console.log(`\n[MAIN SECTIONS/CARDS] ${cards.length}`);

        // HTML structure
        const htmlContent = await page.content();
        const hasRenderKeyInput = htmlContent.includes('renderKeyInput');
        const hasTestButton = htmlContent.includes('Tester');
        const hasButtonComponent = htmlContent.includes('Button') || htmlContent.includes('button');

        console.log(`\n[CODE PATTERNS IN HTML]`);
        console.log(`  - Contains "renderKeyInput": ${hasRenderKeyInput}`);
        console.log(`  - Contains "Tester": ${hasTestButton}`);
        console.log(`  - Contains button elements: ${hasButtonComponent}`);

        // Check accessibility tree
        const accessibleName = await page.locator('main, [role="main"]').first().textContent();
        console.log(`\n[MAIN CONTENT PREVIEW] ${accessibleName?.substring(0, 200)}...`);

        // Look for specific API key sections
        const apiKeyProviders = ['OpenAI', 'Gemini', 'DeepSeek', 'Anthropic', 'OpenRouter', 'Mistral', 'Grok'];
        console.log(`\n[SEARCHING FOR PROVIDERS] Looking for: ${apiKeyProviders.join(', ')}`);
        for (const provider of apiKeyProviders) {
            const found = await page.locator(`text=${provider}`).isVisible().catch(() => false);
            console.log(`  - ${provider}: ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
        }

        console.log('\n========== PAGE ANALYSIS END ==========\n');

        // Assert page loaded
        expect(response?.status()).toBeLessThan(500);
    });
});
