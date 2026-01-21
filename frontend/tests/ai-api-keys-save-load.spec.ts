import { test, expect } from '@playwright/test';

test.describe('AI API Keys - Save and Load Integration', () => {
    test.beforeEach(async ({ page }) => {
        // Login first (adjust URL and credentials as needed)
        await page.goto('http://localhost:3000/auth/login');

        // Wait for login page to load
        await page.waitForLoadState('networkidle');

        // Fill login form (adjust selectors based on your login page)
        const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
        const passwordInput = page.locator('input[type="password"], input[name="password"]').first();

        if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await emailInput.fill('test@example.com');
            await passwordInput.fill('password123');

            // Click login button
            const loginButton = page.locator('button[type="submit"], button:has-text("Connexion"), button:has-text("Login")').first();
            await loginButton.click();

            // Wait for redirect
            await page.waitForLoadState('networkidle');
        }

        // Navigate to API keys page
        await page.goto('http://localhost:3000/settings/ai-api-keys');
        await page.waitForLoadState('networkidle');
    });

    test('E2E: Save and Load Gemini API Key with Model', async ({ page }) => {
        console.log('🧪 Test 1: Save and Load Gemini API Key');

        // Step 1: Ensure we're on LLM tab
        await page.click('[data-testid="tab-llm"]');
        await page.waitForTimeout(500);

        // Step 2: Select provider
        const providerSelect = page.locator('[data-testid="select-provider"]');
        await providerSelect.selectOption('gemini');
        console.log('✅ Provider selected: Gemini');

        // Step 3: Wait for models to load
        await page.waitForTimeout(500);

        // Step 4: Select model
        const modelSelect = page.locator('[data-testid="select-model"]');
        await modelSelect.selectOption('gemini-2.0-flash');
        console.log('✅ Model selected: gemini-2.0-flash');

        // Step 5: Fill Gemini API key
        const geminiInput = page.locator('[data-testid="input-geminiApiKey"]');
        await geminiInput.fill('AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU');
        console.log('✅ API Key filled');

        // Step 6: Verify selection display
        const selectionDisplay = page.locator('[data-testid="selection-display"]');
        await expect(selectionDisplay).toContainText('GEMINI');
        await expect(selectionDisplay).toContainText('gemini-2.0-flash');
        console.log('✅ Selection display verified');

        // Step 7: Click save button
        const saveButton = page.locator('[data-testid="button-save-llm"]');
        await saveButton.click();
        console.log('✅ Save button clicked');

        // Step 8: Wait for success toast
        await page.waitForSelector('text=/Clés LLM sauvegardées/i', { timeout: 10000 });
        console.log('✅ Success toast appeared');

        // Step 9: Reload page to verify data persists
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        console.log('✅ Page reloaded');

        // Step 10: Verify provider is still selected
        const reloadedProvider = page.locator('[data-testid="select-provider"]');
        const providerValue = await reloadedProvider.inputValue();
        expect(providerValue).toBe('gemini');
        console.log('✅ Provider persisted: gemini');

        // Step 11: Verify model is still selected
        const reloadedModel = page.locator('[data-testid="select-model"]');
        const modelValue = await reloadedModel.inputValue();
        expect(modelValue).toBe('gemini-2.0-flash');
        console.log('✅ Model persisted: gemini-2.0-flash');

        // Step 12: Verify API key is still there (will be hidden)
        const reloadedGeminiInput = page.locator('[data-testid="input-geminiApiKey"]');
        const keyValue = await reloadedGeminiInput.inputValue();
        expect(keyValue).toBeTruthy();
        expect(keyValue.length).toBeGreaterThan(0);
        console.log('✅ API Key persisted');
    });

    test('E2E: Save OpenAI API Key with GPT-4o', async ({ page }) => {
        console.log('🧪 Test 2: Save OpenAI API Key');

        // Step 1: Select OpenAI provider
        await page.click('[data-testid="tab-llm"]');
        const providerSelect = page.locator('[data-testid="select-provider"]');
        await providerSelect.selectOption('openai');
        await page.waitForTimeout(500);

        // Step 2: Select GPT-4o model
        const modelSelect = page.locator('[data-testid="select-model"]');
        await modelSelect.selectOption('gpt-4o');
        console.log('✅ Selected: OpenAI - gpt-4o');

        // Step 3: Fill OpenAI API key
        const openaiInput = page.locator('[data-testid="input-openaiApiKey"]');
        await openaiInput.fill('sk-test-openai-key-12345');

        // Step 4: Save
        const saveButton = page.locator('[data-testid="button-save-llm"]');
        await saveButton.click();

        // Step 5: Wait for success
        await page.waitForSelector('text=/Clés LLM sauvegardées/i', { timeout: 10000 });
        console.log('✅ OpenAI key saved successfully');
    });

    test('E2E: Save Scraping API Keys', async ({ page }) => {
        console.log('🧪 Test 3: Save Scraping API Keys');

        // Step 1: Switch to scraping tab
        await page.click('[data-testid="tab-scraping"]');
        await page.waitForTimeout(500);

        // Step 2: Fill SERP API key
        const serpInput = page.locator('[data-testid="input-serpApiKey"]');
        await serpInput.fill('serp-test-key-123');

        // Step 3: Fill Firecrawl API key
        const firecrawlInput = page.locator('[data-testid="input-firecrawlApiKey"]');
        await firecrawlInput.fill('fc_test_key_456');

        console.log('✅ Scraping keys filled');

        // Step 4: Save
        const saveButton = page.locator('[data-testid="button-save-scraping"]');
        await saveButton.click();

        // Step 5: Wait for success
        await page.waitForSelector('text=/Clés Scraping sauvegardées/i', { timeout: 10000 });
        console.log('✅ Scraping keys saved successfully');

        // Step 6: Reload and verify
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.click('[data-testid="tab-scraping"]');
        await page.waitForTimeout(500);

        // Step 7: Verify keys persisted
        const reloadedSerpInput = page.locator('[data-testid="input-serpApiKey"]');
        const serpValue = await reloadedSerpInput.inputValue();
        expect(serpValue).toBeTruthy();
        console.log('✅ Scraping keys persisted');
    });

    test('E2E: Change Provider and Model', async ({ page }) => {
        console.log('🧪 Test 4: Change Provider and Model');

        // Step 1: Save initial config (OpenAI)
        await page.click('[data-testid="tab-llm"]');
        const providerSelect = page.locator('[data-testid="select-provider"]');
        await providerSelect.selectOption('openai');
        await page.waitForTimeout(300);

        const modelSelect = page.locator('[data-testid="select-model"]');
        await modelSelect.selectOption('gpt-4o');

        const openaiInput = page.locator('[data-testid="input-openaiApiKey"]');
        await openaiInput.fill('sk-openai-test-1');

        await page.click('[data-testid="button-save-llm"]');
        await page.waitForSelector('text=/Clés LLM sauvegardées/i', { timeout: 10000 });
        console.log('✅ Saved OpenAI config');

        // Step 2: Change to DeepSeek
        await page.waitForTimeout(1000);
        await providerSelect.selectOption('deepseek');
        await page.waitForTimeout(500);

        await modelSelect.selectOption('deepseek-chat');

        const deepseekInput = page.locator('[data-testid="input-deepseekApiKey"]');
        await deepseekInput.fill('sk-deepseek-test-1');

        await page.click('[data-testid="button-save-llm"]');
        await page.waitForSelector('text=/Clés LLM sauvegardées/i', { timeout: 10000 });
        console.log('✅ Saved DeepSeek config');

        // Step 3: Reload and verify DeepSeek is selected
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const reloadedProvider = await page.locator('[data-testid="select-provider"]').inputValue();
        expect(reloadedProvider).toBe('deepseek');

        const reloadedModel = await page.locator('[data-testid="select-model"]').inputValue();
        expect(reloadedModel).toBe('deepseek-chat');

        console.log('✅ Provider change persisted correctly');
    });

    test('E2E: Multiple API Keys at Once', async ({ page }) => {
        console.log('🧪 Test 5: Save Multiple API Keys');

        await page.click('[data-testid="tab-llm"]');

        // Fill multiple API keys
        await page.locator('[data-testid="input-openaiApiKey"]').fill('sk-openai-multi-1');
        await page.locator('[data-testid="input-geminiApiKey"]').fill('AIza-gemini-multi-2');
        await page.locator('[data-testid="input-deepseekApiKey"]').fill('sk-deepseek-multi-3');

        // Select provider
        await page.locator('[data-testid="select-provider"]').selectOption('openai');
        await page.waitForTimeout(300);
        await page.locator('[data-testid="select-model"]').selectOption('gpt-4o');

        // Save
        await page.click('[data-testid="button-save-llm"]');
        await page.waitForSelector('text=/Clés LLM sauvegardées/i', { timeout: 10000 });

        console.log('✅ Multiple keys saved');

        // Reload and verify all keys are present
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const openaiValue = await page.locator('[data-testid="input-openaiApiKey"]').inputValue();
        const geminiValue = await page.locator('[data-testid="input-geminiApiKey"]').inputValue();
        const deepseekValue = await page.locator('[data-testid="input-deepseekApiKey"]').inputValue();

        expect(openaiValue).toBeTruthy();
        expect(geminiValue).toBeTruthy();
        expect(deepseekValue).toBeTruthy();

        console.log('✅ All keys persisted correctly');
    });
});
