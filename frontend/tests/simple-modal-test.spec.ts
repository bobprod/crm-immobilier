import { test, expect } from '@playwright/test';

/**
 * Simple test to verify modal functionality
 */
test.describe('Simple Modal Test', () => {
    test('should open modal when clicking "Nouvelle Propriété"', async ({ page }) => {
        // Set longer timeout for this test
        test.setTimeout(60000);

        // Login
        await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

        await page.locator('input[type="email"]').fill('test@playwright.com');
        await page.locator('input[type="password"]').fill('Test1234');
        await page.locator('button[type="submit"]').click();

        // Wait for navigation after login (either dashboard or properties)
        await page.waitForURL(/\/(dashboard|properties)/, { timeout: 30000 });

        // Navigate directly to properties page
        await page.goto('http://localhost:3000/properties', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for the properties list to load
        await page.waitForSelector('button:has-text("Nouvelle Propriété")', { timeout: 10000 });

        console.log('✅ Properties page loaded successfully');
        console.log('📍 Current URL:', page.url());

        // Click the "Nouvelle Propriété" button
        const createButton = page.locator('button:has-text("Nouvelle Propriété")');
        await createButton.click();

        console.log('🖱️  Clicked "Nouvelle Propriété" button');

        // Wait for modal to appear
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        console.log('✅ Modal is visible!');
        console.log('📍 URL after click:', page.url());

        // Verify modal has the correct title
        const modalTitle = modal.locator('h2:has-text("Nouvelle propriété")');
        await expect(modalTitle).toBeVisible();

        console.log('✅ Modal title confirmed');

        // Verify URL did NOT change to /properties/new
        expect(page.url()).not.toContain('/properties/new');
        expect(page.url()).toContain('/properties');

        console.log('✅ URL stayed at /properties (no redirect)');

        // Take a screenshot
        await page.screenshot({ path: 'modal-success.png', fullPage: true });

        console.log('📸 Screenshot saved as modal-success.png');
        console.log('🎉 TEST PASSED: Modal opens correctly without redirect!');
    });
});
