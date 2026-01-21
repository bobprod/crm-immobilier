import { test } from '@playwright/test';
import * as fs from 'fs';

test('Verify test button and analyze HTML', async ({ page }) => {
    console.log('\n========== BUTTON VERIFICATION ==========\n');

    // Navigate to page
    await page.goto('http://localhost:3000/settings/ai-api-keys', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
    });

    // Check if login page
    try {
        const emailInput = page.locator('input[type="email"]').first();
        if (await emailInput.isVisible()) {
            console.log('[Detected login page - attempting to log in]');
            await emailInput.fill('test@example.com');
            await page.locator('input[type="password"]').first().fill('password123');
            await page.locator('button:has-text("Se connecter")').click();
            await page.waitForTimeout(2000);

            // Re-navigate
            await page.goto('http://localhost:3000/settings/ai-api-keys', {
                waitUntil: 'domcontentloaded',
            });
        }
    } catch (e) {
        console.log('[Not on login page]');
    }

    await page.waitForTimeout(1500);

    // Get HTML
    const html = await page.content();

    // Save for inspection
    fs.writeFileSync('page-output.html', html);
    console.log('✅ Full HTML saved to: page-output.html');

    // Check for key indicators
    const hasTester = html.includes('Tester');
    const hasTestTube = html.includes('TestTube');
    const hasHandleTest = html.includes('handleTestApiKey');
    const hasIsLLMKey = html.includes('isLLMKey');

    console.log(`\n[KEY CODE INDICATORS]`);
    console.log(`  - "Tester" in HTML: ${hasTester ? '✅' : '❌'}`);
    console.log(`  - "TestTube" in HTML: ${hasTestTube ? '✅' : '❌'}`);
    console.log(`  - "handleTestApiKey" in HTML: ${hasHandleTest ? '✅' : '❌'}`);
    console.log(`  - "isLLMKey" in HTML: ${hasIsLLMKey ? '✅' : '❌'}`);

    // Count elements
    const inputCount = (html.match(/<input/g) || []).length;
    const buttonCount = (html.match(/<button/g) || []).length;
    const apiKeyInputCount = (html.match(/password/g) || []).length;

    console.log(`\n[PAGE STRUCTURE]`);
    console.log(`  - Total <input> tags: ${inputCount}`);
    console.log(`  - Total <button> tags: ${buttonCount}`);
    console.log(`  - "password" type inputs (API keys): ${apiKeyInputCount}`);

    // Check if rendered properly
    const hasOpenAI = html.includes('OpenAI');
    const hasGemini = html.includes('Gemini');
    const hasDeepSeek = html.includes('DeepSeek');

    console.log(`\n[PROVIDER LABELS]`);
    console.log(`  - OpenAI label: ${hasOpenAI ? '✅' : '❌'}`);
    console.log(`  - Gemini label: ${hasGemini ? '✅' : '❌'}`);
    console.log(`  - DeepSeek label: ${hasDeepSeek ? '✅' : '❌'}`);

    // Look for evidence of renderKeyInput being called
    const hasRenderCall = html.includes('renderKeyInput');
    const hasOpenAIInput = html.includes('openaiApiKey') || html.includes('OpenAI');

    console.log(`\n[RENDER STATE]`);
    console.log(`  - renderKeyInput function called: ${hasRenderCall ? '✅' : '❌'}`);
    console.log(`  - API inputs rendered: ${hasOpenAIInput ? '✅' : '❌'}`);

    console.log(`\n========== VERIFICATION END ==========\n`);

    // Check actual button visibility
    const testButtons = await page.locator('button:has-text("Tester")').count();
    console.log(`[ACTUAL BUTTONS FOUND: ${testButtons}]`);

    // Return status
    const success = hasTester || testButtons > 0;
    console.log(`\n[OVERALL STATUS]: ${success ? '✅ Test button code IS in page' : '❌ Test button code NOT in page'}`);
});
