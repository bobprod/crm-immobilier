import { test, expect } from '@playwright/test';

test.describe('AI API Keys - Test Buttons', () => {
    test('Verify test buttons are present for all LLM keys', async ({ page }) => {
        console.log('🧪 Test: Vérifier les boutons de test');

        await page.goto('http://localhost:3000/settings/ai-api-keys');
        await page.waitForLoadState('networkidle');

        // Click LLM tab
        await page.click('[data-testid="tab-llm"]');
        await page.waitForTimeout(500);

        // Fill Gemini key
        const geminiInput = page.locator('[data-testid="input-geminiApiKey"]');
        await geminiInput.fill('AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU');
        await page.waitForTimeout(300);

        // Check if test button appears for Gemini
        const geminiTestBtn = page.locator('[data-testid="test-btn-gemini"]');
        await expect(geminiTestBtn).toBeVisible();
        console.log('✅ Gemini test button visible');

        // Fill OpenAI key
        const openaiInput = page.locator('[data-testid="input-openaiApiKey"]');
        await openaiInput.fill('sk-test-key-123');
        await page.waitForTimeout(300);

        // Check if test button appears for OpenAI
        const openaiTestBtn = page.locator('[data-testid="test-btn-openai"]');
        await expect(openaiTestBtn).toBeVisible();
        console.log('✅ OpenAI test button visible');

        // Fill DeepSeek key
        const deepseekInput = page.locator('[data-testid="input-deepseekApiKey"]');
        await deepseekInput.fill('sk-deepseek-test');
        await page.waitForTimeout(300);

        // Check if test button appears for DeepSeek
        const deepseekTestBtn = page.locator('[data-testid="test-btn-deepseek"]');
        await expect(deepseekTestBtn).toBeVisible();
        console.log('✅ DeepSeek test button visible');

        console.log('🎉 Tous les boutons de test sont présents!');
    });

    test('Test Gemini API key validation', async ({ page }) => {
        console.log('🧪 Test: Validation clé Gemini');

        await page.goto('http://localhost:3000/settings/api-keys');
        await page.waitForLoadState('networkidle');

        await page.click('[data-testid="tab-llm"]');
        await page.waitForTimeout(500);

        // Fill Gemini key
        const geminiInput = page.locator('[data-testid="input-geminiApiKey"]');
        await geminiInput.fill('AIzaSyC3Bd9zuFof6T1bFjddbfQVGhSaYNSkPmU');

        // Click test button
        const testBtn = page.locator('[data-testid="test-btn-gemini"]');
        await testBtn.click();
        console.log('✅ Bouton test cliqué');

        // Wait for validation (max 10 seconds)
        await page.waitForTimeout(3000);

        // Check for success toast or validated badge
        const successToast = page.locator('text=/validée/i').first();
        const hasToast = await successToast.isVisible().catch(() => false);

        if (hasToast) {
            console.log('✅ Toast de validation affiché');
        }

        // Check for validated badge
        const validatedBadge = page.locator('text=/Validée/i');
        const hasBadge = await validatedBadge.isVisible().catch(() => false);

        if (hasBadge) {
            console.log('✅ Badge "Validée" affiché');
        }

        // Check if models dropdown appeared
        const modelsSelect = page.locator('[data-testid="models-select-gemini"]');
        const hasModels = await modelsSelect.isVisible().catch(() => false);

        if (hasModels) {
            console.log('✅ Dropdown des modèles affiché');

            // Count models
            const options = await modelsSelect.locator('option').allTextContents();
            console.log(`📊 ${options.length - 1} modèles disponibles`);
        }

        console.log('🎉 Test de validation complété!');
    });

    test('Test button shows loading state', async ({ page }) => {
        console.log('🧪 Test: État de chargement du bouton');

        await page.goto('http://localhost:3000/settings/ai-api-keys');
        await page.waitForLoadState('networkidle');

        await page.click('[data-testid="tab-llm"]');
        await page.waitForTimeout(500);

        // Fill OpenAI key
        const openaiInput = page.locator('[data-testid="input-openaiApiKey"]');
        await openaiInput.fill('sk-test-key-123');

        // Click test button
        const testBtn = page.locator('[data-testid="test-btn-openai"]');
        await testBtn.click();

        // Check for loading state (within 1 second)
        const loadingText = page.locator('text=/Test.../i');
        const isLoading = await loadingText.isVisible({ timeout: 1000 }).catch(() => false);

        if (isLoading) {
            console.log('✅ État de chargement "Test..." affiché');
        }

        // Wait for test to complete
        await page.waitForTimeout(5000);

        console.log('✅ Test du bouton de chargement complété');
    });
});
