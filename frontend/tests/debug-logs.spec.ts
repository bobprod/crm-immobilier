import { test, expect } from '@playwright/test';

test('Debug: Check page console logs', async ({ page }) => {
    const consoleLogs: any[] = [];

    page.on('console', msg => {
        consoleLogs.push({
            text: msg.text(),
            type: msg.type()
        });
        if (msg.text().includes('[') || msg.text().includes('test') || msg.text().includes('Mode')) {
            console.log(`[${msg.type()}] ${msg.text()}`);
        }
    });

    await page.goto('http://localhost:3000/properties?testMode=true');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('\nFinal URL:', currentUrl);

    // Show all console logs
    console.log('\n=== ALL CONSOLE LOGS ===');
    consoleLogs.forEach(log => {
        console.log(`[${log.type}] ${log.text}`);
    });

    // Count logs from PropertiesPage
    const propPageLogs = consoleLogs.filter(l => l.text.includes('[PropertiesPage]'));
    console.log('\n[PropertiesPage] logs found:', propPageLogs.length);
    if (propPageLogs.length > 0) {
        propPageLogs.forEach(l => console.log('  -', l.text));
    }
});
