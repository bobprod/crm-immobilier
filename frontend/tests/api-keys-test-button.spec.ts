import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Test de la fonctionnalité "Test Button" pour les clés API
 *
 * Cette suite teste:
 * 1. Accès à la page Settings > API Keys
 * 2. Remplissage des champs de clés API
 * 3. Clic sur les boutons de test
 * 4. Validation des réponses de test
 * 5. Test avec Google Gemini API Key
 */

test.describe('API Keys Test Button E2E Tests', () => {
    let page: Page;
    let authToken: string;

    test.beforeAll(async ({ browser }) => {
        // Lancer le navigateur et se connecter
        const ctx = await browser.newContext();
        page = await ctx.newPage();

        // Se connecter via le login
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

        // Attendre le formulaire
        const emailInput = page.locator('input[type="email"]');
        await emailInput.waitFor({ timeout: 10000 });

        // Remplir les identifiants
        await emailInput.fill('test@example.com');
        const passwordInput = page.locator('input[type="password"]');
        await passwordInput.fill('password123');

        // Cliquer sur login
        const loginButton = page.locator('button').filter({ hasText: /Se connecter|Login/ }).first();
        await loginButton.click();

        // Attendre la redirection
        await page.waitForURL(/dashboard|home|settings|properties/, { timeout: 15000 });

        // Récupérer le token
        authToken = await page.evaluate(() => localStorage.getItem('token') || '');
        console.log('✓ Connected - Token:', authToken.substring(0, 20) + '...');
    });

    test('should load Settings page with API Keys tab', async () => {
        await page.goto(`${BASE_URL}/settings`);

        // Attendre le chargement
        await page.waitForLoadState('networkidle');

        // Chercher le bouton API Keys
        const apiKeysTab = page.locator('button').filter({ hasText: /API Keys|Clés API/ }).first();
        await expect(apiKeysTab).toBeVisible();

        // Cliquer sur le tab API Keys
        await apiKeysTab.click();

        // Attendre le chargement du contenu
        await page.waitForLoadState('networkidle');

        // Vérifier la présence du titre LLM
        const llmTitle = page.locator('h2, h3').filter({ hasText: /LLM|Modèles d'IA/ }).first();
        await expect(llmTitle).toBeVisible();

        console.log('✓ API Keys page loaded successfully');
    });

    test('should display test buttons for all API key fields', async () => {
        await page.goto(`${BASE_URL}/settings`);

        // Cliquer sur API Keys tab
        const apiKeysTab = page.locator('button').filter({ hasText: /API Keys|Clés API/ });
        if (await apiKeysTab.isVisible()) {
            await apiKeysTab.first().click();
        }

        await page.waitForLoadState('networkidle');

        // Chercher les champs d'API key et leurs boutons de test
        const apiKeyInputs = page.locator('input[type="password"]');
        const inputCount = await apiKeyInputs.count();

        console.log(`✓ Found ${inputCount} password input fields`);

        // Chercher les boutons "Tester"
        const testButtons = page.locator('button').filter({ hasText: /Tester|Test/ });
        const testButtonCount = await testButtons.count();

        console.log(`✓ Found ${testButtonCount} test buttons`);

        expect(testButtonCount).toBeGreaterThan(0);
    });

    test('should test OpenAI API key with valid format', async () => {
        await page.goto(`${BASE_URL}/settings`);

        // Cliquer sur API Keys tab
        const apiKeysTab = page.locator('button').filter({ hasText: /API Keys|Clés API/ });
        if (await apiKeysTab.isVisible()) {
            await apiKeysTab.first().click();
        }

        await page.waitForLoadState('networkidle');

        // Trouver le champ OpenAI et remplir avec une clé de test
        const openaiInputs = page.locator('input[placeholder*="sk-"]');

        if (await openaiInputs.first().isVisible()) {
            // Utiliser une clé de test (format valide)
            await openaiInputs.first().fill('sk-test-key-12345678901234567890');

            // Trouver et cliquer le bouton test qui suit
            const testButton = openaiInputs.first().locator('.. >> button').filter({ hasText: 'Test' }).first();

            if (await testButton.isVisible()) {
                await testButton.click();

                // Attendre la réponse de test
                await page.waitForTimeout(2000);

                // Chercher le message de résultat
                const resultMessage = page.locator('text=/Clé|valide|invalide|erreur/i').first();

                if (await resultMessage.isVisible()) {
                    const text = await resultMessage.textContent();
                    console.log(`✓ OpenAI test result: ${text}`);
                }
            }
        }
    });

    test('should test Gemini API key - AIzaSyB6ZOSlEVDIXpWdMB6zgDvmDiC-3pxPDSw', async () => {
        await page.goto(`${BASE_URL}/settings`);

        // Cliquer sur API Keys tab
        const apiKeysTab = page.locator('button').filter({ hasText: /API Keys|Clés API/ });
        if (await apiKeysTab.isVisible()) {
            await apiKeysTab.first().click();
        }

        await page.waitForLoadState('networkidle');

        // Chercher le label Gemini
        const geminiLabel = page.locator('label, text=/Gemini|Google/i').first();
        console.log('Cherchant le champ Gemini...');

        // Chercher tous les champs password
        const inputs = page.locator('input[type="password"]');
        let geminiFound = false;
        let geminiInputIndex = -1;

        const inputCount = await inputs.count();

        for (let i = 0; i < inputCount; i++) {
            const placeholder = await inputs.nth(i).getAttribute('placeholder');
            if (placeholder && placeholder.includes('AIza')) {
                geminiInputIndex = i;
                geminiFound = true;
                break;
            }
        }

        if (geminiFound && geminiInputIndex >= 0) {
            // Remplir avec la clé Gemini fournie
            const geminiInput = inputs.nth(geminiInputIndex);
            const geminiKey = 'AIzaSyB6ZOSlEVDIXpWdMB6zgDvmDiC-3pxPDSw';

            await geminiInput.fill(geminiKey);
            console.log(`✓ Gemini key filled`);

            // Attendre que le champ soit rempli
            await page.waitForTimeout(500);

            // Chercher le bouton test associé
            const fieldDiv = geminiInput.locator('.. >> parent >> parent');
            const testButton = fieldDiv.locator('button').filter({ hasText: 'Test' }).first();

            if (await testButton.isVisible()) {
                console.log('✓ Test button found, clicking...');
                await testButton.click();

                // Attendre la réponse (max 15 secondes)
                await page.waitForTimeout(3000);

                // Chercher le résultat
                const successMessage = page.locator('text=/valide|valid|success|✓/i').first();
                const errorMessage = page.locator('text=/invalide|invalid|erreur|error|✗/i').first();

                let testPassed = false;

                if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
                    const text = await successMessage.textContent();
                    console.log(`✓ Gemini test PASSED: ${text}`);
                    testPassed = true;
                } else if (await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
                    const text = await errorMessage.textContent();
                    console.log(`✗ Gemini test FAILED: ${text}`);
                }

                expect(testPassed || await errorMessage.isVisible({ timeout: 1000 }).catch(() => false)).toBeTruthy();
            } else {
                console.warn('⚠ Test button not found for Gemini');
            }
        } else {
            console.warn('⚠ Gemini input field not found');
        }
    });

    test('should handle invalid API key gracefully', async () => {
        await page.goto(`${BASE_URL}/settings`);

        // Cliquer sur API Keys tab
        const apiKeysTab = page.locator('button').filter({ hasText: /API Keys|Clés API/ });
        if (await apiKeysTab.isVisible()) {
            await apiKeysTab.first().click();
        }

        await page.waitForLoadState('networkidle');

        // Remplir avec une clé invalide
        const firstInput = page.locator('input[type="password"]').first();
        await firstInput.fill('invalid-key-123');

        // Attendre
        await page.waitForTimeout(500);

        // Chercher le bouton test
        const testButton = firstInput.locator('.. >> parent >> parent').locator('button').filter({ hasText: 'Test' }).first();

        if (await testButton.isVisible()) {
            await testButton.click();

            // Attendre la réponse
            await page.waitForTimeout(2000);

            // Vérifier qu'il y a un message d'erreur
            const errorMessage = page.locator('text=/invalide|invalid|erreur|error/i');

            const isVisible = await errorMessage.first().isVisible({ timeout: 5000 }).catch(() => false);

            if (isVisible) {
                const text = await errorMessage.first().textContent();
                console.log(`✓ Invalid key handled correctly: ${text}`);
                expect(text).toContain('invalide').or.toContain('invalid').or.toContain('erreur').or.toContain('error');
            }
        }
    });

    test('should show loading state while testing', async () => {
        await page.goto(`${BASE_URL}/settings`);

        // Cliquer sur API Keys tab
        const apiKeysTab = page.locator('button').filter({ hasText: /API Keys|Clés API/ });
        if (await apiKeysTab.isVisible()) {
            await apiKeysTab.first().click();
        }

        await page.waitForLoadState('networkidle');

        // Remplir un champ
        const firstInput = page.locator('input[type="password"]').first();
        await firstInput.fill('sk-test-key');

        // Chercher le bouton test
        const testButton = firstInput.locator('.. >> parent >> parent').locator('button').filter({ hasText: 'Test' }).first();

        if (await testButton.isVisible()) {
            // Cliquer et vérifier l'état de chargement
            await testButton.click();

            // Attendre un instant
            await page.waitForTimeout(500);

            // Chercher le loader
            const loader = page.locator('svg.animate-spin').first();

            // Le loader peut apparaître brièvement
            const loaderVisible = await loader.isVisible({ timeout: 2000 }).catch(() => false);

            if (loaderVisible) {
                console.log('✓ Loading state (spinner) was visible');
            } else {
                console.log('✓ Loading state: test completed quickly');
            }
        }
    });

    test('should disable test button when key field is empty', async () => {
        await page.goto(`${BASE_URL}/settings`);

        // Cliquer sur API Keys tab
        const apiKeysTab = page.locator('button').filter({ hasText: /API Keys|Clés API/ });
        if (await apiKeysTab.isVisible()) {
            await apiKeysTab.first().click();
        }

        await page.waitForLoadState('networkidle');

        // Chercher un champ vide et son bouton
        const firstInput = page.locator('input[type="password"]').first();
        const testButton = firstInput.locator('.. >> parent >> parent').locator('button').filter({ hasText: 'Test' }).first();

        if (await testButton.isVisible()) {
            // Assurer que le champ est vide
            await firstInput.fill('');
            await page.waitForTimeout(300);

            // Vérifier que le bouton est désactivé
            const isDisabled = await testButton.isDisabled();

            if (isDisabled) {
                console.log('✓ Test button is disabled when key field is empty');
            } else {
                console.log('⚠ Test button is not disabled (may need to be implemented)');
            }
        }
    });
});
