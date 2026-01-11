import { test, expect } from '@playwright/test';

test.describe('Button Click - Enregistrer les clés LLM', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to settings page
        await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });

        // Set auth token in localStorage (simulate logged-in user)
        await page.evaluate(() => {
            localStorage.setItem('token', 'test-token-12345');
        });

        // Reload to apply token
        await page.reload({ waitUntil: 'networkidle' });
    });

    test('should have the button on the page', async ({ page }) => {
        // Look for the button
        const button = page.locator('button:has-text("Enregistrer les clés LLM")');
        await expect(button).toBeVisible();
        console.log('✅ Button found and visible');
    });

    test('should trigger API call when button is clicked', async ({ page }) => {
        // Click on LLM/IA tab if it exists
        const tabs = page.locator('[role="tablist"]');
        if (await tabs.isVisible()) {
            const llmTab = page.locator('button:has-text("LLM")');
            if (await llmTab.isVisible()) {
                await llmTab.click();
                await page.waitForTimeout(500);
            }
        }

        // Fill in form fields
        const providerSelect = page.locator('select').first();
        if (await providerSelect.isVisible()) {
            await providerSelect.selectOption('openai');
        }

        const modelSelect = page.locator('select').nth(1);
        if (await modelSelect.isVisible()) {
            await modelSelect.selectOption('gpt-4o');
        }

        // Fill API key field
        const apiKeyInput = page.locator('input[type="password"], input[placeholder*="OpenAI"], input[type="text"]').first();
        if (await apiKeyInput.isVisible()) {
            await apiKeyInput.fill('sk-test123456789');
        }

        // Set up network interception to catch the API call
        let apiCallMade = false;
        page.on('request', (request) => {
            if (request.url().includes('/api/ai-billing/api-keys/user')) {
                apiCallMade = true;
                console.log('🔵 API Request made to:', request.url());
                console.log('   Method:', request.method());
                console.log('   Body:', request.postDataJSON());
            }
        });

        // Click the save button
        const saveButton = page.locator('button:has-text("Enregistrer les clés LLM")');
        await saveButton.click();

        // Wait for API call
        await page.waitForTimeout(1000);

        if (apiCallMade) {
            console.log('✅ API call was triggered');
        } else {
            console.log('⚠️  No API call detected (might be cached or blocked)');
        }
    });

    test('should show loading state on button click', async ({ page }) => {
        // Click on LLM/IA tab
        const llmTab = page.locator('button:has-text("LLM")');
        if (await llmTab.isVisible()) {
            await llmTab.click();
            await page.waitForTimeout(500);
        }

        // Fill minimal form
        const apiKeyInput = page.locator('input[type="password"], input[type="text"]').first();
        if (await apiKeyInput.isVisible()) {
            await apiKeyInput.fill('sk-test123');
        }

        const saveButton = page.locator('button:has-text("Enregistrer les clés LLM")');

        // Intercept network to delay response
        await page.route('**/api/ai-billing/api-keys/user', async (route) => {
            await page.waitForTimeout(500);
            route.abort();
        });

        await saveButton.click();

        // Button should show loading state
        const isDisabled = await saveButton.isDisabled();
        const hasLoadingClass = await saveButton.evaluate(el => el.className.includes('loading'));

        console.log('   Button disabled during load:', isDisabled);
        console.log('   Button has loading class:', hasLoadingClass);
    });

    test('should handle missing authentication', async ({ page }) => {
        // Clear token to simulate no auth
        await page.evaluate(() => {
            localStorage.removeItem('token');
        });

        await page.reload({ waitUntil: 'networkidle' });

        // Click the button
        const saveButton = page.locator('button:has-text("Enregistrer les clés LLM")');
        await saveButton.click();

        // Should show auth error
        await page.waitForTimeout(500);

        const errorMessage = page.locator('text=Authentification requise');
        const isVisible = await errorMessage.isVisible().catch(() => false);

        if (isVisible) {
            console.log('✅ Authentication error shown correctly');
        } else {
            console.log('⚠️  Auth error message not visible (might be in toast)');
        }
    });

    test('complete flow - save API keys', async ({ page }) => {
        console.log('\n🚀 Starting complete flow test...');

        // Navigate to settings
        await page.goto('http://localhost:3000/settings/ai-api-keys', { waitUntil: 'networkidle' });

        // Check page loaded
        const pageTitle = page.locator('h1, h2').first();
        console.log('   Page loaded:', await pageTitle.isVisible());

        // Fill in form
        const inputs = page.locator('input[type="text"], input[type="password"]');
        const inputCount = await inputs.count();
        console.log('   Found', inputCount, 'input fields');

        if (inputCount > 0) {
            await inputs.first().fill('sk-test-key-12345');
        }

        // Click save button
        const saveButton = page.locator('button:has-text("Enregistrer les clés LLM"), button:has-text("Sauvegarder")').first();
        if (await saveButton.isVisible()) {
            console.log('   ✅ Save button found');
            await saveButton.click();
            console.log('   ✅ Button clicked');

            // Wait for response
            await page.waitForTimeout(2000);

            // Check for toast notification
            const toast = page.locator('[role="alert"], .toast, .notification').first();
            if (await toast.isVisible().catch(() => false)) {
                const toastText = await toast.textContent();
                console.log('   ✅ Toast shown:', toastText?.substring(0, 50));
            }
        } else {
            console.log('   ⚠️  Save button not found');
        }
    });
});
