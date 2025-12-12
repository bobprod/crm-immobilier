const { test, expect } = require('@playwright/test');

test.describe('Delete Property E2E Test', () => {
    test.beforeEach(async ({ page }) => {
        console.log('=== Starting test setup ===');

        // Login
        await page.goto('http://localhost:3000/auth/login');
        await page.fill('input[type="email"]', 'test@playwright.com');
        await page.fill('input[type="password"]', 'Test1234');
        await page.click('button[type="submit"]');

        console.log('Login submitted, waiting for redirect...');

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        await page.waitForLoadState('networkidle');

        console.log('Redirected to dashboard, navigating to properties...');

        // Navigate to properties page
        await page.goto('http://localhost:3000/properties');
        await page.waitForLoadState('networkidle');

        // Wait for properties table to load
        await page.waitForSelector('table', { timeout: 15000 });

        console.log('=== Setup complete ===');
    });

    test('should show confirmation dialog and delete property successfully', async ({ page }) => {
        console.log('\n=== TEST: Delete Property ===');

        // Count properties before deletion
        const propertiesCountBefore = await page.locator('tbody tr').count();
        console.log(`Properties count before: ${propertiesCountBefore}`);

        // Find first property
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible({ timeout: 10000 });

        // Get property title for verification
        const propertyTitle = await firstRow.locator('td').nth(1).locator('div').first().textContent();
        console.log(`Attempting to delete property: "${propertyTitle}"`);

        // Click delete button
        const deleteButton = firstRow.locator('button[data-testid^="delete-property-"]');
        console.log('Clicking delete button...');
        await deleteButton.click();

        // Wait for confirmation dialog to appear
        console.log('Waiting for confirmation dialog...');
        await page.waitForTimeout(3000); // Give React time to render

        const dialog = page.locator('[role="alertdialog"]');

        // Take screenshot before checking dialog
        await page.screenshot({ path: 'test-results/before-dialog-check.png', fullPage: true });

        // Check if dialog is visible
        const isDialogVisible = await dialog.isVisible().catch(() => false);
        console.log(`Dialog visible: ${isDialogVisible}`);

        if (!isDialogVisible) {
            console.error('❌ Dialog NOT found! Taking debug screenshot...');
            await page.screenshot({ path: 'test-results/dialog-not-found.png', fullPage: true });

            // Check what's on the page
            const pageContent = await page.content();
            console.log('Page HTML length:', pageContent.length);

            // Check for any dialogs
            const allDialogs = await page.locator('[role="dialog"], [role="alertdialog"]').count();
            console.log(`Total dialogs found: ${allDialogs}`);

            throw new Error('Confirmation dialog did not appear');
        }

        await expect(dialog).toBeVisible({ timeout: 10000 });
        console.log('✓ Dialog is visible');

        // Verify dialog content
        await expect(dialog).toContainText('Supprimer la propriété');
        console.log('✓ Dialog has correct title');

        if (propertyTitle) {
            await expect(dialog).toContainText(propertyTitle.trim());
            console.log('✓ Dialog shows property name');
        }

        // Verify buttons exist
        const cancelButton = dialog.locator('button', { hasText: 'Annuler' });
        const confirmButton = dialog.locator('button', { hasText: 'Supprimer' });
        await expect(cancelButton).toBeVisible();
        await expect(confirmButton).toBeVisible();
        console.log('✓ Both buttons are visible');

        // Verify confirm button is red (destructive)
        const confirmClass = await confirmButton.getAttribute('class');
        expect(confirmClass).toContain('bg-red-');
        console.log('✓ Confirm button is red (destructive)');

        // Wait for DELETE request and click confirm
        console.log('Clicking confirm button...');

        const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/properties/') &&
                response.request().method() === 'DELETE',
            { timeout: 15000 }
        );

        await confirmButton.click();

        // Wait for API response
        console.log('Waiting for DELETE API response...');
        const response = await responsePromise;
        console.log(`API Response status: ${response.status()}`);
        expect(response.status()).toBe(200);
        console.log('✓ DELETE request successful (200)');

        // Verify dialog closed
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
        console.log('✓ Dialog closed');

        // Wait for table to refresh
        await page.waitForTimeout(2000);

        // Verify property count decreased
        const propertiesCountAfter = await page.locator('tbody tr').count();
        console.log(`Properties count after: ${propertiesCountAfter}`);
        console.log(`Expected: ${propertiesCountBefore - 1}, Got: ${propertiesCountAfter}`);

        expect(propertiesCountAfter).toBeLessThan(propertiesCountBefore);
        console.log('✓ Property was deleted from table');

        console.log('\n=== TEST PASSED ===\n');
    });

    test('should cancel deletion when clicking Annuler', async ({ page }) => {
        console.log('\n=== TEST: Cancel Delete ===');

        // Count properties
        const propertiesCountBefore = await page.locator('tbody tr').count();
        console.log(`Properties count: ${propertiesCountBefore}`);

        // Find first property
        const firstRow = page.locator('tbody tr').first();
        const propertyTitle = await firstRow.locator('td').nth(1).locator('div').first().textContent();
        console.log(`Property: "${propertyTitle}"`);

        // Click delete
        const deleteButton = firstRow.locator('button[data-testid^="delete-property-"]');
        await deleteButton.click();

        // Wait for dialog
        await page.waitForTimeout(3000);
        const dialog = page.locator('[role="alertdialog"]');
        await expect(dialog).toBeVisible({ timeout: 10000 });
        console.log('✓ Dialog appeared');

        // Click cancel
        const cancelButton = dialog.locator('button', { hasText: 'Annuler' });
        console.log('Clicking cancel button...');
        await cancelButton.click();

        // Verify dialog closed
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
        console.log('✓ Dialog closed');

        // Wait a moment
        await page.waitForTimeout(1000);

        // Verify property still exists
        const propertiesCountAfter = await page.locator('tbody tr').count();
        expect(propertiesCountAfter).toBe(propertiesCountBefore);
        console.log('✓ Property was NOT deleted');

        // Verify property still visible
        await expect(firstRow).toBeVisible();
        console.log('✓ Property row still visible');

        console.log('\n=== TEST PASSED ===\n');
    });
});
