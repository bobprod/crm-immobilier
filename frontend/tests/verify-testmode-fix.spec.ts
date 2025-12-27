import { test, expect } from '@playwright/test';

/**
 * Quick verification test
 * This test verifies the core fix is working: testMode=true prevents redirect
 */
test('VERIFY: testMode=true prevents auth redirect', async ({ page, context }) => {
    // Setup: Listen for navigation/redirects
    const navigationUrls: string[] = [];
    page.on('framenavigated', frame => {
        navigationUrls.push(frame.url());
    });

    // Go to properties page with testMode=true
    await page.goto('http://localhost:3000/properties?testMode=true', { waitUntil: 'domcontentloaded' });

    // Wait for any redirects/network activity to settle
    await page.waitForLoadState('networkidle');

    // Final URL check
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    console.log('Navigation history:', navigationUrls);

    // Verify we're NOT on login page
    const isLoginPage = finalUrl.includes('/login');
    console.log(`On login page: ${isLoginPage}`);

    if (!isLoginPage) {
        console.log('✅ SUCCESS: Page did not redirect to login');

        // Check for mock properties
        const pageContent = await page.content();
        const hasMockData = pageContent.includes('Property') || pageContent.includes('House') || pageContent.includes('Apartment');
        console.log(`Has mock data: ${hasMockData}`);

        expect(hasMockData).toBe(true);
    } else {
        console.log('❌ FAILED: Page redirected to login despite testMode=true');
        expect(isLoginPage).toBe(false);
    }
});
