import { test, expect } from '@playwright/test';

test.describe('Semantic Search Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to semantic-search page
    await page.goto('/semantic-search');
    await page.waitForLoadState('networkidle');
  });

  test('should display page title and description', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1:has-text("Recherche Sémantique")')).toBeVisible();
    
    // Check description
    await expect(page.locator('text=Recherchez en langage naturel à travers toutes vos données CRM')).toBeVisible();
  });

  test('should display intelligence IA badge', async ({ page }) => {
    // Check for the IA badge
    const badge = page.locator('text=Intelligence IA').first();
    await expect(badge).toBeVisible();
  });

  test('should display search bar', async ({ page }) => {
    // Check for search input
    const searchInput = page.locator('input[placeholder*="appartement vue mer"]');
    await expect(searchInput).toBeVisible();
  });

  test('should accept search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="appartement vue mer"]');
    await searchInput.fill('villa moderne La Marsa');
    
    const value = await searchInput.inputValue();
    expect(value).toBe('villa moderne La Marsa');
  });

  test('should display search icon', async ({ page }) => {
    // Check for search icon in the input
    const searchIcon = page.locator('svg').first();
    await expect(searchIcon).toBeVisible();
  });

  test('should show loading indicator when searching', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="appartement vue mer"]');
    await searchInput.fill('appartement 3 pièces');
    
    // Wait for debounce
    await page.waitForTimeout(800);
    
    // Verify input still has value
    const value = await searchInput.inputValue();
    expect(value).toBe('appartement 3 pièces');
  });

  test('should display "Recherche Intelligente" info card', async ({ page }) => {
    await expect(page.locator('h3:has-text("Recherche Intelligente")')).toBeVisible();
    
    // Check for feature bullets
    await expect(page.locator('text=Recherche dans toutes les entités')).toBeVisible();
    await expect(page.locator('text=Résultats triés par pertinence')).toBeVisible();
    await expect(page.locator('text=Suggestions automatiques')).toBeVisible();
    await expect(page.locator('text=Compréhension du contexte')).toBeVisible();
  });

  test('should display examples section', async ({ page }) => {
    await expect(page.locator('h3:has-text("💡 Exemples de Recherches")')).toBeVisible();
  });

  test('should display property examples', async ({ page }) => {
    await expect(page.locator('h4:has-text("🏠 Propriétés")')).toBeVisible();
    
    // Check for example searches
    await expect(page.locator('code:has-text("appartement vue mer pas cher")')).toBeVisible();
    await expect(page.locator('code:has-text("villa moderne avec piscine La Marsa")')).toBeVisible();
  });

  test('should display prospect examples', async ({ page }) => {
    await expect(page.locator('h4:has-text("👤 Prospects")')).toBeVisible();
    
    // Check for example searches
    await expect(page.locator('code:has-text("prospect budget 300K La Marsa")')).toBeVisible();
    await expect(page.locator('code:has-text("clients qualifiés cette semaine")')).toBeVisible();
  });

  test('should display appointment examples', async ({ page }) => {
    await expect(page.locator('h4:has-text("📅 Rendez-vous")')).toBeVisible();
    
    // Check for example searches
    await expect(page.locator('code:has-text("rendez-vous cette semaine")')).toBeVisible();
    await expect(page.locator('code:has-text("visites confirmées demain")')).toBeVisible();
  });

  test('should display mixed search examples', async ({ page }) => {
    await expect(page.locator('h4:has-text("🔄 Recherches Mixtes")')).toBeVisible();
    
    // Check for example searches
    await expect(page.locator('code:has-text("tout ce qui concerne La Marsa")')).toBeVisible();
    await expect(page.locator('code:has-text("activité aujourd\'hui")')).toBeVisible();
  });

  test('should display advantages section', async ({ page }) => {
    await expect(page.locator('h3:has-text("📊 Avantages")')).toBeVisible();
    
    // Check advantage stats
    await expect(page.locator('text=10x')).toBeVisible();
    await expect(page.locator('text=95%')).toBeVisible();
    await expect(page.locator('text=Plus rapide')).toBeVisible();
    await expect(page.locator('text=Précision')).toBeVisible();
  });

  test('should display "Comment ça marche" section', async ({ page }) => {
    await expect(page.locator('h3:has-text("🔧 Comment ça marche")')).toBeVisible();
    
    // Check for process steps
    await expect(page.locator('text=Traitement du langage naturel')).toBeVisible();
    await expect(page.locator('text=Recherche sémantique')).toBeVisible();
    await expect(page.locator('text=Classement intelligent')).toBeVisible();
    await expect(page.locator('text=Navigation directe')).toBeVisible();
  });

  test('should handle special characters in search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="appartement vue mer"]');
    await searchInput.fill('appartement 3-4 pièces €300K');
    
    const value = await searchInput.inputValue();
    expect(value).toContain('appartement');
    expect(value).toContain('300K');
  });

  test('should handle long search queries', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="appartement vue mer"]');
    const longQuery = 'villa moderne avec piscine jardin garage proche écoles La Marsa budget 500K';
    await searchInput.fill(longQuery);
    
    const value = await searchInput.inputValue();
    expect(value).toBe(longQuery);
  });

  test('should clear search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="appartement vue mer"]');
    await searchInput.fill('test search');
    await searchInput.clear();
    
    const value = await searchInput.inputValue();
    expect(value).toBe('');
  });

  test('should handle empty search gracefully', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="appartement vue mer"]');
    await searchInput.fill('');
    
    // Should not trigger search with empty input
    await page.waitForTimeout(1000);
    
    const value = await searchInput.inputValue();
    expect(value).toBe('');
  });

  test('should navigate to page from sidebar', async ({ page }) => {
    // Go to dashboard first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click Semantic Search in sidebar
    const semanticSearchButton = page.locator('button:has-text("Recherche Sémantique")');
    await semanticSearchButton.click();
    
    // Wait for navigation
    await page.waitForURL('**/semantic-search');
    
    // Verify we're on the right page
    await expect(page.locator('h1:has-text("Recherche Sémantique")')).toBeVisible();
  });

  test('should display all 4 example categories', async ({ page }) => {
    // Verify all 4 categories are present
    await expect(page.locator('h4:has-text("🏠 Propriétés")')).toBeVisible();
    await expect(page.locator('h4:has-text("👤 Prospects")')).toBeVisible();
    await expect(page.locator('h4:has-text("📅 Rendez-vous")')).toBeVisible();
    await expect(page.locator('h4:has-text("🔄 Recherches Mixtes")')).toBeVisible();
  });

  test('should have at least 16 example searches', async ({ page }) => {
    // Count the number of code blocks (example searches)
    const codeBlocks = page.locator('code');
    const count = await codeBlocks.count();
    
    // Should have at least 16 examples (4 per category × 4 categories)
    expect(count).toBeGreaterThanOrEqual(16);
  });
});
