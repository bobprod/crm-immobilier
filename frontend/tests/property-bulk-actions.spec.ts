import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000';

test.describe('Property Bulk Actions', () => {
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

    // Create test properties for bulk operations
    const testProperties = [
      {
        title: 'Bulk Test Property 1',
        type: 'apartment',
        category: 'sale',
        price: 250000,
        status: 'available',
        priority: 'medium',
      },
      {
        title: 'Bulk Test Property 2',
        type: 'house',
        category: 'sale',
        price: 350000,
        status: 'available',
        priority: 'medium',
      },
      {
        title: 'Bulk Test Property 3',
        type: 'villa',
        category: 'sale',
        price: 500000,
        status: 'available',
        priority: 'low',
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

  test('Select multiple properties', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Wait for property list to load
    await page.waitForSelector('[data-testid="property-checkbox"]', { timeout: 5000 });
    
    // Select first 2 properties
    const checkboxes = await page.$$('[data-testid="property-checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
    
    await checkboxes[0].click();
    await checkboxes[1].click();
    
    // Verify selection count
    const selectionCounter = await page.textContent('[data-testid="selection-count"]');
    expect(selectionCounter).toContain('2');
  });

  test('Bulk update status', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Select properties
    await page.waitForSelector('[data-testid="property-checkbox"]', { timeout: 5000 });
    const checkboxes = await page.$$('[data-testid="property-checkbox"]');
    
    await checkboxes[0].click();
    await checkboxes[1].click();
    
    // Open bulk actions menu
    await page.click('[data-testid="bulk-actions-menu"]');
    
    // Select "Update Status"
    await page.click('[data-testid="bulk-update-status"]');
    
    // Choose new status
    await page.selectOption('[data-testid="status-select"]', 'reserved');
    
    // Confirm
    await page.click('[data-testid="confirm-bulk-action"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 3000 });
    
    // Verify status changed (via API)
    const response = await page.request.get(`${API_URL}/properties/${testPropertyIds[0]}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    const property = await response.json();
    expect(property.status).toBe('reserved');
  });

  test('Bulk update priority', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Select properties
    await page.waitForSelector('[data-testid="property-checkbox"]', { timeout: 5000 });
    const checkboxes = await page.$$('[data-testid="property-checkbox"]');
    
    await checkboxes[0].click();
    await checkboxes[1].click();
    
    // Open bulk actions
    await page.click('[data-testid="bulk-actions-menu"]');
    await page.click('[data-testid="bulk-update-priority"]');
    
    // Set priority
    await page.selectOption('[data-testid="priority-select"]', 'high');
    await page.click('[data-testid="confirm-bulk-action"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 3000 });
  });

  test('Bulk assign properties', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Select properties
    await page.waitForSelector('[data-testid="property-checkbox"]', { timeout: 5000 });
    const checkboxes = await page.$$('[data-testid="property-checkbox"]');
    
    await checkboxes[0].click();
    await checkboxes[1].click();
    
    // Open bulk actions
    await page.click('[data-testid="bulk-actions-menu"]');
    await page.click('[data-testid="bulk-assign"]');
    
    // Select agent (assuming there's a select for this)
    await page.selectOption('[data-testid="agent-select"]', { index: 1 });
    await page.click('[data-testid="confirm-bulk-action"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="toast-success"]', { timeout: 3000 });
  });

  test('Select all properties', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Wait for list
    await page.waitForSelector('[data-testid="select-all-checkbox"]', { timeout: 5000 });
    
    // Click "Select All"
    await page.click('[data-testid="select-all-checkbox"]');
    
    // Verify all are selected
    const checkboxes = await page.$$('[data-testid="property-checkbox"]:checked');
    const totalCheckboxes = await page.$$('[data-testid="property-checkbox"]');
    
    expect(checkboxes.length).toBe(totalCheckboxes.length);
  });

  test('Deselect all properties', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Wait for list
    await page.waitForSelector('[data-testid="select-all-checkbox"]', { timeout: 5000 });
    
    // Select all
    await page.click('[data-testid="select-all-checkbox"]');
    
    // Verify all selected
    let checkedCount = (await page.$$('[data-testid="property-checkbox"]:checked')).length;
    expect(checkedCount).toBeGreaterThan(0);
    
    // Click again to deselect all
    await page.click('[data-testid="select-all-checkbox"]');
    
    // Verify none selected
    checkedCount = (await page.$$('[data-testid="property-checkbox"]:checked')).length;
    expect(checkedCount).toBe(0);
  });
});
