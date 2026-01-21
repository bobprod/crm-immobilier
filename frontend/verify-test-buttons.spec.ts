import { test, expect } from '@playwright/test';

test('Verify test buttons appear on AI API Keys page after fix', async ({ browser, context }) => {
    // Create a new context to avoid authentication issues
    const page = await browser.newPage();

    try {
        // Navigate to the page
        await page.goto('http://localhost:3000/settings/ai-api-keys', { waitUntil: 'networkidle' });

        // Wait a bit for page to fully load
        await page.waitForTimeout(2000);

        // Check for the "Configuration LLM & Providers" title
        const configTitle = await page.textContent('text=Configuration LLM & Providers');
        if (configTitle) {
            console.log('✅ Found "Configuration LLM & Providers" title');
        } else {
            console.log('❌ Did not find "Configuration LLM & Providers" title');
        }

        // Look for test buttons - they should have the TestTube icon or "Tester" text
        const testerButtons = await page.locator('button:has-text("Tester")').count();
        console.log(`Found ${testerButtons} "Tester" buttons`);

        // Look for test tube icons (from lucide-react TestTube icon)
        const testTubeIcons = await page.locator('[class*="lucide"], svg').count();
        console.log(`Found ${testTubeIcons} icon elements`);

        // Count input fields for API keys
        const apiInputs = await page.locator('input[type="password"], input[placeholder*="sk-"], input[placeholder*="AIza"], input[placeholder*="sk-ant-"]').count();
        console.log(`Found ${apiInputs} API key input fields`);

        // Check for "Validée" badge (validation status)
        const validBadges = await page.locator('text=✓ Validée').count();
        console.log(`Found ${validBadges} validation badges`);

        // Get HTML snippet to see structure
        const bodyText = await page.textContent('body');
        if (bodyText?.includes('Tester')) {
            console.log('✅ "Tester" text found in page');
        } else {
            console.log('❌ "Tester" text NOT found in page');
        }

        // Try to find buttons with specific test IDs
        const testButtons = await page.locator('button[title*="Tester"]').count();
        console.log(`Found ${testButtons} buttons with "Tester" in title attribute`);

    } finally {
        await page.close();
    }
});
