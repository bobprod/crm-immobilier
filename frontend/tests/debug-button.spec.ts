import { test, expect } from '@playwright/test';

test.describe('Debug Test Button Rendering', () => {
    test('Check if TestTube icon and button logic is in the page', async ({ page, context }) => {
        console.log('\n========== DEBUGGING TEST BUTTON ==========\n');

        // Navigate to login
        await page.goto('http://localhost:3000/settings/ai-api-keys', { waitUntil: 'networkidle' });

        // Login
        const emailInput = await page.locator('input[type="email"]').first();
        const isLoginPage = await emailInput.isVisible().catch(() => false);

        if (isLoginPage) {
            await emailInput.fill('test@example.com');
            await page.locator('input[type="password"]').first().fill('password123');
            await page.locator('button:has-text("Se connecter")').first().click();
            await page.waitForNavigation().catch(() => { });
            await page.waitForTimeout(1500);
        }

        // Now on API keys page
        await page.goto('http://localhost:3000/settings/ai-api-keys', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check browser console for errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`🔴 CONSOLE ERROR: ${msg.text()}`);
            }
        });

        // Check page errors
        page.on('pageerror', err => {
            console.log(`🔴 PAGE ERROR: ${err.message}`);
        });

        // Look for the exact button element in DOM
        console.log('\n[SEARCHING FOR TEST BUTTONS IN PAGE]');

        // Method 1: Direct search for "Tester" text
        const testButtons = await page.locator('text=Tester').all();
        console.log(`[Method 1] Buttons with "Tester" text: ${testButtons.length}`);

        // Method 2: Search for TestTube icon
        const testTubeButtons = await page.locator('button:has-text("Tester")').all();
        console.log(`[Method 2] Buttons with "Tester" selector: ${testTubeButtons.length}`);

        // Method 3: Search in HTML
        const htmlContent = await page.content();
        const hasTestButton = htmlContent.includes('Tester');
        const hasCyanClass = htmlContent.includes('TestTube');
        const hasHandleTest = htmlContent.includes('handleTestApiKey');
        const hasLLMKey = htmlContent.includes('isLLMKey');
        const hasButtonComponent = htmlContent.includes('<Button') || htmlContent.includes('<button');

        console.log(`\n[HTML CONTENT CHECK]`);
        console.log(`  - Contains "Tester": ${hasTestButton}`);
        console.log(`  - Contains "TestTube": ${hasCyanClass}`);
        console.log(`  - Contains "handleTestApiKey": ${hasHandleTest}`);
        console.log(`  - Contains "isLLMKey": ${hasLLMKey}`);
        console.log(`  - Contains button tags: ${hasButtonComponent}`);

        // Method 4: Check for the button by role
        const buttonsByRole = await page.locator('button[type="button"]').all();
        console.log(`\n[BUTTON COUNT BY ROLE]`);
        console.log(`  - Total buttons with type="button": ${buttonsByRole.length}`);

        // Filter for buttons that might be test buttons
        console.log(`\n[ANALYZING ALL BUTTONS]`);
        let buttonNum = 1;
        for (const btn of buttonsByRole) {
            const text = await btn.textContent().catch(() => '');
            const title = await btn.getAttribute('title').catch(() => '');
            const className = await btn.getAttribute('class').catch(() => '');
            const visible = await btn.isVisible().catch(() => false);

            if (visible && (text.includes('Test') || title.includes('Test') || text.includes('test'))) {
                console.log(`\n  [BUTTON ${buttonNum}] FOUND TEST-RELATED BUTTON`);
                console.log(`    - Text: "${text.trim()}"`);
                console.log(`    - Title: "${title}"`);
                console.log(`    - Visible: ${visible}`);
                buttonNum++;
            }
        }

        // Method 5: Get the first API key input and see its structure
        console.log(`\n[ANALYZING INPUT STRUCTURE]`);
        const firstApiInput = await page.locator('input[placeholder*="sk-"]').first();
        const isVisible = await firstApiInput.isVisible().catch(() => false);

        if (isVisible) {
            console.log(`[First OpenAI input found and visible]`);

            // Get parent container
            const parentLocator = firstApiInput.locator('..');
            const parentHTML = await parentLocator.evaluate(el => el.outerHTML).catch(() => 'error');

            console.log(`[Parent HTML preview]`);
            console.log(parentHTML?.substring(0, 300) + '...');
        }

        // Method 6: Check if we can find the renderKeyInput function components
        const sections = await page.locator('div[class*="space-y-2"][class*="p-4"][class*="bg-gray-50"]').all();
        console.log(`\n[KEY INPUT SECTIONS]`);
        console.log(`  - Found key input divs: ${sections.length}`);

        // For each section, check if it has a button
        for (let i = 0; i < sections.length && i < 3; i++) {
            const section = sections[i];
            const btnInSection = await section.locator('button').count();
            const inputInSection = await section.locator('input').count();
            const text = await section.locator('label').first().textContent().catch(() => '?');

            console.log(`\n  [SECTION ${i + 1}] "${text}"`);
            console.log(`    - Buttons: ${btnInSection}`);
            console.log(`    - Inputs: ${inputInSection}`);
        }

        console.log('\n========== DEBUGGING END ==========\n');

        expect(true).toBe(true);
    });
});
