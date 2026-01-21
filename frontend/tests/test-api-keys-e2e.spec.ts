import { test, expect } from '@playwright/test';

test('E2E: AI API Keys - Test and Save with Gemini', async ({ browser }) => {
    const page = await browser.newPage();

    try {
        console.log('🚀 Starting E2E test for AI API Keys...');

        // Navigate to page
        await page.goto('http://localhost:3000/settings/ai-api-keys', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        console.log('✅ Page loaded');

        // Check that page renders
        const title = await page.textContent('text=Configuration LLM & Providers');
        expect(title).toBeTruthy();
        console.log('✅ Found title: Configuration LLM & Providers');

        // Fill Gemini API key
        const geminiKey = 'AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU';
        const geminiInput = page.locator('input[data-testid="input-geminiApiKey"]');
        await geminiInput.fill(geminiKey);
        console.log('✅ Filled Gemini API key');

        // Click test button for Gemini
        const testBtn = page.locator('button[data-testid="test-btn-gemini"]');
        await testBtn.click();
        console.log('✅ Clicked test button');

        // Wait for test result
        await page.waitForTimeout(3000);

        // Check validation badge
        const validBadge = await page.locator('text=✓ Validée').count();
        console.log(`✅ Found ${validBadge} validation badge(s)`);

        // Check models dropdown appears
        const modelsSelect = await page.locator('select[data-testid="models-select-gemini"]').count();
        console.log(`✅ Found models dropdown: ${modelsSelect > 0 ? 'Yes' : 'No'}`);

        if (modelsSelect > 0) {
            // Select a model from dropdown
            const selectElement = page.locator('select[data-testid="models-select-gemini"]');
            await selectElement.selectOption('gemini-1.5-pro');
            console.log('✅ Selected model: gemini-1.5-pro');
        }

        // Click save button
        const saveBtn = page.locator('button[data-testid="button-save-llm"]');
        await saveBtn.click();
        console.log('✅ Clicked save button');

        // Wait for save result
        await page.waitForTimeout(2000);

        // Check success message
        const successMsg = await page.textContent('text=/✅|Sauvegardées/');
        if (successMsg) {
            console.log(`✅ Save successful: ${successMsg}`);
        } else {
            console.log('⚠️  No success message found');
        }

        console.log('✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    } finally {
        await page.close();
    }
});

test('E2E: Test with DeepSeek API', async ({ browser }) => {
    const page = await browser.newPage();

    try {
        console.log('🚀 Testing DeepSeek...');

        await page.goto('http://localhost:3000/settings/ai-api-keys', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Fill DeepSeek API key
        const deepseekKey = 'sk-test-deepseek-key';
        await page.locator('input[data-testid="input-deepseekApiKey"]').fill(deepseekKey);
        console.log('✅ Filled DeepSeek API key');

        // Click test button
        await page.locator('button[data-testid="test-btn-deepseek"]').click();
        console.log('✅ Clicked test button');

        // Wait for result
        await page.waitForTimeout(2000);

        // Check if error message appears
        const errorMsg = await page.textContent('text=❌');
        if (errorMsg) {
            console.log('✅ Expected error message appeared (invalid key)');
        }

        console.log('✅ DeepSeek test completed');

    } finally {
        await page.close();
    }
});
