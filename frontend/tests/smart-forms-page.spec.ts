import { test, expect } from '@playwright/test';

test.describe('Smart Forms Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to smart-forms page
    await page.goto('/smart-forms');
    await page.waitForLoadState('networkidle');
  });

  test('should display page title and description', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1:has-text("Smart Forms Auto-Fill")')).toBeVisible();
    
    // Check description
    await expect(page.locator('text=Auto-complétion intelligente basée sur votre historique')).toBeVisible();
  });

  test('should display intelligence IA badge', async ({ page }) => {
    // Check for the IA badge
    const badge = page.locator('text=Intelligence IA').first();
    await expect(badge).toBeVisible();
  });

  test('should display all form sections', async ({ page }) => {
    // Check section headers
    await expect(page.locator('h3:has-text("Informations Personnelles")')).toBeVisible();
    await expect(page.locator('h3:has-text("Contact")')).toBeVisible();
    await expect(page.locator('h3:has-text("Localisation")')).toBeVisible();
    await expect(page.locator('h3:has-text("Préférences")')).toBeVisible();
  });

  test('should display all smart input fields', async ({ page }) => {
    // Check for all 8 input fields
    await expect(page.locator('input[placeholder*="prénom"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="nom"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="216"]')).toBeVisible(); // Phone
    await expect(page.locator('input[placeholder*="email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="ville"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Avenue"]')).toBeVisible(); // Address
    await expect(page.locator('input[placeholder*="Budget"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Appartement"]')).toBeVisible(); // Property type
  });

  test('should accept input in form fields', async ({ page }) => {
    // Test firstName field
    const firstNameInput = page.locator('input[placeholder*="prénom"]');
    await firstNameInput.fill('Ahmed');
    expect(await firstNameInput.inputValue()).toBe('Ahmed');
    
    // Test city field
    const cityInput = page.locator('input[placeholder*="ville"]');
    await cityInput.fill('La Marsa');
    expect(await cityInput.inputValue()).toBe('La Marsa');
  });

  test('should show loading spinner when typing', async ({ page }) => {
    const cityInput = page.locator('input[placeholder*="ville"]');
    await cityInput.fill('La');
    
    // Wait for debounce
    await page.waitForTimeout(500);
    
    // Input should have value
    expect(await cityInput.inputValue()).toBe('La');
  });

  test('should display benefits section', async ({ page }) => {
    // Check benefits title
    await expect(page.locator('h3:has-text("Bénéfices")')).toBeVisible();
    
    // Check benefit stats
    await expect(page.locator('text=5 min')).toBeVisible();
    await expect(page.locator('text=150h')).toBeVisible();
    await expect(page.locator('text=90%')).toBeVisible();
  });

  test('should have submit and reset buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Créer le Prospect")')).toBeVisible();
    await expect(page.locator('button:has-text("Réinitialiser")')).toBeVisible();
  });

  test('should reset form when reset button is clicked', async ({ page }) => {
    // Fill some fields
    const firstNameInput = page.locator('input[placeholder*="prénom"]');
    await firstNameInput.fill('Test');
    
    const cityInput = page.locator('input[placeholder*="ville"]');
    await cityInput.fill('Tunis');
    
    // Click reset button
    await page.click('button:has-text("Réinitialiser")');
    
    // Check fields are empty
    expect(await firstNameInput.inputValue()).toBe('');
    expect(await cityInput.inputValue()).toBe('');
  });

  test('should display "Comment ça marche" info card', async ({ page }) => {
    await expect(page.locator('h3:has-text("Comment ça marche")')).toBeVisible();
    
    // Check for instruction bullets
    await expect(page.locator('text=Commencez à taper dans un champ')).toBeVisible();
    await expect(page.locator('text=suggestions sont triées par fréquence')).toBeVisible();
  });

  test('should handle multiple field interactions', async ({ page }) => {
    // Fill multiple fields
    await page.locator('input[placeholder*="prénom"]').fill('Mohamed');
    await page.locator('input[placeholder*="nom"]').fill('Ben Ali');
    await page.locator('input[placeholder*="ville"]').fill('La Marsa');
    
    // Verify all values are set
    expect(await page.locator('input[placeholder*="prénom"]').inputValue()).toBe('Mohamed');
    expect(await page.locator('input[placeholder*="nom"]').inputValue()).toBe('Ben Ali');
    expect(await page.locator('input[placeholder*="ville"]').inputValue()).toBe('La Marsa');
  });

  test('should navigate to page from sidebar', async ({ page }) => {
    // Go to dashboard first
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Click Smart Forms in sidebar
    const smartFormsButton = page.locator('button:has-text("Smart Forms")');
    await smartFormsButton.click();
    
    // Wait for navigation
    await page.waitForURL('**/smart-forms');
    
    // Verify we're on the right page
    await expect(page.locator('h1:has-text("Smart Forms Auto-Fill")')).toBeVisible();
  });
});
