import { test, expect } from '@playwright/test';

test.describe('Property Modal Create/Update E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Mock authentication
        await page.addInitScript(() => {
            localStorage.setItem('access_token', 'test-token-for-e2e');
            localStorage.setItem('user', JSON.stringify({
                id: 'user123',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'admin'
            }));
        });
    });

    test.describe('Create Property Modal', () => {
        test.beforeEach(async ({ page }) => {
            // Mock API endpoints
            await page.route('**/api/properties', async route => {
                const method = route.request().method();

                if (method === 'GET') {
                    // Return empty list initially
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify([]),
                    });
                } else if (method === 'POST') {
                    // Mock successful creation
                    const postData = route.request().postDataJSON();
                    await route.fulfill({
                        status: 201,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            id: 'new-property-id-123',
                            ...postData,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            status: 'available',
                        }),
                    });
                }
            });
        });

        test('should open create property modal when clicking "Nouvelle Propriété" button', async ({ page }) => {
            await page.goto('/properties');

            // Wait for page to load
            await page.waitForLoadState('networkidle');

            // Click on "Nouvelle Propriété" button
            const createButton = page.locator('[data-testid="create-property-button"]');
            await expect(createButton).toBeVisible();
            await createButton.click();

            // Check modal is open
            const modal = page.locator('[role="dialog"]');
            await expect(modal).toBeVisible();

            // Check modal title
            await expect(page.locator('text=Nouvelle propriété')).toBeVisible();
        });

        test('should validate required fields in create modal', async ({ page }) => {
            await page.goto('/properties');
            await page.waitForLoadState('networkidle');

            // Open modal
            await page.locator('[data-testid="create-property-button"]').click();
            await expect(page.locator('[role="dialog"]')).toBeVisible();

            // Try to submit without filling required fields
            await page.locator('[data-testid="property-submit-button"]').click();

            // Check validation errors
            await expect(page.locator('text=Le titre est requis')).toBeVisible();
            await expect(page.locator('text=Le prix doit être supérieur à 0')).toBeVisible();
        });

        test('should successfully create a property through modal', async ({ page }) => {
            await page.goto('/properties');
            await page.waitForLoadState('networkidle');

            // Open modal
            await page.locator('[data-testid="create-property-button"]').click();
            await expect(page.locator('[role="dialog"]')).toBeVisible();

            // Fill in the form
            await page.locator('[data-testid="property-title-input"]').fill('Appartement Test E2E');
            await page.locator('[data-testid="property-price-input"]').fill('250000');
            await page.locator('[data-testid="property-area-input"]').fill('120');
            await page.locator('[data-testid="property-rooms-input"]').fill('4');
            await page.locator('[data-testid="property-bedrooms-input"]').fill('2');
            await page.locator('[data-testid="property-bathrooms-input"]').fill('1');
            await page.locator('[data-testid="property-city-input"]').fill('Tunis');
            await page.locator('[data-testid="property-address-input"]').fill('123 Avenue Habib Bourguiba');
            await page.locator('[data-testid="property-description-input"]').fill('Magnifique appartement de test');

            // Select type
            await page.locator('[data-testid="property-type-select"]').click();
            await page.locator('[role="option"]:has-text("Appartement")').click();

            // Select priority
            await page.locator('[data-testid="property-priority-select"]').click();
            await page.locator('[role="option"]:has-text("Haute")').click();

            // Submit the form
            await page.locator('[data-testid="property-submit-button"]').click();

            // Modal should close after successful creation
            await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
        });

        test('should close modal when clicking Cancel', async ({ page }) => {
            await page.goto('/properties');
            await page.waitForLoadState('networkidle');

            // Open modal
            await page.locator('[data-testid="create-property-button"]').click();
            await expect(page.locator('[role="dialog"]')).toBeVisible();

            // Click cancel
            await page.locator('button:has-text("Annuler")').click();

            // Modal should close
            await expect(page.locator('[role="dialog"]')).not.toBeVisible();
        });
    });

    test.describe('Update Property Modal', () => {
        const existingProperty = {
            id: 'existing-prop-456',
            title: 'Propriété Existante',
            type: 'house',
            price: 350000,
            area: 200,
            surface: 200,
            rooms: 5,
            bedrooms: 3,
            bathrooms: 2,
            address: '456 Rue de Test',
            city: 'Sousse',
            priority: 'medium',
            status: 'available',
            description: 'Description existante',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
        };

        test.beforeEach(async ({ page }) => {
            // Mock API endpoints for update tests
            await page.route('**/api/properties', async route => {
                const method = route.request().method();

                if (method === 'GET') {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify([existingProperty]),
                    });
                }
            });

            await page.route(`**/api/properties/${existingProperty.id}`, async route => {
                const method = route.request().method();

                if (method === 'PUT' || method === 'PATCH') {
                    const postData = route.request().postDataJSON();
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            ...existingProperty,
                            ...postData,
                            updatedAt: new Date().toISOString(),
                        }),
                    });
                } else if (method === 'GET') {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify(existingProperty),
                    });
                }
            });
        });

        test('should open edit modal with pre-filled data when clicking edit button', async ({ page }) => {
            await page.goto('/properties');
            await page.waitForLoadState('networkidle');

            // Wait for property to appear in the list
            await expect(page.locator(`text=${existingProperty.title}`)).toBeVisible({ timeout: 10000 });

            // Click edit button for the property
            const editButton = page.locator(`[data-testid="edit-property-${existingProperty.id}"]`);
            await expect(editButton).toBeVisible();
            await editButton.click();

            // Check modal is open with edit title
            await expect(page.locator('text=Modifier la propriété')).toBeVisible();

            // Check that form is pre-filled with existing data
            const titleInput = page.locator('[data-testid="property-title-input"]');
            await expect(titleInput).toHaveValue(existingProperty.title);

            const priceInput = page.locator('[data-testid="property-price-input"]');
            await expect(priceInput).toHaveValue(String(existingProperty.price));

            const cityInput = page.locator('[data-testid="property-city-input"]');
            await expect(cityInput).toHaveValue(existingProperty.city);
        });

        test('should successfully update a property through modal', async ({ page }) => {
            await page.goto('/properties');
            await page.waitForLoadState('networkidle');

            // Wait for property and click edit
            await expect(page.locator(`text=${existingProperty.title}`)).toBeVisible({ timeout: 10000 });
            await page.locator(`[data-testid="edit-property-${existingProperty.id}"]`).click();

            // Wait for modal to open
            await expect(page.locator('text=Modifier la propriété')).toBeVisible();

            // Update the title
            const titleInput = page.locator('[data-testid="property-title-input"]');
            await titleInput.clear();
            await titleInput.fill('Propriété Modifiée E2E');

            // Update the price
            const priceInput = page.locator('[data-testid="property-price-input"]');
            await priceInput.clear();
            await priceInput.fill('400000');

            // Submit the form
            await page.locator('[data-testid="property-submit-button"]').click();

            // Modal should close after successful update
            await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });
        });

        test('should preserve data when canceling edit', async ({ page }) => {
            await page.goto('/properties');
            await page.waitForLoadState('networkidle');

            // Wait for property and click edit
            await expect(page.locator(`text=${existingProperty.title}`)).toBeVisible({ timeout: 10000 });
            await page.locator(`[data-testid="edit-property-${existingProperty.id}"]`).click();

            // Wait for modal
            await expect(page.locator('text=Modifier la propriété')).toBeVisible();

            // Modify the title but don't submit
            const titleInput = page.locator('[data-testid="property-title-input"]');
            await titleInput.clear();
            await titleInput.fill('Modification Non Sauvegardée');

            // Cancel
            await page.locator('button:has-text("Annuler")').click();

            // Modal should close
            await expect(page.locator('[role="dialog"]')).not.toBeVisible();

            // Original title should still be in the list
            await expect(page.locator(`text=${existingProperty.title}`)).toBeVisible();
        });
    });

    test.describe('Modal UI/UX', () => {
        test.beforeEach(async ({ page }) => {
            await page.route('**/api/properties', async route => {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([]),
                });
            });
        });

        test('should close modal when clicking outside', async ({ page }) => {
            await page.goto('/properties');
            await page.waitForLoadState('networkidle');

            // Open modal
            await page.locator('[data-testid="create-property-button"]').click();
            await expect(page.locator('[role="dialog"]')).toBeVisible();

            // Click outside the modal (on the overlay)
            await page.locator('[role="dialog"]').locator('..').click({ position: { x: 0, y: 0 } });

            // Modal should close
            await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 });
        });

        test('should close modal when pressing Escape key', async ({ page }) => {
            await page.goto('/properties');
            await page.waitForLoadState('networkidle');

            // Open modal
            await page.locator('[data-testid="create-property-button"]').click();
            await expect(page.locator('[role="dialog"]')).toBeVisible();

            // Press Escape
            await page.keyboard.press('Escape');

            // Modal should close
            await expect(page.locator('[role="dialog"]')).not.toBeVisible();
        });

        test('should show loading state during form submission', async ({ page }) => {
            // Mock slow API response
            await page.route('**/api/properties', async route => {
                const method = route.request().method();

                if (method === 'POST') {
                    // Delay response to see loading state
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    const postData = route.request().postDataJSON();
                    await route.fulfill({
                        status: 201,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            id: 'test-id',
                            ...postData,
                        }),
                    });
                } else {
                    await route.fulfill({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify([]),
                    });
                }
            });

            await page.goto('/properties');
            await page.waitForLoadState('networkidle');

            // Open modal and fill required fields
            await page.locator('[data-testid="create-property-button"]').click();
            await page.locator('[data-testid="property-title-input"]').fill('Test Property');
            await page.locator('[data-testid="property-price-input"]').fill('100000');

            // Submit
            await page.locator('[data-testid="property-submit-button"]').click();

            // Check for loading state (button should show loading text)
            await expect(page.locator('text=Création...')).toBeVisible();
        });
    });
});
