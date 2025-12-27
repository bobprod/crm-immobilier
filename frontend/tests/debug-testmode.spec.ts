import { test, expect } from '@playwright/test';

test('Debug: Check if testMode query parameter is detected', async ({ page }) => {
    // Listen for console messages
    const consoleLogs: string[] = [];
    page.on('console', msg => {
        consoleLogs.push(msg.text());
        console.log(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('http://localhost:3000/properties?testMode=true', { waitUntil: 'networkidle' });

    // Wait a bit for any redirects
    await page.waitForTimeout(2000);

    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check page content
    const pageContent = await page.content();

    // Look for specific elements
    console.log('\n=== Page Analysis ===');
    console.log('Page contains "testMode":', pageContent.includes('testMode'));
    console.log('Page contains "Propriétés":', pageContent.includes('Propriétés'));
    console.log('Page contains "Tableau de bord":', pageContent.includes('Tableau de bord'));
    console.log('Page contains "mock" or "test":', pageContent.toLowerCase().includes('mock') || pageContent.toLowerCase().includes('test'));

    console.log('\n=== Console Logs ===');
    console.log('Total console messages:', consoleLogs.length);
    const layoutMessages = consoleLogs.filter(m => m.includes('Layout'));
    console.log('Layout-related messages:', layoutMessages);

    const redirectMessages = consoleLogs.filter(m => m.includes('Redirect'));
    console.log('Redirect-related messages:', redirectMessages);

    // Try to find the properties list
    const propertyRows = await page.locator('tbody tr').count();
    console.log('\nProperty rows found:', propertyRows);

    // Check if we're on login page
    const isLoginPage = currentUrl.includes('/login');
    console.log('On login page:', isLoginPage);

    // If on login page, this is a failure
    if (isLoginPage) {
        console.error('❌ FAILED: Page redirected to login despite testMode=true');
        expect(false).toBe(true); // Force failure with message
    } else if (propertyRows === 0) {
        console.warn('⚠️ WARNING: Not on login page but no property rows found');
    } else {
        console.log('✅ SUCCESS: testMode appears to be working');
    }
});
