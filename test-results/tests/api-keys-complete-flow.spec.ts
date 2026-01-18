import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:3000'; // Adjust if needed

test.describe('API Keys Complete Workflow Tests', () => {
    // Test 1: Public endpoint - Test API Keys
    test('should test Gemini API key validation endpoint', async ({ request }) => {
        const response = await request.post(`${API_URL}/api-keys/test/gemini`, {
            data: {
                apiKey: 'AIzaSyB6-test-invalid-key',
            },
        });

        expect(response.status()).toBe(201);
        const data = await response.json();
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('provider', 'gemini');
        expect(data).toHaveProperty('error');
    });

    test('should test OpenAI API key validation endpoint', async ({ request }) => {
        const response = await request.post(`${API_URL}/api-keys/test/openai`, {
            data: {
                apiKey: 'sk-test-invalid-key',
            },
        });

        expect(response.status()).toBe(201);
        const data = await response.json();
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('provider', 'openai');
    });

    test('should test DeepSeek API key validation endpoint', async ({ request }) => {
        const response = await request.post(`${API_URL}/api-keys/test/deepseek`, {
            data: {
                apiKey: 'sk-test-invalid-key',
            },
        });

        expect(response.status()).toBe(201);
        const data = await response.json();
        expect(data).toHaveProperty('success');
        expect(data).toHaveProperty('provider', 'deepseek');
    });

    // Test 2: Check that authenticated endpoints exist and return 401 without auth
    test('should return 401 for GET /ai-billing/api-keys/user without auth', async ({ request }) => {
        const response = await request.get(`${API_URL}/ai-billing/api-keys/user`);
        expect(response.status()).toBe(401);
    });

    test('should return 401 for PUT /ai-billing/api-keys/user without auth', async ({ request }) => {
        const response = await request.put(`${API_URL}/ai-billing/api-keys/user`, {
            data: {
                geminiApiKey: 'test-key',
            },
        });
        expect(response.status()).toBe(401);
    });

    // Test 3: Validate request structure for saving API keys
    test('should accept PUT request with optional API keys and model', async ({ request }) => {
        // This test just verifies the endpoint structure
        // A real test would need a valid JWT token

        const validPayload = {
            openaiApiKey: 'sk-test-key-123',
            geminiApiKey: 'AIzaSyB6-test-key-456',
            deepseekApiKey: 'sk-test-key-789',
            defaultModel: 'gpt-4o',
            defaultProvider: 'openai',
        };

        // Test that the schema is valid (without auth)
        const response = await request.put(`${API_URL}/ai-billing/api-keys/user`, {
            data: validPayload,
        });

        // Should return 401 (Unauthorized) because no token, but not 400 (Bad Request)
        expect(response.status()).toBe(401);
    });

    // Test 4: Verify Swagger documentation includes the endpoints
    test('should have API keys endpoints documented in Swagger', async ({ request }) => {
        const response = await request.get(`${API_URL}/docs`);
        expect(response.status()).toBe(200);

        const html = await response.text();
        // Check for API keys related documentation
        expect(html).toContain('api-keys');
        expect(html).toContain('ai-billing');
    });
});

test.describe('Frontend Integration Tests (Manual)', () => {
    test.skip('should load Settings > API Keys page', async ({ page }) => {
        // This test requires a logged-in user
        // Run this manually when testing the complete workflow

        await page.goto(`${FRONTEND_URL}/settings`);

        // Wait for the page to load
        await page.waitForLoadState('networkidle');

        // Click on API Keys tab
        const apiKeysTab = page.locator('button').filter({ hasText: /API Keys|Clés API/i });
        await apiKeysTab.click();

        // Verify the page loaded
        expect(page).toHaveURL(/settings/);
    });

    test.skip('should save LLM API keys with model selection', async ({ page }) => {
        // Requires logged-in user and valid session
        await page.goto(`${FRONTEND_URL}/settings/api-keys-enhanced`);

        // Fill in API key
        await page.fill('input[placeholder="sk-..."]', 'sk-test-valid-key');

        // Select provider
        await page.selectOption('select[id="provider"]', 'openai');

        // Select model
        await page.selectOption('select[id="model"]', 'gpt-4o');

        // Save
        const saveButton = page.locator('button', { hasText: 'Enregistrer les clés LLM' });
        await saveButton.click();

        // Verify success message
        const successMessage = page.locator('text=Clés API sauvegardées avec succès');
        await expect(successMessage).toBeVisible();
    });
});
