import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour tester les clés API LLM
 */
export default defineConfig({
    testDir: './tests',
    testMatch: '**/llm-api-keys-e2e.spec.ts',
    fullyParallel: false, // Pas de parallélisation pour éviter les conflits
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 1,
    reporter: [
        ['html'],
        ['list'],
        ['json', { outputFile: 'test-results.json' }],
    ],
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],

    webServer: {
        command: 'echo "Please start frontend with: cd frontend && npm run dev"',
        port: 3000,
        reuseExistingServer: true,
    },
});
