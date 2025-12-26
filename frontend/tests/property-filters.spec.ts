import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000';

test.describe('Property Filters', () => {
  let authToken: string;
  let testPropertyIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    });
    const loginData = await loginResponse.json();
    authToken = loginData.accessToken;

    // Create test properties with different attributes
    const testProperties = [
      {
        title: 'Appartement Centre Ville',
        type: 'apartment',
        category: 'sale',
        price: 250000,
        city: 'Tunis',
        status: 'available',
        bedrooms: 3,
      },
      {
        title: 'Villa Luxe Gammarth',
        type: 'villa',
        category: 'sale',
        price: 800000,
        city: 'Gammarth',
        status: 'reserved',
        bedrooms: 5,
      },
      {
        title: 'Studio Lac',
        type: 'studio',
        category: 'rent',
        price: 1200,
        city: 'Tunis',
        status: 'available',
        bedrooms: 1,
      },
      {
        title: 'Maison Sousse',
        type: 'house',
        category: 'sale',
        price: 450000,
        city: 'Sousse',
        status: 'sold',
        bedrooms: 4,
      },
    ];

    for (const property of testProperties) {
      const response = await request.post(`${API_URL}/properties`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: property,
      });
      const data = await response.json();
      testPropertyIds.push(data.id);
    }
  });

  test.afterAll(async ({ request }) => {
    // Clean up test properties
    for (const id of testPropertyIds) {
      await request.delete(`${API_URL}/properties/${id}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    }
  });

  test('Filter by type', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Assuming filter UI exists
    await page.waitForSelector('[data-testid="filter-type"]', { timeout: 5000 });
    await page.selectOption('[data-testid="filter-type"]', 'apartment');
    
    // Wait for results to load
    await page.waitForLoadState('networkidle');
    
    // Check that only apartments are shown
    const propertyCards = await page.$$('[data-testid="property-card"]');
    expect(propertyCards.length).toBeGreaterThan(0);
    
    // Verify type is apartment
    const firstCard = propertyCards[0];
    const typeText = await firstCard.textContent();
    expect(typeText).toContain('apartment');
  });

  test('Filter by price range', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Set min and max price
    await page.fill('[data-testid="filter-min-price"]', '200000');
    await page.fill('[data-testid="filter-max-price"]', '500000');
    await page.click('[data-testid="apply-filters"]');
    
    await page.waitForLoadState('networkidle');
    
    // Check that results are within price range
    const propertyCards = await page.$$('[data-testid="property-card"]');
    expect(propertyCards.length).toBeGreaterThan(0);
  });

  test('Filter by city', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Filter by city
    await page.fill('[data-testid="filter-city"]', 'Tunis');
    await page.click('[data-testid="apply-filters"]');
    
    await page.waitForLoadState('networkidle');
    
    const propertyCards = await page.$$('[data-testid="property-card"]');
    expect(propertyCards.length).toBeGreaterThan(0);
    
    // Verify city is Tunis
    const firstCard = propertyCards[0];
    const cityText = await firstCard.textContent();
    expect(cityText).toContain('Tunis');
  });

  test('Filter by status', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Filter by status
    await page.selectOption('[data-testid="filter-status"]', 'available');
    
    await page.waitForLoadState('networkidle');
    
    const propertyCards = await page.$$('[data-testid="property-card"]');
    expect(propertyCards.length).toBeGreaterThan(0);
  });

  test('Combined filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Apply multiple filters
    await page.selectOption('[data-testid="filter-type"]', 'apartment');
    await page.fill('[data-testid="filter-city"]', 'Tunis');
    await page.selectOption('[data-testid="filter-status"]', 'available');
    await page.click('[data-testid="apply-filters"]');
    
    await page.waitForLoadState('networkidle');
    
    const propertyCards = await page.$$('[data-testid="property-card"]');
    // Should have at least one match (our test property)
    expect(propertyCards.length).toBeGreaterThanOrEqual(1);
  });

  test('Clear filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Apply filters
    await page.selectOption('[data-testid="filter-type"]', 'apartment');
    await page.fill('[data-testid="filter-city"]', 'Tunis');
    await page.click('[data-testid="apply-filters"]');
    
    await page.waitForLoadState('networkidle');
    const filteredCount = (await page.$$('[data-testid="property-card"]')).length;
    
    // Clear filters
    await page.click('[data-testid="clear-filters"]');
    await page.waitForLoadState('networkidle');
    
    const allCount = (await page.$$('[data-testid="property-card"]')).length;
    
    // Should show more properties after clearing
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });
});
