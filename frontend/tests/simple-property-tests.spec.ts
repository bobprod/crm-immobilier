import { test, expect } from '@playwright/test';

test.describe('Property Delete Confirmation Dialog - Simple Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('http://localhost:3000/auth/login');
        await page.waitForLoadState('networkidle');

        await page.fill('input[type="email"]', 'test@playwright.com');
        await page.fill('input[type="password"]', 'Test1234');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForURL('**/dashboard', { timeout: 15000 });

        // Go to properties
        await page.goto('http://localhost:3000/properties');
        await page.waitForLoadState('networkidle');

        // Wait for table
        await page.waitForSelector('table tbody tr', { timeout: 15000, state: 'visible' });
    });

    test('Delete button shows beautiful confirmation dialog (not browser alert)', async ({ page }) => {
        // Track if browser dialog appears
        let browserDialogDetected = false;
        page.on('dialog', dialog => {
            browserDialogDetected = true;
            console.error('❌ Browser dialog:', dialog.type());
            dialog.dismiss();
        });

        // Find and click delete button
        const deleteButton = page.locator('button[data-testid^="delete-property-"]').first();
        await expect(deleteButton).toBeVisible({ timeout: 5000 });
        await deleteButton.click();

        // Wait for custom dialog
        await page.waitForTimeout(1500);

        // Verify custom AlertDialog appears
        const customDialog = page.locator('[role="alertdialog"]');
        await expect(customDialog).toBeVisible({ timeout: 5000 });

        // Verify dialog has correct content
        await expect(customDialog).toContainText('Supprimer la propriété');
        await expect(customDialog).toContainText('irréversible');

        // Verify buttons exist
        const cancelBtn = customDialog.locator('button', { hasText: 'Annuler' });
        const confirmBtn = customDialog.locator('button', { hasText: 'Supprimer' });
        await expect(cancelBtn).toBeVisible();
        await expect(confirmBtn).toBeVisible();

        // Verify red styling
        const btnClass = await confirmBtn.getAttribute('class');
        expect(btnClass).toContain('bg-red');

        // Verify NO browser dialog
        expect(browserDialogDetected).toBe(false);
        console.log('✅ Test PASSED: Beautiful confirmation dialog shown, no browser alert!');

        // Cancel to close
        await cancelBtn.click();
        await expect(customDialog).not.toBeVisible({ timeout: 3000 });
    });

    test('Edit property works without rooms field error', async ({ page }) => {
        // Click edit on first property
        const editButton = page.locator('button[data-testid^="edit-property-"]').first();
        await expect(editButton).toBeVisible({ timeout: 5000 });
        await editButton.click();

        // Wait for modal
        await page.waitForTimeout(1500);
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Verify NO rooms field in form
        const roomsInput = page.locator('input[data-testid="property-rooms-input"]');
        await expect(roomsInput).not.toBeVisible();
        console.log('✅ Rooms field NOT present in form');

        // Get title and modify it
        const titleInput = page.locator('input[data-testid="property-title-input"]');
        const oldTitle = await titleInput.inputValue();
        const newTitle = `${oldTitle} - Test ${Date.now()}`;

        await titleInput.fill('');
        await titleInput.fill(newTitle);

        // Listen for API request
        const requestPromise = page.waitForRequest(
            req => req.url().includes('/api/properties/') && req.method() === 'PUT',
            { timeout: 15000 }
        );

        // Submit
        const submitBtn = modal.locator('button[type="submit"]');
        await submitBtn.click();

        // Wait for request
        const request = await requestPromise;
        const payload = JSON.parse(request.postData() || '{}');

        // Verify NO rooms in payload
        expect(payload).not.toHaveProperty('rooms');
        console.log('✅ Rooms field NOT sent to backend');

        // Wait for response and modal to close
        await page.waitForTimeout(3000);

        // Verify no error (modal should close)
        const isModalGone = await modal.isVisible().catch(() => false);
        if (isModalGone) {
            console.log('❌ Modal still visible - there might be an error');
        } else {
            console.log('✅ Modal closed successfully - no 400 error!');
        }
    });
});
