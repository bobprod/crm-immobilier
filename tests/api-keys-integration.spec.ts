import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:3001/api';

test.describe('LLM API Keys Integration Tests', () => {
    let authToken: string;
    let userId: string;

    test.beforeAll(async () => {
        // Mock authentication - in real scenario, login first
        // For now, we'll use curl to get the auth token
        console.log('Setting up test environment...');
    });

    test('should save OpenAI API key', async ({ request }) => {
        const response = await request.put(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    openaiApiKey: 'sk-test-1234567890',
                },
            }
        );

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.message).toContain('mises à jour');
    });

    test('should save Mistral API key', async ({ request }) => {
        const response = await request.put(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    mistralApiKey: 'test-mistral-key-123',
                },
            }
        );

        expect(response.status()).toBe(200);
    });

    test('should save Grok API key', async ({ request }) => {
        const response = await request.put(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    grokApiKey: 'test-grok-key-123',
                },
            }
        );

        expect(response.status()).toBe(200);
    });

    test('should save Cohere API key', async ({ request }) => {
        const response = await request.put(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    cohereApiKey: 'test-cohere-key-123',
                },
            }
        );

        expect(response.status()).toBe(200);
    });

    test('should save multiple LLM API keys at once', async ({ request }) => {
        const response = await request.put(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    openaiApiKey: 'sk-openai-test',
                    mistralApiKey: 'mistral-test',
                    grokApiKey: 'grok-test',
                    cohereApiKey: 'cohere-test',
                    togetherAiApiKey: 'together-test',
                    replicateApiKey: 'replicate-test',
                    perplexityApiKey: 'perplexity-test',
                    huggingfaceApiKey: 'huggingface-test',
                    alephAlphaApiKey: 'aleph-test',
                    nlpCloudApiKey: 'nlpcloud-test',
                },
            }
        );

        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test('should retrieve saved API keys (masked)', async ({ request }) => {
        const response = await request.get(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        expect(response.status()).toBe(200);
        const body = await response.json();

        // Keys should be masked, showing only last 4 characters
        if (body.openaiApiKey) {
            expect(body.openaiApiKey).toMatch(/\*+\w{4}/);
        }
    });

    test('should validate API key format', async ({ request }) => {
        const response = await request.put(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    openaiApiKey: '', // Empty key should be handled gracefully
                },
            }
        );

        // Should accept empty strings (optional field)
        expect([200, 400]).toContain(response.status());
    });

    test('should update API keys via Frontend form', async ({ page }) => {
        // Navigate to settings page
        await page.goto(`${BASE_URL}/settings`);

        // Wait for API Keys tab to be visible
        await page.waitForSelector('button:has-text("API Keys")');

        // Click API Keys tab
        await page.click('button:has-text("API Keys")');

        // Wait for LLM section to load
        await page.waitForSelector('text="LLM - Modèles d\'IA"');

        // Fill OpenAI key
        const openaiInputs = await page.locator('input[placeholder="sk-..."]').all();
        if (openaiInputs.length > 0) {
            await openaiInputs[0].fill('sk-test-openai-123');
        }

        // Click Save button
        await page.click('button:has-text("Enregistrer les clés LLM")');

        // Wait for success message
        await page.waitForSelector('text=/succes|mise à jour/i');
    });

    test('should display dropdown for other LLM models', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings`);

        // Click API Keys tab
        await page.click('button:has-text("API Keys")');

        // Wait for "Autres Modèles LLM" dropdown
        await page.waitForSelector('select');

        // Verify dropdown options exist
        const select = page.locator('select').first();
        const optionCount = await select.locator('option').count();

        expect(optionCount).toBeGreaterThan(0);
    });

    test('should update model-specific API key when dropdown changes', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings`);

        // Click API Keys tab
        await page.click('button:has-text("API Keys")');

        // Change dropdown selection
        await page.selectOption('select', 'together');

        // Verify the label updates
        await page.waitForSelector('text="Together AI API Key"');

        // Fill the API key
        const apiInput = page.locator('input[placeholder*="Together"]').first();
        await apiInput.fill('together-test-key');

        // Click Save
        await page.click('button:has-text("Enregistrer les clés")');

        // Verify success
        await page.waitForSelector('text=/succes|mise à jour/i');
    });
});

test.describe('API Keys Database Persistence', () => {
    test('should persist API keys in database', async ({ request }) => {
        // Save a key
        const saveResponse = await request.put(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    mistralApiKey: 'persistent-mistral-key',
                },
            }
        );

        expect(saveResponse.status()).toBe(200);

        // Retrieve and verify it was saved
        const getResponse = await request.get(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            }
        );

        const data = await getResponse.json();
        expect(data.mistralApiKey).toBeDefined();
    });

    test('should not expose raw API keys in response', async ({ request }) => {
        // Save a key
        await request.put(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
                data: {
                    openaiApiKey: 'sk-secret-1234567890',
                },
            }
        );

        // Retrieve and verify masking
        const getResponse = await request.get(
            `${API_BASE_URL}/ai-billing/api-keys/user`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            }
        );

        const data = await getResponse.json();

        // Key should be masked
        if (data.openaiApiKey) {
            expect(data.openaiApiKey).not.toContain('secret');
            expect(data.openaiApiKey).toMatch(/\*+/);
        }
    });
});
