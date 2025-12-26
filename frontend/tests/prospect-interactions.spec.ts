import { test, expect } from '@playwright/test';

test.describe('Prospect Interactions', () => {
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
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
  });

  test('should add an interaction to a prospect', async ({ page }) => {
    // Click on first prospect to view details
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });
    await firstRow.click();

    // Wait for navigation to prospect detail page
    await page.waitForURL(/\/prospects\/.+/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Click add interaction button
    const addInteractionButton = page.locator('[data-testid="add-interaction-button"]');
    await addInteractionButton.click();

    // Wait for modal
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Select interaction type if dropdown exists
    const typeSelect = page.locator('[data-testid="interaction-type-select"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.click();
      await page.click('[role="option"]:has-text("Appel téléphonique")');
    }

    // Fill interaction notes
    await page.fill(
      '[data-testid="interaction-notes"]',
      'Discussion sur les critères de recherche',
    );

    // Wait for POST request
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/interactions') && response.request().method() === 'POST',
      { timeout: 10000 },
    );

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for API response
    const response = await responsePromise;
    expect(response.status()).toBe(201);

    // Verify modal closed
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Wait for page to refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify interaction appears on page
    const interactionText = page.locator('text=Discussion sur les critères');
    await expect(interactionText).toBeVisible({ timeout: 5000 });
  });
});
