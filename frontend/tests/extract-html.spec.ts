import { test } from '@playwright/test';
import * as fs from 'fs';

test('Extract page HTML for analysis', async ({ page }) => {
    console.log('\n========== HTML EXTRACTION ==========\n');

    // Navigate
    await page.goto('http://localhost:3000/settings/ai-api-keys', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
    }).catch(e => console.log('Navigation error:', e.message));

    // Login if needed
    const emailInput = await page.locator('input[type="email"]').first().catch(() => null);
    if (emailInput && await emailInput.isVisible().catch(() => false)) {
        console.log('[Logging in...]');
        await emailInput.fill('test@example.com');
        await page.locator('input[type="password"]').first().fill('password123');
        await page.locator('button:has-text("Se connecter")').click().catch(() => { });
        await page.waitForTimeout(2000);

        // Navigate again
        await page.goto('http://localhost:3000/settings/ai-api-keys', {
            waitUntil: 'domcontentloaded',
        }).catch(e => console.log('Re-navigation error:', e.message));
    }

    await page.waitForTimeout(2000);

    // Get full HTML
    const html = await page.content();

    // Extract key sections
    const renderKeyInputSection = html.substring(
        html.indexOf('renderKeyInput') !== -1 ? Math.max(0, html.indexOf('renderKeyInput') - 200) : 0,
        html.indexOf('renderKeyInput') !== -1 ? Math.min(html.length, html.indexOf('renderKeyInput') + 500) : 100
    );

    const openAiSectionStart = html.indexOf('OpenAI');
    const openAiSection = openAiSectionStart !== -1 ? html.substring(Math.max(0, openAiSectionStart - 200), Math.min(html.length, openAiSectionStart + 1000)) : 'NOT FOUND';

    const testerButtonStart = html.indexOf('Tester');
    const testerSection = testerButtonStart !== -1 ? html.substring(Math.max(0, testerButtonStart - 300), Math.min(html.length, testerButtonStart + 300)) : 'NOT FOUND';

    console.log('[renderKeyInput section]');
    console.log(renderKeyInputSection.substring(0, 300));

    console.log('\n[OpenAI section]');
    console.log(openAiSection.substring(0, 300));

    console.log('\n[Tester button section]');
    console.log(testerSection.substring(0, 300));

    // Save full HTML for inspection
    fs.writeFileSync('page-output.html', html);
    console.log('\n✅ Full HTML saved to: page-output.html');

    // Count key elements
    const formInputCount = (html.match(/<input/g) || []).length;
    const buttonCount = (html.match(/<button/g) || []).length;
    const testerCount = (html.match(/Tester/g) || []).length;

    console.log(`\n[COUNTS]`);
    console.log(`  - Input elements: ${formInputCount}`);
    console.log(`  - Button elements: ${buttonCount}`);
    console.log(`  - "Tester" occurrences: ${testerCount}`);

    console.log('\n========== EXTRACTION END ==========\n');
});
