import { test, expect } from '@playwright/test';

test.describe('Quick Wins - Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quick-wins-demo');
    await page.waitForLoadState('networkidle');
  });

  test('should display demo page title', async ({ page }) => {
    const title = page.locator('h1:has-text("Quick Wins Modules - Demo")');
    await expect(title).toBeVisible();
  });

  test('should display description', async ({ page }) => {
    const description = page.locator('text=Démonstration des nouveaux modules');
    await expect(description).toBeVisible();
  });

  test('should show all three tabs', async ({ page }) => {
    const searchTab = page.locator('button:has-text("Recherche Sémantique")');
    const formsTab = page.locator('button:has-text("Smart Forms")');
    const infoTab = page.locator('button:has-text("Informations")');

    await expect(searchTab).toBeVisible();
    await expect(formsTab).toBeVisible();
    await expect(infoTab).toBeVisible();
  });

  test('should start on search tab', async ({ page }) => {
    // Semantic search should be visible by default
    const searchTitle = page.locator('text=🔍 Recherche Sémantique');
    await expect(searchTitle).toBeVisible();
  });

  test('should switch to forms tab', async ({ page }) => {
    await page.click('button:has-text("Smart Forms")');
    await page.waitForTimeout(500);

    const formsTitle = page.locator('text=📝 Smart Forms Auto-Fill');
    await expect(formsTitle).toBeVisible();
  });

  test('should switch to info tab', async ({ page }) => {
    await page.click('button:has-text("Informations")');
    await page.waitForTimeout(500);

    const infoTitle = page.locator('text=📊 Modules Disponibles');
    await expect(infoTitle).toBeVisible();
  });

  test('should display module status on info tab', async ({ page }) => {
    await page.click('button:has-text("Informations")');
    await page.waitForTimeout(500);

    // Check for module names
    const smartForms = page.locator('text=Smart Forms Auto-Fill');
    const semanticSearch = page.locator('text=Recherche Sémantique');
    const priorityInbox = page.locator('text=Priority Inbox');
    const autoReports = page.locator('text=Auto-Reports');

    await expect(smartForms).toBeVisible();
    await expect(semanticSearch).toBeVisible();
    await expect(priorityInbox).toBeVisible();
    await expect(autoReports).toBeVisible();
  });

  test('should show active badges for all modules', async ({ page }) => {
    await page.click('button:has-text("Informations")');
    await page.waitForTimeout(500);

    // Check for "Actif" badges
    const badges = page.locator('text=Actif');
    const count = await badges.count();

    expect(count).toBeGreaterThanOrEqual(4); // All 4 modules should be active
  });

  test('should display page links on info tab', async ({ page }) => {
    await page.click('button:has-text("Informations")');
    await page.waitForTimeout(500);

    const priorityInboxLink = page.locator('a:has-text("/priority-inbox")');
    const reportsLink = page.locator('a:has-text("/reports")');

    await expect(priorityInboxLink).toBeVisible();
    await expect(reportsLink).toBeVisible();
  });

  test('should display ROI statistics', async ({ page }) => {
    await page.click('button:has-text("Informations")');
    await page.waitForTimeout(500);

    // Check for ROI numbers
    const timesSaved = page.locator('text=77.5h');
    const cost = page.locator('text=4.80€');
    const roi = page.locator('text=16,146%');
    const multiplier = page.locator('text=161x');

    await expect(timesSaved).toBeVisible();
    await expect(cost).toBeVisible();
    await expect(roi).toBeVisible();
    await expect(multiplier).toBeVisible();
  });

  test('should navigate between tabs smoothly', async ({ page }) => {
    // Navigate through all tabs
    await page.click('button:has-text("Smart Forms")');
    await page.waitForTimeout(300);
    
    await page.click('button:has-text("Informations")');
    await page.waitForTimeout(300);
    
    await page.click('button:has-text("Recherche Sémantique")');
    await page.waitForTimeout(300);

    // Should end up on search tab
    const searchTitle = page.locator('text=🔍 Recherche Sémantique');
    await expect(searchTitle).toBeVisible();
  });

  test('should display search examples', async ({ page }) => {
    // Should be on search tab by default
    const examples = page.locator('ul:has(text("appartement vue mer pas cher"))');
    await expect(examples).toBeVisible();
  });

  test('should show form examples with labels', async ({ page }) => {
    await page.click('button:has-text("Smart Forms")');
    await page.waitForTimeout(500);

    const cityLabel = page.locator('label:has-text("Ville")');
    const firstNameLabel = page.locator('label:has-text("Prénom")');

    await expect(cityLabel).toBeVisible();
    await expect(firstNameLabel).toBeVisible();
  });

  test('should display helpful tip', async ({ page }) => {
    await page.click('button:has-text("Smart Forms")');
    await page.waitForTimeout(500);

    const tip = page.locator('text=💡');
    await expect(tip).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test at different viewport sizes
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(500);

    const title = page.locator('h1:has-text("Quick Wins Modules")');
    await expect(title).toBeVisible();

    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.waitForTimeout(500);

    await expect(title).toBeVisible();
  });
});

test.describe('Quick Wins - Demo Page Navigation', () => {
  test('should have working page links', async ({ page }) => {
    await page.goto('/quick-wins-demo');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Informations")');
    await page.waitForTimeout(500);

    // Click priority inbox link
    const priorityLink = page.locator('a:has-text("/priority-inbox")');
    await priorityLink.click();
    await page.waitForTimeout(1000);

    // Should navigate to priority inbox page
    await expect(page).toHaveURL(/.*priority-inbox/);
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/quick-wins-demo');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Informations")');
    await page.waitForTimeout(500);

    // Click reports link
    const reportsLink = page.locator('a:has-text("/reports")');
    await reportsLink.click();
    await page.waitForTimeout(1000);

    // Should navigate to reports page
    await expect(page).toHaveURL(/.*reports/);
  });
});
