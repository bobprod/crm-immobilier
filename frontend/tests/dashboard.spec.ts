import { test, expect } from '@playwright/test';

test.describe('Dashboard Pages', () => {
    test.beforeEach(async ({ page }) => {
        // Mock authentication for dashboard access
        await page.addInitScript(() => {
            localStorage.setItem('auth_token', 'test-token');
            localStorage.setItem('user', JSON.stringify({
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'admin'
            }));
        });
    });

    test('should load dashboard page', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Check if dashboard loads
        await expect(page).toHaveURL(/.*dashboard/);

        // Check for main dashboard elements
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('Tableau de bord');
    });

    test('should load properties page', async ({ page }) => {
        await page.goto('/properties');
        await page.waitForLoadState('networkidle');

        // Check if properties page loads
        await expect(page).toHaveURL(/.*properties/);

        // Check for properties page content
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('Properties');
    });

    test('should load prospects page', async ({ page }) => {
        await page.goto('/prospects');
        await page.waitForLoadState('networkidle');

        // Check if prospects page loads
        await expect(page).toHaveURL(/.*prospects/);

        // Check for prospects page content
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('Prospects');
    });

    test('should load appointments page', async ({ page }) => {
        await page.goto('/appointments');
        await page.waitForLoadState('networkidle');

        // Check if appointments page loads
        await expect(page).toHaveURL(/.*appointments/);

        // Check for appointments page content
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('Rendez-vous');
    });

    test('should load analytics page', async ({ page }) => {
        await page.goto('/analytics');
        await page.waitForLoadState('networkidle');

        // Check if analytics page loads
        await expect(page).toHaveURL(/.*analytics/);

        // Check for analytics page content
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('Analytics');
    });

    test('should load settings page', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        // Check if settings page loads
        await expect(page).toHaveURL(/.*settings/);

        // Check for settings page content
        const pageContent = await page.textContent('body');
        expect(pageContent).toContain('Paramètres');
    });

    test('should navigate between dashboard pages using sidebar', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Click on Properties link in sidebar
        await page.click('text=Propriétés');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*properties/);

        // Click on Prospects link in sidebar
        await page.click('text=Prospects');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*prospects/);

        // Click on Dashboard link in sidebar
        await page.click('text=Tableau de bord');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should handle mobile menu toggle', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Check if mobile menu button exists
        const menuButton = page.locator('button').filter({ hasText: '' }).first();
        await expect(menuButton).toBeVisible();

        // Click menu button to open sidebar
        await menuButton.click();

        // Sidebar should be visible
        const sidebar = page.locator('div').filter({ hasText: 'CRM Immobilier' }).first();
        await expect(sidebar).toBeVisible();
    });
});
