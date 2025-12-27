import { test, expect } from '@playwright/test';

/**
 * Test de diagnostic rapide pour vérifier que le modal s'ouvre
 */
test.describe('Quick Modal Test', () => {
    test('should open modal when clicking "Nouvelle Propriété"', async ({ page }) => {
        // Login first with real credentials
        await page.goto('http://localhost:3000/login');

        // Fill login form
        await page.locator('input[type="email"]').fill('test@playwright.com');
        await page.locator('input[type="password"]').fill('Test1234');
        await page.locator('button[type="submit"]').click();

        // Wait for redirect to dashboard or properties
        await page.waitForURL(/\/(dashboard|properties)/, { timeout: 10000 });

        // Navigate to properties if needed
        if (page.url().includes('dashboard')) {
            await page.goto('http://localhost:3000/properties');
        }

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Log current URL before clicking
        console.log('Current URL before click:', page.url());

        // Find and click the "Nouvelle Propriété" button
        const createButton = page.locator('button:has-text("Nouvelle Propriété")');
        await expect(createButton).toBeVisible({ timeout: 10000 });

        // Take screenshot before clicking
        await page.screenshot({ path: 'before-click.png' });

        await createButton.click();

        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Log current URL after clicking
        console.log('Current URL after click:', page.url());

        // Take screenshot after clicking
        await page.screenshot({ path: 'after-click.png' });

        // Check if modal is visible
        const modal = page.locator('[role="dialog"]');
        const isModalVisible = await modal.isVisible();
        console.log('Is modal visible?', isModalVisible);

        // Check if URL changed (it shouldn't)
        const currentUrl = page.url();
        console.log('Final URL:', currentUrl);

        if (currentUrl.includes('/properties/new')) {
            console.error('ERROR: URL changed to /properties/new - modal handler not working!');
            throw new Error('Button is still redirecting instead of opening modal');
        }

        // Verify modal is visible
        await expect(modal).toBeVisible({ timeout: 5000 });
        console.log('SUCCESS: Modal is visible!');

        // Verify modal title
        await expect(page.locator('text=Nouvelle propriété')).toBeVisible();
        console.log('SUCCESS: Modal title is correct!');
    });
});
