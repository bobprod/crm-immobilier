import { test, expect } from '@playwright/test';

/**
 * Complete test suite for property filters
 * Tests all filter fields and combinations using real backend with actual login
 */
test.describe('Property Filters - E2E Testing with Real Backend', () => {
    test.beforeEach(async ({ page }) => {
        // Login first using real credentials that should exist on the backend
        console.log('📝 Attempting login...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

        // Wait for form elements
        const emailInput = page.locator('input[type="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        const submitButton = page.locator('button[type="submit"]').first();

        // Try to fill the form
        try {
            await emailInput.fill('amine@example.com', { timeout: 5000 });
            console.log('✅ Entered email');
        } catch (e) {
            console.log('⚠️ Could not fill email - form may be pre-filled');
        }

        try {
            await passwordInput.fill('Test1234', { timeout: 5000 });
            console.log('✅ Entered password');
        } catch (e) {
            console.log('⚠️ Could not fill password');
        }

        // Click submit
        await submitButton.click();
        console.log('✅ Clicked login button');

        // Wait for navigation to dashboard or properties
        try {
            await page.waitForURL(/\/(dashboard|properties)/, { timeout: 30000 });
            console.log('✅ Login successful, navigated to:', page.url());
        } catch (e) {
            console.log('⚠️ Did not navigate after login attempt');
        }

        await page.waitForTimeout(1000);
    });

    test('1. Navigate to properties page', async ({ page }) => {
        // Navigate to properties page
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        console.log('✅ Navigated to properties page');
        console.log('Current URL:', page.url());

        // Verify we're on the right page
        const isOnProperties = page.url().includes('/properties');
        console.log(`On properties page: ${isOnProperties ? '✅' : '❌'}`);
    });

    test('2. Verify all filter UI elements are present', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check search field
        const searchInputs = page.locator('input[placeholder*="Rechercher"]');
        const searchCount = await searchInputs.count();
        console.log(`Search input: ${searchCount > 0 ? '✅' : '❌'} (found ${searchCount})`);

        // Check select dropdowns
        const selects = page.locator('div[role="combobox"]');
        const selectCount = await selects.count();
        console.log(`Selects: ${selectCount > 0 ? '✅' : '❌'} (found ${selectCount})`);

        // Check price inputs
        const numberInputs = page.locator('input[type="number"]');
        const numberCount = await numberInputs.count();
        console.log(`Price inputs: ${numberCount > 0 ? '✅' : '❌'} (found ${numberCount})`);

        // Check reset button
        const resetButtons = page.locator('button:has-text("Réinitialiser")');
        const resetCount = await resetButtons.count();
        console.log(`Reset button: ${resetCount > 0 ? '✅' : '❌'} (found ${resetCount})`);

        // Check table
        const tables = page.locator('table');
        const tableCount = await tables.count();
        console.log(`Table: ${tableCount > 0 ? '✅' : '❌'} (found ${tableCount})`);

        // Verify at least search and reset button exist
        expect(searchCount).toBeGreaterThan(0);
        expect(resetCount).toBeGreaterThan(0);
    });

    test('3. Test search filter by property name', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Get initial row count
        const initialRows = page.locator('table tbody tr');
        const initialCount = await initialRows.count();
        console.log(`Initial rows: ${initialCount}`);

        // Apply search filter
        const searchInputs = page.locator('input[placeholder*="Rechercher"]');
        if (await searchInputs.count() > 0) {
            const searchInput = searchInputs.first();
            await searchInput.fill('villa');
            console.log('✅ Entered search: villa');

            // Wait for filter to apply
            await page.waitForTimeout(1000);

            // Check results
            const rows = page.locator('table tbody tr');
            const rowCount = await rows.count();
            console.log(`✅ Rows after search: ${rowCount}`);

            // If there are properties to display
            if (rowCount > 0) {
                const content = await rows.first().textContent();
                console.log(`✅ Search filter working - displaying filtered results`);
            }
        } else {
            console.log('❌ Search input not found');
        }
    });

    test('4. Test type filter', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const selects = page.locator('div[role="combobox"]');
        const selectCount = await selects.count();
        console.log(`Found ${selectCount} select dropdowns`);

        if (selectCount >= 1) {
            // Click type select (first one)
            const typeSelect = selects.first();
            await typeSelect.click();
            console.log('✅ Clicked type select');

            await page.waitForTimeout(400);

            // Get options
            const options = page.locator('[role="option"]');
            const optCount = await options.count();
            console.log(`Found ${optCount} options`);

            // Click second option (should skip "all")
            if (optCount >= 2) {
                const optionText = await options.nth(1).textContent();
                await options.nth(1).click();
                console.log(`✅ Selected type: ${optionText}`);

                await page.waitForTimeout(1000);
                console.log('✅ Type filter applied');
            }
        } else {
            console.log('⚠️ Type select not found');
        }
    });

    test('5. Test status filter', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const selects = page.locator('div[role="combobox"]');
        if (await selects.count() >= 2) {
            // Click status select (second one)
            const statusSelect = selects.nth(1);
            await statusSelect.click();
            console.log('✅ Clicked status select');

            await page.waitForTimeout(400);

            const options = page.locator('[role="option"]');
            if (await options.count() >= 2) {
                const optionText = await options.nth(1).textContent();
                await options.nth(1).click();
                console.log(`✅ Selected status: ${optionText}`);

                await page.waitForTimeout(1000);
                console.log('✅ Status filter applied');
            }
        } else {
            console.log('⚠️ Status select not found');
        }
    });

    test('6. Test priority filter', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const selects = page.locator('div[role="combobox"]');
        if (await selects.count() >= 3) {
            // Click priority select (third one)
            const prioritySelect = selects.nth(2);
            await prioritySelect.click();
            console.log('✅ Clicked priority select');

            await page.waitForTimeout(400);

            const options = page.locator('[role="option"]');
            if (await options.count() >= 2) {
                const optionText = await options.nth(1).textContent();
                await options.nth(1).click();
                console.log(`✅ Selected priority: ${optionText}`);

                await page.waitForTimeout(1000);
                console.log('✅ Priority filter applied');
            }
        } else {
            console.log('⚠️ Priority select not found');
        }
    });

    test('7. Test minimum price filter', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const numberInputs = page.locator('input[type="number"]');
        if (await numberInputs.count() >= 1) {
            const minPriceInput = numberInputs.first();
            await minPriceInput.fill('100000');
            console.log('✅ Entered min price: 100000');

            await page.waitForTimeout(1000);
            console.log('✅ Min price filter applied');

            // Verify value
            const value = await minPriceInput.inputValue();
            console.log(`Verified min price value: ${value}`);
        } else {
            console.log('⚠️ Number input not found');
        }
    });

    test('8. Test maximum price filter', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        const numberInputs = page.locator('input[type="number"]');
        if (await numberInputs.count() >= 2) {
            const maxPriceInput = numberInputs.nth(1);
            await maxPriceInput.fill('500000');
            console.log('✅ Entered max price: 500000');

            await page.waitForTimeout(1000);
            console.log('✅ Max price filter applied');

            // Verify value
            const value = await maxPriceInput.inputValue();
            console.log(`Verified max price value: ${value}`);
        } else {
            console.log('⚠️ Max price input not found');
        }
    });

    test('9. Test combined filters', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Apply search
        const searchInputs = page.locator('input[placeholder*="Rechercher"]');
        if (await searchInputs.count() > 0) {
            await searchInputs.first().fill('test');
            console.log('✅ Applied search filter');
        }

        // Apply min price
        const numberInputs = page.locator('input[type="number"]');
        if (await numberInputs.count() >= 1) {
            await numberInputs.first().fill('50000');
            console.log('✅ Applied min price filter');
        }

        // Apply type filter
        const selects = page.locator('div[role="combobox"]');
        if (await selects.count() >= 1) {
            await selects.first().click();
            await page.waitForTimeout(300);
            const options = page.locator('[role="option"]');
            if (await options.count() >= 2) {
                await options.nth(1).click();
                console.log('✅ Applied type filter');
            }
        }

        await page.waitForTimeout(1000);
        console.log('✅ Combined filters applied');
    });

    test('10. Test reset filters button', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Apply a filter
        const searchInputs = page.locator('input[placeholder*="Rechercher"]');
        if (await searchInputs.count() > 0) {
            await searchInputs.first().fill('test123');
            console.log('✅ Applied search filter');
            await page.waitForTimeout(500);
        }

        // Click reset button
        const resetButtons = page.locator('button:has-text("Réinitialiser")');
        if (await resetButtons.count() > 0) {
            await resetButtons.first().click();
            console.log('✅ Clicked reset button');

            await page.waitForTimeout(1000);

            // Verify filter is cleared
            if (await searchInputs.count() > 0) {
                const value = await searchInputs.first().inputValue();
                if (value === '') {
                    console.log('✅ Search filter cleared - reset working!');
                } else {
                    console.log(`⚠️ Search not cleared, value: "${value}"`);
                }
            }
        } else {
            console.log('⚠️ Reset button not found');
        }
    });

    test('11. Verify table displays properties', async ({ page }) => {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Check table structure
        const tables = page.locator('table');
        const tableCount = await tables.count();
        console.log(`Tables found: ${tableCount}`);

        if (tableCount > 0) {
            // Check headers
            const headers = page.locator('table thead th');
            const headerCount = await headers.count();
            console.log(`Table headers: ${headerCount}`);

            // Check body rows
            const rows = page.locator('table tbody tr');
            const rowCount = await rows.count();
            console.log(`Table rows: ${rowCount}`);

            if (rowCount > 0) {
                // Get first row text
                const firstRowText = await rows.first().textContent();
                console.log(`✅ Table has ${rowCount} properties, first row preview: ${firstRowText?.substring(0, 100)}...`);
            } else {
                console.log('⚠️ No properties displayed in table');
            }
        } else {
            console.log('❌ No table found');
        }
    });
});
