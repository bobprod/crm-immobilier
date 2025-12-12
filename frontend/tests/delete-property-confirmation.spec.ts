import { test, expect } from '@playwright/test';

test.describe('Property Delete with Confirmation Dialog', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('http://localhost:3000/auth/login');
        await page.fill('input[type="email"]', 'test@playwright.com');
        await page.fill('input[type="password"]', 'Test1234');
        await page.click('button[type="submit"]');

        // Wait for redirect to properties page
        await page.waitForURL('**/properties', { timeout: 10000 });
        await page.waitForLoadState('networkidle');

        // Wait for properties to load
        await page.waitForSelector('table', { timeout: 10000 });
    });

    test('should show confirmation dialog when clicking delete button on individual property', async ({ page }) => {
        // Wait for at least one property to be loaded
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible({ timeout: 10000 });

        // Get the property title before deletion
        const propertyTitle = await firstRow.locator('td').nth(1).locator('div').first().textContent();
        console.log('Property title:', propertyTitle);

        // Click the delete button (trash icon)
        const deleteButton = firstRow.locator('button[data-testid^="delete-property-"]');
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        // Wait a bit for dialog to appear
        await page.waitForTimeout(500);

        // Verify confirmation dialog appears
        const dialog = page.locator('[role="alertdialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Verify dialog title
        const dialogTitle = dialog.locator('h2, [data-slot="title"]').first();
        await expect(dialogTitle).toContainText('Supprimer la propriété');

        // Verify dialog description contains property title
        const dialogDescription = dialog.locator('p, [data-slot="description"]').first();
        const descriptionText = await dialogDescription.textContent();
        console.log('Dialog description:', descriptionText);

        if (propertyTitle) {
            expect(descriptionText).toContain(propertyTitle.trim());
        }
        expect(descriptionText).toContain('irréversible');

        // Verify buttons exist
        const cancelButton = dialog.locator('button', { hasText: 'Annuler' });
        const confirmButton = dialog.locator('button', { hasText: 'Supprimer' });

        await expect(cancelButton).toBeVisible();
        await expect(confirmButton).toBeVisible();

        // Verify confirm button has destructive styling (red)
        const confirmButtonClass = await confirmButton.getAttribute('class');
        expect(confirmButtonClass).toContain('bg-red-');
    });

    test('should close dialog when clicking Cancel button', async ({ page }) => {
        // Wait for at least one property
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible({ timeout: 10000 });

        // Click delete button
        const deleteButton = firstRow.locator('button[data-testid^="delete-property-"]');
        await deleteButton.click();

        // Wait for dialog
        await page.waitForTimeout(500);
        const dialog = page.locator('[role="alertdialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Count properties before cancel
        const propertiesCountBefore = await page.locator('tbody tr').count();

        // Click Cancel button
        const cancelButton = dialog.locator('button', { hasText: 'Annuler' });
        await cancelButton.click();

        // Verify dialog is closed
        await expect(dialog).not.toBeVisible({ timeout: 3000 });

        // Verify properties count hasn't changed
        const propertiesCountAfter = await page.locator('tbody tr').count();
        expect(propertiesCountAfter).toBe(propertiesCountBefore);
    });

    test('should delete property when clicking Confirm button', async ({ page }) => {
        // Wait for at least one property
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible({ timeout: 10000 });

        // Get property ID for verification
        const deleteButton = firstRow.locator('button[data-testid^="delete-property-"]');
        const dataTestId = await deleteButton.getAttribute('data-testid');
        const propertyId = dataTestId?.replace('delete-property-', '');
        console.log('Deleting property ID:', propertyId);

        // Count properties before deletion
        const propertiesCountBefore = await page.locator('tbody tr').count();
        console.log('Properties before deletion:', propertiesCountBefore);

        // Click delete button
        await deleteButton.click();

        // Wait for dialog
        await page.waitForTimeout(500);
        const dialog = page.locator('[role="alertdialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Click Confirm button
        const confirmButton = dialog.locator('button', { hasText: 'Supprimer' });
        await confirmButton.click();

        // Wait for deletion to complete
        await page.waitForTimeout(2000);

        // Verify dialog is closed
        await expect(dialog).not.toBeVisible({ timeout: 3000 });

        // Verify property is deleted (count decreased or specific property gone)
        const propertiesCountAfter = await page.locator('tbody tr').count();
        console.log('Properties after deletion:', propertiesCountAfter);

        expect(propertiesCountAfter).toBeLessThan(propertiesCountBefore);
    });

    test('should show confirmation dialog for bulk delete', async ({ page }) => {
        // Wait for properties to load
        await page.waitForSelector('tbody tr', { timeout: 10000 });

        // Select first two properties
        const checkboxes = page.locator('tbody tr input[type="checkbox"]');
        const checkboxCount = await checkboxes.count();

        if (checkboxCount >= 2) {
            await checkboxes.nth(0).click();
            await checkboxes.nth(1).click();
        } else if (checkboxCount >= 1) {
            await checkboxes.nth(0).click();
        } else {
            test.skip();
        }

        // Wait for bulk actions to appear
        await page.waitForTimeout(500);

        // Find and click the delete bulk action button
        // This might be in PropertyBulkActions component
        const bulkDeleteButton = page.locator('button', { hasText: /supprimer|delete/i }).first();
        await bulkDeleteButton.click();

        // Wait for dialog
        await page.waitForTimeout(500);
        const dialog = page.locator('[role="alertdialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Verify dialog title for bulk delete
        const dialogTitle = dialog.locator('h2, [data-slot="title"]').first();
        await expect(dialogTitle).toContainText('Supprimer les propriétés');

        // Verify description mentions number of properties
        const dialogDescription = dialog.locator('p, [data-slot="description"]').first();
        const descriptionText = await dialogDescription.textContent();
        expect(descriptionText).toMatch(/\d+ propriété\(s\)/);
    });

    test('should NOT show browser alert or confirm dialogs', async ({ page }) => {
        // Listen for any alerts/confirms
        let alertShown = false;
        let confirmShown = false;

        page.on('dialog', dialog => {
            console.log('Browser dialog detected:', dialog.type(), dialog.message());
            if (dialog.type() === 'alert') {
                alertShown = true;
            } else if (dialog.type() === 'confirm') {
                confirmShown = true;
            }
            dialog.dismiss();
        });

        // Wait for properties
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible({ timeout: 10000 });

        // Click delete button
        const deleteButton = firstRow.locator('button[data-testid^="delete-property-"]');
        await deleteButton.click();

        // Wait for confirmation dialog
        await page.waitForTimeout(1000);

        // Verify custom dialog is shown
        const dialog = page.locator('[role="alertdialog"]');
        await expect(dialog).toBeVisible();

        // Verify NO browser alerts were shown
        expect(alertShown).toBe(false);
        expect(confirmShown).toBe(false);
    });
});
