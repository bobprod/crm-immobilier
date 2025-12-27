import { test, expect } from '@playwright/test';

/**
 * Complete test for property creation through modal
 */
test.describe('Property Creation via Modal', () => {
    test('should successfully create a property with all required fields', async ({ page }) => {
        test.setTimeout(60000);

        // Listen to console messages
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('❌ Browser console error:', msg.text());
            }
        });

        // Login
        await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
        await page.locator('input[type="email"]').fill('test@playwright.com');
        await page.locator('input[type="password"]').fill('Test1234');
        await page.locator('button[type="submit"]').click();
        await page.waitForURL(/\/(dashboard|properties)/, { timeout: 30000 });

        // Navigate to properties page
        await page.goto('http://localhost:3000/properties', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('button:has-text("Nouvelle Propriété")');

        console.log('✅ Ready to create property');

        // Click "Nouvelle Propriété"
        await page.locator('button:has-text("Nouvelle Propriété")').click();

        // Wait for modal
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });
        console.log('✅ Modal opened');

        // Fill out the form
        await page.locator('[data-testid="property-title-input"]').fill('Test Apartment E2E');
        console.log('✅ Title filled');

        // Select Type (default is apartment, so skip if already correct)
        console.log('✅ Type: using default (apartment)');

        // Select Category (default is sale, so skip if already correct)
        console.log('✅ Category: using default (sale)');

        // Fill Price
        await page.locator('[data-testid="property-price-input"]').fill('350000');
        console.log('✅ Price filled: 350000');

        // Fill Area
        await page.locator('[data-testid="property-area-input"]').fill('150');
        console.log('✅ Area filled: 150');

        // Fill Rooms
        await page.locator('[data-testid="property-rooms-input"]').fill('5');
        console.log('✅ Rooms filled: 5');

        // Fill Bedrooms
        await page.locator('[data-testid="property-bedrooms-input"]').fill('3');
        console.log('✅ Bedrooms filled: 3');

        // Fill Bathrooms
        await page.locator('[data-testid="property-bathrooms-input"]').fill('2');
        console.log('✅ Bathrooms filled: 2');

        // Fill Address
        await page.locator('[data-testid="property-address-input"]').fill('15 Avenue Habib Bourguiba');
        console.log('✅ Address filled');

        // Fill City
        await page.locator('[data-testid="property-city-input"]').fill('Tunis');
        console.log('✅ City filled');

        // Take screenshot before submit
        await page.screenshot({ path: 'before-submit.png', fullPage: true });

        // Submit the form
        await page.locator('[data-testid="property-submit-button"]').click();
        console.log('🖱️  Clicked submit button');

        // Wait for modal to close (indicates success)
        await expect(modal).not.toBeVisible({ timeout: 10000 });
        console.log('✅ Modal closed after submission');

        // Wait for the properties list to refresh
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Verify the property appears in the list (use .first() to avoid strict mode error)
        const propertyRow = page.locator('text=Test Apartment E2E').first();
        await expect(propertyRow).toBeVisible({ timeout: 5000 });
        console.log('✅ Property appears in the list');

        // Take screenshot of success
        await page.screenshot({ path: 'property-created-success.png', fullPage: true });

        console.log('🎉 TEST PASSED: Property created successfully!');
    });
});
