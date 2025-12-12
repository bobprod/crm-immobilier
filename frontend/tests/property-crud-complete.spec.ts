import { test, expect } from '@playwright/test';

test.describe('Property CRUD with Confirmation Dialog', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('http://localhost:3000/auth/login');
        await page.fill('input[type="email"]', 'test@playwright.com');
        await page.fill('input[type="password"]', 'Test1234');
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });
        await page.waitForLoadState('networkidle');

        // Navigate to properties page
        await page.goto('http://localhost:3000/properties');
        await page.waitForLoadState('networkidle');

        // Wait for properties to load
        await page.waitForSelector('table', { timeout: 10000 });
    });

    test('should create a property without rooms field', async ({ page }) => {
        // Click create button
        const createButton = page.locator('button[data-testid="create-property-button"]');
        await createButton.click();

        // Wait for modal
        await page.waitForTimeout(1000);
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Fill form (without rooms field)
        await page.fill('input[data-testid="property-title-input"]', 'Test Property No Rooms');
        await page.fill('textarea[data-testid="property-description-input"]', 'Test description');
        await page.fill('input[data-testid="property-price-input"]', '150000');
        await page.fill('input[data-testid="property-area-input"]', '100');

        // Verify rooms field doesn't exist in form
        const roomsInput = page.locator('input[data-testid="property-rooms-input"]');
        await expect(roomsInput).not.toBeVisible();

        // Fill bedrooms and bathrooms (these are supported)
        await page.fill('input[data-testid="property-bedrooms-input"]', '3');
        await page.fill('input[data-testid="property-bathrooms-input"]', '2');

        // Wait for POST request and response
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/properties') && response.request().method() === 'POST',
            { timeout: 10000 }
        );

        // Submit form
        const submitButton = modal.locator('button[type="submit"]');
        await submitButton.click();

        // Wait for API response
        const response = await responsePromise;
        expect(response.status()).toBe(201);

        // Verify modal closed
        await expect(modal).not.toBeVisible({ timeout: 5000 });

        // Wait for table to refresh
        await page.waitForTimeout(1000);

        // Verify property appears in table (use .first() to handle duplicates)
        const newProperty = page.locator('tr', { hasText: 'Test Property No Rooms' }).first();
        await expect(newProperty).toBeVisible({ timeout: 5000 });
    });

    test('should edit a property without sending rooms field to backend', async ({ page }) => {
        // Find first property and click edit
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible({ timeout: 10000 });

        const editButton = firstRow.locator('button[data-testid^="edit-property-"]');
        await editButton.click();

        // Wait for modal
        await page.waitForTimeout(1000);
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Verify rooms field doesn't exist
        const roomsInput = page.locator('input[data-testid="property-rooms-input"]');
        await expect(roomsInput).not.toBeVisible();

        // Get current title
        const titleInput = page.locator('input[data-testid="property-title-input"]');
        const currentTitle = await titleInput.inputValue();

        // Modify title
        const newTitle = `${currentTitle} - Updated ${Date.now()}`;
        await titleInput.fill('');
        await titleInput.fill(newTitle);

        // Wait for PUT request and verify no rooms field
        const requestPromise = page.waitForRequest(
            request => request.method() === 'PUT' && request.url().includes('/api/properties/'),
            { timeout: 10000 }
        );

        const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/properties/') && response.request().method() === 'PUT',
            { timeout: 10000 }
        );

        // Submit form
        const submitButton = modal.locator('button[type="submit"]');
        await submitButton.click();

        // Wait for request and response
        const request = await requestPromise;
        const response = await responsePromise;

        // Verify request doesn't contain rooms
        const requestData = JSON.parse(request.postData() || '{}');
        expect(requestData).not.toHaveProperty('rooms');
        console.log('✓ Confirmed: rooms field not sent to backend');

        // Verify successful response (200, not 400)
        expect(response.status()).toBe(200);

        // Verify modal closed (no 400 error)
        await expect(modal).not.toBeVisible({ timeout: 5000 });

        // Verify updated property appears in table
        const updatedProperty = page.locator('tr', { hasText: newTitle });
        await expect(updatedProperty).toBeVisible({ timeout: 5000 });

        // Verify rooms field was NOT sent in request
        if (requestData) {
            expect(requestData).not.toHaveProperty('rooms');
            console.log('✓ Confirmed: rooms field not sent to backend');
        }
    });

    test('should show confirmation dialog when deleting property', async ({ page }) => {
        // Find first property
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible({ timeout: 10000 });

        // Get property title
        const propertyTitle = await firstRow.locator('td').nth(1).locator('div').first().textContent();
        console.log('Deleting property:', propertyTitle);

        // Click delete button
        const deleteButton = firstRow.locator('button[data-testid^="delete-property-"]');
        await deleteButton.click();

        // Wait for confirmation dialog with longer timeout
        await page.waitForTimeout(2000);
        const dialog = page.locator('[role="alertdialog"]');
        await expect(dialog).toBeVisible({ timeout: 10000 });

        // Verify dialog content
        await expect(dialog).toContainText('Supprimer la propriété');
        if (propertyTitle) {
            await expect(dialog).toContainText(propertyTitle.trim());
        }

        // Verify buttons
        const cancelButton = dialog.locator('button', { hasText: 'Annuler' });
        const confirmButton = dialog.locator('button', { hasText: 'Supprimer' });
        await expect(cancelButton).toBeVisible();
        await expect(confirmButton).toBeVisible();

        // Verify confirm button is red (destructive)
        const confirmClass = await confirmButton.getAttribute('class');
        expect(confirmClass).toContain('bg-red-');

        // Click cancel (don't actually delete)
        await cancelButton.click();

        // Verify dialog closed
        await expect(dialog).not.toBeVisible({ timeout: 3000 });

        // Verify property still exists
        await expect(firstRow).toBeVisible();
    });

    test('should actually delete property when confirming', async ({ page }) => {
        // Count properties before
        const propertiesCountBefore = await page.locator('tbody tr').count();
        console.log('Properties before deletion:', propertiesCountBefore);

        // Find first property
        const firstRow = page.locator('tbody tr').first();
        const propertyId = (await firstRow.locator('button[data-testid^="delete-property-"]').getAttribute('data-testid'))?.replace('delete-property-', '');

        // Click delete
        const deleteButton = firstRow.locator('button[data-testid^="delete-property-"]');
        await deleteButton.click();

        // Wait for dialog with longer timeout
        await page.waitForTimeout(2000);
        const dialog = page.locator('[role="alertdialog"]');
        await expect(dialog).toBeVisible({ timeout: 10000 });

        // Wait for DELETE request
        const responsePromise = page.waitForResponse(
            response => response.url().includes('/api/properties/') && response.request().method() === 'DELETE',
            { timeout: 10000 }
        );

        // Confirm deletion
        const confirmButton = dialog.locator('button', { hasText: 'Supprimer' });
        await confirmButton.click();

        // Wait for API response
        const response = await responsePromise;
        expect(response.status()).toBe(200);

        // Verify dialog closed
        await expect(dialog).not.toBeVisible({ timeout: 3000 });

        // Wait for table to refresh
        await page.waitForTimeout(1000);

        // Verify property count decreased
        const propertiesCountAfter = await page.locator('tbody tr').count();
        console.log('Properties after deletion:', propertiesCountAfter);
        expect(propertiesCountAfter).toBeLessThan(propertiesCountBefore);
    });

    test('should NOT show browser alert or confirm dialogs', async ({ page }) => {
        let browserDialogDetected = false;

        // Listen for any browser dialogs
        page.on('dialog', dialog => {
            browserDialogDetected = true;
            console.error('❌ Browser dialog detected:', dialog.type(), dialog.message());
            dialog.dismiss();
        });

        // Try to delete a property
        const firstRow = page.locator('tbody tr').first();
        await expect(firstRow).toBeVisible({ timeout: 10000 });

        const deleteButton = firstRow.locator('button[data-testid^="delete-property-"]');
        await deleteButton.click();

        // Wait for custom dialog with longer timeout
        await page.waitForTimeout(2000);

        // Verify custom AlertDialog is shown
        const customDialog = page.locator('[role="alertdialog"]');
        await expect(customDialog).toBeVisible({ timeout: 10000 });

        // Verify NO browser dialogs were shown
        expect(browserDialogDetected).toBe(false);
        console.log('✓ No browser alerts detected - using custom confirmation dialog');
    });

    test('should handle bulk delete with confirmation dialog', async ({ page }) => {
        // Select first two properties
        const checkboxes = page.locator('tbody tr input[type="checkbox"]');
        const count = await checkboxes.count();

        if (count >= 2) {
            await checkboxes.nth(0).click();
            await checkboxes.nth(1).click();
        } else if (count >= 1) {
            await checkboxes.nth(0).click();
        } else {
            test.skip();
            return;
        }

        await page.waitForTimeout(500);

        // Find bulk delete button
        const bulkDeleteButton = page.locator('button', { hasText: /supprimer|delete/i }).first();
        await bulkDeleteButton.click();

        // Wait for dialog
        await page.waitForTimeout(500);
        const dialog = page.locator('[role="alertdialog"]');
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Verify bulk delete dialog
        await expect(dialog).toContainText('Supprimer les propriétés');

        // Cancel to avoid actually deleting
        const cancelButton = dialog.locator('button', { hasText: 'Annuler' });
        await cancelButton.click();

        await expect(dialog).not.toBeVisible({ timeout: 3000 });
    });
});
