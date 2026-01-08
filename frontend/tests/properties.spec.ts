import { test, expect } from '@playwright/test';

test.describe('PropertyList Component', () => {
    test.beforeEach(async ({ page }) => {
        // Mock authentication - use auth_token to match backend-api.ts
        await page.addInitScript(() => {
            localStorage.setItem('auth_token', 'test-token');
            localStorage.setItem('refresh_token', 'test-refresh-token');
            localStorage.setItem('user', JSON.stringify({
                id: '1',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'admin'
            }));
        });

        // Mock API response for backend /api/properties endpoint
        await page.route('**/api/properties', async route => {
            const url = route.request().url();

            if (url.includes('loading=true')) {
                // Simulate indefinite loading state - never resolve
                await new Promise(() => { });
            } else if (url.includes('error=true')) {
                // Simulate error state
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Failed to fetch properties' }),
                });
            } else {
                // Default success response - use correct API structure
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        data: [
                            {
                                id: '1',
                                userId: 'test-user-id',
                                title: 'Property 1',
                                type: 'house',
                                category: 'sale',
                                price: 100000,
                                currency: 'TND',
                                city: 'Test City 1',
                                bedrooms: 3,
                                bathrooms: 2,
                                area: 150,
                                status: 'available',
                                priority: 'high',
                                viewsCount: 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            },
                            {
                                id: '2',
                                userId: 'test-user-id',
                                title: 'Property 2',
                                type: 'apartment',
                                category: 'rent',
                                price: 200000,
                                currency: 'TND',
                                city: 'Test City 2',
                                bedrooms: 2,
                                bathrooms: 1,
                                area: 100,
                                status: 'available',
                                priority: 'medium',
                                viewsCount: 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            },
                            {
                                id: '3',
                                userId: 'test-user-id',
                                title: 'Property 3',
                                type: 'villa',
                                category: 'sale',
                                price: 300000,
                                currency: 'TND',
                                city: 'Test City 3',
                                bedrooms: 5,
                                bathrooms: 3,
                                area: 250,
                                status: 'sold',
                                priority: 'low',
                                viewsCount: 0,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString()
                            },
                        ],
                        meta: {
                            total: 3,
                            page: 1,
                            limit: 10,
                            totalPages: 1
                        }
                    }),
                });
            }
        });
    });

    test('should render properties list', async ({ page }) => {
        // Navigate to properties page in test mode
        await page.goto('/properties?testMode=true');

        // Wait for the table to be visible with a longer timeout
        await page.waitForSelector('[data-testid="properties-table"]', {
            state: 'visible',
            timeout: 10000
        });

        // Verify table is visible
        const table = page.locator('[data-testid="properties-table"]');
        await expect(table).toBeVisible();

        // Verify we have the correct number of rows
        const tbody = page.locator('[data-testid="properties-tbody"]');
        const rows = tbody.locator('tr');
        await expect(rows).toHaveCount(3);

        // Verify first row contains correct data
        await expect(rows.first()).toContainText('Property 1');
    });

    test('should display loading state', async ({ page }) => {
        // Navigate with loading parameter
        await page.goto('/properties?loading=true&testMode=true');

        // Wait for loading state to appear
        await page.waitForSelector('[data-testid="loading-state"]', {
            state: 'visible',
            timeout: 20000
        });

        const loading = page.locator('[data-testid="loading-state"]');
        await expect(loading).toBeVisible();
        await expect(loading).toContainText('Loading properties...');
    });

    test('should display error message', async ({ page }) => {
        // Navigate with error parameter
        await page.goto('/properties?error=true&testMode=true');

        // Wait for error state to appear
        await page.waitForSelector('[data-testid="error-state"]', {
            state: 'visible',
            timeout: 20000
        });

        const error = page.locator('[data-testid="error-state"]');
        await expect(error).toBeVisible();
        await expect(error).toContainText('Failed to fetch properties');
    });
});
