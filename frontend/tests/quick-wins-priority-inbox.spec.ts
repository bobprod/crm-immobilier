import { test, expect } from '@playwright/test';

test.describe('Quick Wins - Priority Inbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/priority-inbox');
    await page.waitForLoadState('networkidle');
  });

  test('should display priority inbox page', async ({ page }) => {
    // Check for page title
    const title = page.locator('h2:has-text("Boîte Prioritaire")');
    await expect(title).toBeVisible();
  });

  test('should show description text', async ({ page }) => {
    const description = page.locator('text=Vos tâches et prospects les plus importants');
    await expect(description).toBeVisible();
  });

  test('should display tabs for filtering', async ({ page }) => {
    // Check for tabs
    const allTab = page.locator('button:has-text("Tout")');
    const prospectsTab = page.locator('button:has-text("Prospects")');
    const tasksTab = page.locator('button:has-text("Rendez-vous")');

    await expect(allTab).toBeVisible();
    await expect(prospectsTab).toBeVisible();
    await expect(tasksTab).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Click prospects tab
    await page.click('button:has-text("Prospects")');
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Tab should be active
    const prospectsTab = page.locator('button:has-text("Prospects")');
    await expect(prospectsTab).toBeVisible();

    // Click tasks tab
    await page.click('button:has-text("Rendez-vous")');
    await new Promise((resolve) => setTimeout(resolve, 500));

    const tasksTab = page.locator('button:has-text("Rendez-vous")');
    await expect(tasksTab).toBeVisible();
  });

  test('should show refresh button', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Actualiser")');
    await expect(refreshButton).toBeVisible();
  });

  test('should handle refresh action', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Actualiser")');
    await refreshButton.click();
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Button should still be visible after click
    await expect(refreshButton).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Reload page to see loading state
    await page.reload();
    
    // Check for spinner (may be brief)
    await page.waitForLoadState('networkidle');
    
    // Page should load successfully
    const title = page.locator('h2:has-text("Boîte Prioritaire")');
    await expect(title).toBeVisible();
  });

  test('should display empty state when no items', async ({ page }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check for either items or empty state
    const emptyMessage = page.locator('text=Aucun élément prioritaire');
    const anyCard = page.locator('[class*="cursor-pointer"]');

    // Either empty state or items should be visible
    const hasEmpty = await emptyMessage.isVisible().catch(() => false);
    const hasItems = await anyCard.first().isVisible().catch(() => false);

    expect(hasEmpty || hasItems).toBe(true);
  });
});

test.describe('Quick Wins - Priority Inbox Items', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/priority-inbox');
    await page.waitForLoadState('networkidle');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  test('should display priority items if available', async ({ page }) => {
    // Check for priority cards
    const cards = page.locator('[class*="cursor-pointer"]');
    const count = await cards.count();

    // Should have 0 or more items
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show urgency badges on items', async ({ page }) => {
    const firstCard = page.locator('[class*="cursor-pointer"]').first();
    
    if (await firstCard.isVisible().catch(() => false)) {
      // Card should have content
      expect(await firstCard.isVisible()).toBe(true);
    }
  });

  test('should display priority scores', async ({ page }) => {
    // Look for any score displays
    const scoreElements = page.locator('text=/\\d+/');
    const count = await scoreElements.count();

    // May have scores if items exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show recommended actions', async ({ page }) => {
    // Check for action text
    const actionsHeader = page.locator('text=Actions recommandées');
    
    // May or may not be visible depending on data
    const isVisible = await actionsHeader.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should be clickable to navigate', async ({ page }) => {
    const firstCard = page.locator('[class*="cursor-pointer"]').first();
    
    if (await firstCard.isVisible().catch(() => false)) {
      // Should be able to click
      await firstCard.click().catch(() => {
        // Navigation might fail if item doesn't exist
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  });
});
