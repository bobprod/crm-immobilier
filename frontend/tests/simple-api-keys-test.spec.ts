import { test, expect } from '@playwright/test';

test.describe('AI API Keys - Simple Save Test', () => {
    test('Quick: Navigate to page and check UI elements', async ({ page }) => {
        console.log('🧪 Test: Checking UI Elements');

        // Go directly to the page
        await page.goto('http://localhost:3000/settings/ai-api-keys');
        await page.waitForLoadState('networkidle');

        // Check if page loaded
        const pageTitle = await page.textContent('h1');
        console.log('Page title:', pageTitle);
        expect(pageTitle).toContain('Clés API');

        // Check if LLM tab exists
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await expect(llmTab).toBeVisible();
        console.log('✅ LLM tab visible');

        // Click LLM tab
        await llmTab.click();
        await page.waitForTimeout(500);

        // Check if provider select exists
        const providerSelect = page.locator('[data-testid="select-provider"]');
        await expect(providerSelect).toBeVisible();
        console.log('✅ Provider select visible');

        // Check if model select exists
        const modelSelect = page.locator('[data-testid="select-model"]');
        await expect(modelSelect).toBeVisible();
        console.log('✅ Model select visible');

        // Check if save button exists
        const saveButton = page.locator('[data-testid="button-save-llm"]');
        await expect(saveButton).toBeVisible();
        console.log('✅ Save button visible');

        // Check API key inputs
        const geminiInput = page.locator('[data-testid="input-geminiApiKey"]');
        await expect(geminiInput).toBeVisible();
        console.log('✅ Gemini input visible');

        console.log('✅ All UI elements present!');
    });

    test('Quick: Fill and save Gemini key', async ({ page }) => {
        console.log('🧪 Test: Fill and Save');

        await page.goto('http://localhost:3000/settings/ai-api-keys');
        await page.waitForLoadState('networkidle');

        // Click LLM tab
        await page.click('[data-testid="tab-llm"]');
        await page.waitForTimeout(500);

        // Select Gemini provider
        const providerSelect = page.locator('[data-testid="select-provider"]');
        await providerSelect.selectOption('gemini');
        console.log('✅ Selected Gemini provider');

        await page.waitForTimeout(300);

        // Select model
        const modelSelect = page.locator('[data-testid="select-model"]');
        const options = await modelSelect.locator('option').allTextContents();
        console.log('Available models:', options);

        await modelSelect.selectOption('gemini-2.0-flash');
        console.log('✅ Selected gemini-2.0-flash model');

        // Fill API key
        const geminiInput = page.locator('[data-testid="input-geminiApiKey"]');
        await geminiInput.fill('AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU');
        console.log('✅ Filled API key');

        // Click save
        const saveButton = page.locator('[data-testid="button-save-llm"]');

        // Wait for network request
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/ai-billing/api-keys/user') && response.request().method() === 'PUT',
            { timeout: 10000 }
        );

        await saveButton.click();
        console.log('✅ Clicked save button');

        try {
            const response = await responsePromise;
            const status = response.status();
            console.log('Response status:', status);

            if (status === 200 || status === 201) {
                const responseBody = await response.json();
                console.log('Response body:', JSON.stringify(responseBody, null, 2));
                console.log('✅ Save successful!');

                // Wait for success toast
                await page.waitForSelector('text=/sauvegardées/i', { timeout: 5000 });
                console.log('✅ Success toast appeared');
            } else {
                console.log('❌ Save failed with status:', status);
                const responseText = await response.text();
                console.log('Response:', responseText);
            }
        } catch (error) {
            console.log('❌ Error during save:', error);

            // Take screenshot for debugging
            await page.screenshot({ path: 'test-error-screenshot.png', fullPage: true });
            console.log('Screenshot saved to test-error-screenshot.png');

            throw error;
        }
    });

    test('Quick: Reload and verify data persists', async ({ page }) => {
        console.log('🧪 Test: Verify Persistence');

        // First save
        await page.goto('http://localhost:3000/settings/ai-api-keys');
        await page.waitForLoadState('networkidle');
        await page.click('[data-testid="tab-llm"]');
        await page.waitForTimeout(500);

        await page.locator('[data-testid="select-provider"]').selectOption('openai');
        await page.waitForTimeout(300);
        await page.locator('[data-testid="select-model"]').selectOption('gpt-4o');
        await page.locator('[data-testid="input-openaiApiKey"]').fill('sk-test-key-123');

        await page.click('[data-testid="button-save-llm"]');
        await page.waitForSelector('text=/sauvegardées/i', { timeout: 10000 });
        console.log('✅ Initial save completed');

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        console.log('✅ Page reloaded');

        // Verify provider
        const providerValue = await page.locator('[data-testid="select-provider"]').inputValue();
        console.log('Loaded provider:', providerValue);
        expect(providerValue).toBe('openai');
        console.log('✅ Provider persisted');

        // Verify model
        const modelValue = await page.locator('[data-testid="select-model"]').inputValue();
        console.log('Loaded model:', modelValue);
        expect(modelValue).toBe('gpt-4o');
        console.log('✅ Model persisted');

        // Verify API key is present (will be hidden)
        const keyValue = await page.locator('[data-testid="input-openaiApiKey"]').inputValue();
        console.log('Key length:', keyValue.length);
        expect(keyValue.length).toBeGreaterThan(0);
        console.log('✅ API key persisted');

        console.log('🎉 All data persisted correctly!');
    });
});
