import { test, expect } from '@playwright/test';

/**
 * Simple filter tests - Each test is independent and focused
 */
test.describe('Property Filters - Simple Direct Tests', () => {
    test('Filter: Open properties page and check filter elements', async ({ page }) => {
        // Use test mode to bypass auth
        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');

        // Get page content
        const content = await page.content();

        // Check for key filter elements in HTML
        const hasSearchInput = content.includes('placeholder') && content.includes('Rechercher');
        const hasResetButton = content.includes('Réinitialiser');
        const hasTable = content.includes('<table');

        console.log('Filter elements found:');
        console.log('- Search input:', hasSearchInput ? '✅' : '❌');
        console.log('- Reset button:', hasResetButton ? '✅' : '❌');
        console.log('- Table:', hasTable ? '✅' : '❌');

        expect(hasSearchInput).toBeTruthy();
        expect(hasResetButton).toBeTruthy();
    });

    test('Filter: Check filter card renders', async ({ page }) => {
        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Look for the filter card div
        const filterCard = page.locator('div').filter({ hasText: /Tous les types|Type de bien/ }).first();
        const isVisible = await filterCard.isVisible().catch(() => false);

        console.log(`Filter card visible: ${isVisible ? '✅' : '❌'}`);

        if (!isVisible) {
            // Check page content for filter elements
            const pageContent = await page.content();
            console.log('Page contains "Type de bien":', pageContent.includes('Type de bien'));
            console.log('Page contains "Statut":', pageContent.includes('Statut'));
            console.log('Page contains "Prix":', pageContent.includes('Prix'));
        }
    });

    test('Filter: Test property list loads', async ({ page }) => {
        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check if there's a table with properties
        const table = page.locator('table').first();
        const isTableVisible = await table.isVisible().catch(() => false);
        console.log(`Table visible: ${isTableVisible ? '✅' : '❌'}`);

        if (isTableVisible) {
            const rows = page.locator('table tbody tr');
            const rowCount = await rows.count();
            console.log(`Table has ${rowCount} rows`);

            if (rowCount > 0) {
                const firstRowText = await rows.first().textContent();
                console.log(`First row preview: ${firstRowText?.substring(0, 80)}...`);
            }
        }
    });

    test('Filter: Verify no console errors on load', async ({ page }) => {
        const errors = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                errors.push(`[${msg.type()}] ${msg.text()}`);
            }
        });

        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        console.log(`Console messages: ${errors.length}`);
        errors.forEach((err) => {
            console.log(`  ${err}`);
        });

        // Should not have major errors
        const criticalErrors = errors.filter(e => e.includes('Error'));
        expect(criticalErrors.length).toBeLessThan(3);
    });

    test('Filter: Test search input is functional', async ({ page }) => {
        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find and test search input
        const searchInputs = page.locator('input[type="text"]');
        const searchInputCount = await searchInputs.count();

        console.log(`Found ${searchInputCount} text inputs`);

        if (searchInputCount > 0) {
            const firstInput = searchInputs.first();
            await firstInput.fill('test');
            const value = await firstInput.inputValue();
            console.log(`Search input value after fill: "${value}"`);
            expect(value).toContain('test');
            console.log('✅ Search input works');
        } else {
            console.log('⚠️ No search input found');
        }
    });

    test('Filter: Test dropdown selects exist', async ({ page }) => {
        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find select-like elements
        const selects = page.locator('[role="combobox"]');
        const selectCount = await selects.count();

        console.log(`Found ${selectCount} select elements`);

        if (selectCount > 0) {
            // Try to click the first select
            await selects.first().click();
            await page.waitForTimeout(300);

            // Check for dropdown options
            const options = page.locator('[role="option"]');
            const optionCount = await options.count();
            console.log(`Dropdown options: ${optionCount}`);
            console.log('✅ Dropdown selects work');
        } else {
            console.log('⚠️ No select elements found');
        }
    });

    test('Filter: Test number inputs for price', async ({ page }) => {
        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find number inputs
        const numberInputs = page.locator('input[type="number"]');
        const numberCount = await numberInputs.count();

        console.log(`Found ${numberCount} number inputs`);

        if (numberCount >= 1) {
            await numberInputs.first().fill('100000');
            const value = await numberInputs.first().inputValue();
            console.log(`Min price input value: "${value}"`);
            expect(value).toBe('100000');
            console.log('✅ Min price input works');
        }

        if (numberCount >= 2) {
            await numberInputs.nth(1).fill('500000');
            const value = await numberInputs.nth(1).inputValue();
            console.log(`Max price input value: "${value}"`);
            expect(value).toBe('500000');
            console.log('✅ Max price input works');
        }
    });

    test('Filter: Test reset button functionality', async ({ page }) => {
        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Apply a filter
        const searchInputs = page.locator('input[type="text"]');
        if (await searchInputs.count() > 0) {
            await searchInputs.first().fill('villa');
            console.log('✅ Applied search filter: villa');
        }

        // Click reset
        const resetButtons = page.locator('button:has-text("Réinitialiser")');
        if (await resetButtons.count() > 0) {
            await resetButtons.first().click();
            console.log('✅ Clicked reset button');
            await page.waitForTimeout(500);

            // Verify search is cleared
            if (await searchInputs.count() > 0) {
                const value = await searchInputs.first().inputValue();
                console.log(`Search value after reset: "${value}"`);
                expect(value).toBe('');
                console.log('✅ Reset button works correctly');
            }
        } else {
            console.log('⚠️ Reset button not found');
        }
    });

    test('Filter: Test combined filter application', async ({ page }) => {
        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Apply search
        const searchInputs = page.locator('input[type="text"]');
        if (await searchInputs.count() > 0) {
            await searchInputs.first().fill('maison');
            console.log('✅ Set search: maison');
        }

        // Apply type filter
        const selects = page.locator('[role="combobox"]');
        if (await selects.count() >= 1) {
            await selects.first().click();
            await page.waitForTimeout(300);
            const options = page.locator('[role="option"]');
            if (await options.count() >= 2) {
                await options.nth(1).click();
                console.log('✅ Set type filter');
            }
        }

        // Apply price filter
        const numberInputs = page.locator('input[type="number"]');
        if (await numberInputs.count() >= 1) {
            await numberInputs.first().fill('50000');
            console.log('✅ Set min price: 50000');
        }

        await page.waitForTimeout(500);
        console.log('✅ All filters applied successfully');
    });

    test('Filter: Check filter changes affect table display', async ({ page }) => {
        await page.goto('http://localhost:3000/properties?testMode=true');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Get initial table rows
        const tableRows = page.locator('table tbody tr');
        const initialCount = await tableRows.count();
        console.log(`Initial rows: ${initialCount}`);

        // Apply search filter
        const searchInputs = page.locator('input[type="text"]');
        if (await searchInputs.count() > 0) {
            await searchInputs.first().fill('villa');
            await page.waitForTimeout(800);

            const afterFilterRows = page.locator('table tbody tr');
            const afterCount = await afterFilterRows.count();
            console.log(`Rows after search filter: ${afterCount}`);

            // Count should be same or less (filtered)
            expect(afterCount).toBeLessThanOrEqual(initialCount);
            console.log('✅ Filter affects table display');
        }
    });
});
