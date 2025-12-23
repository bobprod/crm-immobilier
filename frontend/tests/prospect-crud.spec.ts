import { test, expect } from '@playwright/test';

test.describe('Prospect CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'test@playwright.com');
    await page.fill('input[type="password"]', 'Test1234');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Navigate to prospects page
    await page.goto('http://localhost:3000/prospects');
    await page.waitForLoadState('networkidle');

    // Wait for prospects to load
    await page.waitForSelector('table', { timeout: 10000 });
  });

  test('should create a prospect', async ({ page }) => {
    // Click create button
    const createButton = page.locator('[data-testid="create-prospect-button"]');
    await createButton.click();

    // Wait for modal
    await page.waitForTimeout(1000);
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Generate unique email to avoid conflicts
    const uniqueEmail = `jean.dupont.${Date.now()}@test.com`;

    // Fill form
    await page.fill('[data-testid="prospect-firstName"]', 'Jean');
    await page.fill('[data-testid="prospect-lastName"]', 'Dupont');
    await page.fill('[data-testid="prospect-email"]', uniqueEmail);
    await page.fill('[data-testid="prospect-phone"]', '+21612345678');

    // Select type (if dropdown)
    const typeSelect = page.locator('[data-testid="prospect-type-select"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.click('[role="option"]:has-text("buyer")');
    }

    // Wait for POST request
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/prospects') && response.request().method() === 'POST',
      { timeout: 10000 },
    );

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for API response
    const response = await responsePromise;
    expect(response.status()).toBe(201);

    // Verify modal closed
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Wait for table to refresh
    await page.waitForTimeout(1000);

    // Verify prospect appears in table
    const newProspect = page.locator('tr', { hasText: 'Jean Dupont' }).first();
    await expect(newProspect).toBeVisible({ timeout: 5000 });
  });

  test('should update a prospect', async ({ page }) => {
    // Find first prospect and click edit
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    const editButton = firstRow.locator('[data-testid^="edit-prospect-"]');
    await editButton.click();

    // Wait for modal
    await page.waitForTimeout(1000);
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Update first name
    const firstNameInput = page.locator('[data-testid="prospect-firstName"]');
    const currentName = await firstNameInput.inputValue();
    const newName = `${currentName} Updated`;

    await firstNameInput.fill(newName);

    // Wait for PUT request
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/prospects/') && response.request().method() === 'PUT',
      { timeout: 10000 },
    );

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for API response
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Verify modal closed
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Wait for table to refresh
    await page.waitForTimeout(1000);

    // Verify updated name appears
    await expect(page.locator(`text=${newName}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('should delete a prospect with confirmation', async ({ page }) => {
    // Find first prospect
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Get prospect name for verification
    const prospectName = await firstRow.locator('td').nth(1).textContent();

    // Click delete button
    const deleteButton = firstRow.locator('[data-testid^="delete-prospect-"]');
    await deleteButton.click();

    // Wait for confirmation dialog
    await page.waitForTimeout(500);
    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Verify dialog content
    await expect(dialog).toContainText('Supprimer le prospect');
    if (prospectName) {
      await expect(dialog).toContainText(prospectName);
    }

    // Verify delete button styling (should be red/destructive)
    const confirmButton = dialog.locator('button', { hasText: 'Supprimer' });
    const confirmClass = await confirmButton.getAttribute('class');
    expect(confirmClass).toContain('bg-red');

    // Wait for DELETE request
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/prospects/') && response.request().method() === 'DELETE',
      { timeout: 10000 },
    );

    // Confirm deletion
    await confirmButton.click();

    // Wait for API response
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Verify dialog closed
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Wait for table to refresh
    await page.waitForTimeout(1000);
  });
});
