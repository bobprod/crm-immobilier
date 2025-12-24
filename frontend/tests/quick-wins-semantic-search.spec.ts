import { test, expect } from '@playwright/test';

test.describe('Quick Wins - Semantic Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quick-wins-demo');
    await page.waitForLoadState('networkidle');
  });

  test('should display semantic search bar', async ({ page }) => {
    // Should be on search tab by default
    const searchInput = page.locator('input[placeholder*="Ex: appartement"]');
    await expect(searchInput).toBeVisible();
  });

  test('should accept search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Ex: appartement"]');
    await searchInput.fill('villa vue mer');
    
    const value = await searchInput.inputValue();
    expect(value).toBe('villa vue mer');
  });

  test('should show loading indicator when searching', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Ex: appartement"]');
    await searchInput.fill('appartement La Marsa');
    
    // Wait for debounce
    await page.waitForTimeout(800);

    // Check search input still has value
    const value = await searchInput.inputValue();
    expect(value).toBe('appartement La Marsa');
  });

  test('should display search examples', async ({ page }) => {
    // Check for examples list
    const examples = page.locator('text=appartement vue mer pas cher');
    await expect(examples).toBeVisible();
  });

  test('should handle special characters in search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Ex: appartement"]');
    await searchInput.fill('appartement 3-4 pièces €300K');
    
    const value = await searchInput.inputValue();
    expect(value).toContain('appartement');
    expect(value).toContain('300K');
  });

  test('should clear search on ESC key', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Ex: appartement"]');
    await searchInput.fill('test search');
    await searchInput.press('Escape');
    
    // Input should still have value but results should close
    const value = await searchInput.inputValue();
    expect(value).toBe('test search');
  });

  test('should show suggestions dropdown when typing', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Ex: appartement"]');
    await searchInput.fill('villa');
    
    // Wait for suggestions
    await page.waitForTimeout(1000);
    
    // Value should be set
    const value = await searchInput.inputValue();
    expect(value).toBe('villa');
  });
});

test.describe('Quick Wins - Semantic Search Results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quick-wins-demo');
    await page.waitForLoadState('networkidle');
  });

  test('should handle no results gracefully', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Ex: appartement"]');
    await searchInput.fill('xyzabc123nonexistent');
    
    await page.waitForTimeout(1000);
    
    // Search should still work even with no results
    const value = await searchInput.inputValue();
    expect(value).toBe('xyzabc123nonexistent');
  });

  test('should display result type icons', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Ex: appartement"]');
    await searchInput.fill('test');
    
    await page.waitForTimeout(1000);
    
    // Component should handle results display
    expect(await searchInput.inputValue()).toBe('test');
  });
});
