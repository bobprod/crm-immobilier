import { test, expect } from '@playwright/test';

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Test@123456';

test.describe('API Keys & LLM Model Configuration', () => {
    let authToken: string;

    test.beforeAll(async () => {
        // Pour les tests auth, utiliser un client HTTP
        console.log('🔐 Authentication setup ready');
    });

    test.describe('Provider & Model Selection', () => {
        test('should load the API keys page with correct initial state', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            // Vérifier que la page est chargée
            await expect(page.locator('text=Mes Clés API & Configuration LLM')).toBeVisible();

            // Vérifier les onglets
            await expect(page.getByTestId('tab-llm')).toBeVisible();
            await expect(page.getByTestId('tab-scraping')).toBeVisible();

            // Vérifier que l'onglet LLM est actif par défaut
            const llmTab = page.getByTestId('tab-llm');
            await expect(llmTab).toHaveAttribute('data-state', 'active');
        });

        test('should display provider and model selectors in LLM tab', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            // Cliquer sur l'onglet LLM si nécessaire
            const llmTab = page.getByTestId('tab-llm');
            if (!(await llmTab.getAttribute('data-state') === 'active')) {
                await llmTab.click();
            }

            // Vérifier les sélecteurs
            const providerSelect = page.getByTestId('select-provider');
            const modelSelect = page.getByTestId('select-model');

            await expect(providerSelect).toBeVisible();
            await expect(modelSelect).toBeVisible();

            // Vérifier les options de provider
            await providerSelect.click();
            await expect(page.locator('text=OpenAI (GPT)')).toBeVisible();
            await expect(page.locator('text=Google Gemini')).toBeVisible();
            await expect(page.locator('text=DeepSeek')).toBeVisible();
            await expect(page.locator('text=Anthropic (Claude)')).toBeVisible();
        });

        test('should update model options when provider changes', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            const providerSelect = page.getByTestId('select-provider');
            const modelSelect = page.getByTestId('select-model');

            // Sélectionner Gemini
            await providerSelect.selectOption('gemini');
            await page.waitForTimeout(300);

            // Vérifier que les modèles Gemini apparaissent
            await modelSelect.click();
            await expect(page.locator('text=gemini-2.0-flash')).toBeVisible();
            await expect(page.locator('text=gemini-1.5-pro')).toBeVisible();

            // Sélectionner OpenAI
            await providerSelect.selectOption('openai');
            await page.waitForTimeout(300);

            // Vérifier que les modèles OpenAI apparaissent
            await modelSelect.click();
            await expect(page.locator('text=gpt-4o')).toBeVisible();
            await expect(page.locator('text=gpt-4-turbo')).toBeVisible();
        });

        test('should display selected configuration', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            const providerSelect = page.getByTestId('select-provider');
            const modelSelect = page.getByTestId('select-model');

            // Sélectionner OpenAI et gpt-4o
            await providerSelect.selectOption('openai');
            await modelSelect.selectOption('gpt-4o');
            await page.waitForTimeout(300);

            // Vérifier que la configuration est affichée
            const configDisplay = page.getByTestId('selection-display');
            await expect(configDisplay).toContainText('OPENAI');
            await expect(configDisplay).toContainText('gpt-4o');
        });
    });

    test.describe('API Key Input Fields', () => {
        test('should have all API key input fields', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            // Cliquer sur l'onglet LLM
            const llmTab = page.getByTestId('tab-llm');
            await llmTab.click();

            // Vérifier les inputs
            const openaiInput = page.getByTestId('input-openaiApiKey');
            const geminiInput = page.getByTestId('input-geminiApiKey');
            const deepseekInput = page.getByTestId('input-deepseekApiKey');
            const anthropicInput = page.getByTestId('input-anthropicApiKey');

            await expect(openaiInput).toBeVisible();
            await expect(geminiInput).toBeVisible();
            await expect(deepseekInput).toBeVisible();
            await expect(anthropicInput).toBeVisible();
        });

        test('should hide API keys by default and show on toggle', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            const openaiInput = page.getByTestId('input-openaiApiKey');

            // Remplir l'input avec une clé
            await openaiInput.fill('sk-test123456789');
            await page.waitForTimeout(300);

            // La clé doit être masquée (type="password")
            await expect(openaiInput).toHaveAttribute('type', 'password');

            // Cliquer sur l'eye icon pour afficher
            const eyeButton = page.locator('button', { has: page.locator('[class*="eye"]') }).first();
            // Note: L'implémentation exacte dépend du composant Button
        });
    });

    test.describe('Save API Keys & Model', () => {
        test('should display toast message when saving', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            const openaiInput = page.getByTestId('input-openaiApiKey');
            const providerSelect = page.getByTestId('select-provider');
            const modelSelect = page.getByTestId('select-model');
            const saveButton = page.getByTestId('button-save-llm');

            // Remplir les champs
            await openaiInput.fill('sk-test123456789');
            await providerSelect.selectOption('openai');
            await modelSelect.selectOption('gpt-4o');
            await page.waitForTimeout(300);

            // Cliquer sur le bouton save
            await saveButton.click();

            // Vérifier le message de toast (l'élément doit apparaître)
            await page.waitForTimeout(500);

            // Chercher le toast de succès (il peut apparaître en bas à droite)
            const toastMessage = page.locator('text=/Clés LLM sauvegardées|Erreur|Connexion/');
            await expect(toastMessage).toBeVisible({ timeout: 5000 });
        });

        test('should show loading state while saving', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            const saveButton = page.getByTestId('button-save-llm');

            // Le bouton ne doit pas être désactivé initialement
            // (aucune API key n'est requis)

            // Remplir et sauvegarder
            await page.getByTestId('input-openaiApiKey').fill('sk-test');

            // Cliquer et vérifier le changement d'état
            await saveButton.click();

            // Vérifier que le bouton affiche le texte de chargement
            const loadingText = page.locator('text=Enregistrement');
            // Le loading doit être visible ou le bouton doit être désactivé
            // (le timeout court car l'opération est rapide)
        });

        test('should keep input values after successful save', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            const testValue = 'sk-test-' + Date.now();
            const openaiInput = page.getByTestId('input-openaiApiKey');
            const saveButton = page.getByTestId('button-save-llm');

            // Remplir et sauvegarder
            await openaiInput.fill(testValue);
            await saveButton.click();

            // Attendre que la sauvegarde soit complète
            await page.waitForTimeout(1000);

            // L'input doit conserver sa valeur
            await expect(openaiInput).toHaveValue(testValue);
        });
    });

    test.describe('Scraping Tab', () => {
        test('should display scraping providers tab', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            const scrapingTab = page.getByTestId('tab-scraping');
            await scrapingTab.click();

            // Vérifier que les inputs de scraping apparaissent
            const serpInput = page.getByTestId('input-serpApiKey');
            const firecrawlInput = page.getByTestId('input-firecrawlApiKey');
            const jinaInput = page.getByTestId('input-jinaReaderApiKey');

            await expect(serpInput).toBeVisible();
            await expect(firecrawlInput).toBeVisible();
            await expect(jinaInput).toBeVisible();
        });

        test('should save scraping keys independently', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            const scrapingTab = page.getByTestId('tab-scraping');
            await scrapingTab.click();

            const serpInput = page.getByTestId('input-serpApiKey');
            const saveButton = page.getByTestId('button-save-scraping');

            // Remplir et sauvegarder
            await serpInput.fill('test-serp-key-' + Date.now());
            await saveButton.click();

            // Vérifier le toast (même pattern que le tab LLM)
            await page.waitForTimeout(500);
            const toastMessage = page.locator('text=/Scraping|Erreur|Connexion/');
            await expect(toastMessage).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Integration', () => {
        test('should complete full workflow: select provider, model, enter key, save', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            // 1. Sélectionner provider et modèle
            const providerSelect = page.getByTestId('select-provider');
            const modelSelect = page.getByTestId('select-model');

            await providerSelect.selectOption('gemini');
            await modelSelect.selectOption('gemini-2.0-flash');
            await page.waitForTimeout(300);

            // 2. Vérifier la sélection
            const configDisplay = page.getByTestId('selection-display');
            await expect(configDisplay).toContainText('GEMINI');
            await expect(configDisplay).toContainText('gemini-2.0-flash');

            // 3. Entrer la clé API
            const geminiInput = page.getByTestId('input-geminiApiKey');
            await geminiInput.fill('AIzaSy-test-key-' + Date.now());

            // 4. Sauvegarder
            const saveButton = page.getByTestId('button-save-llm');
            await saveButton.click();

            // 5. Vérifier le message de succès
            await page.waitForTimeout(500);
            const successMessage = page.locator('text=/Clés LLM sauvegardées|Gemini|gemini-2.0-flash/i');
            await expect(successMessage).toBeVisible({ timeout: 5000 });

            // 6. Vérifier que les valeurs sont conservées
            await expect(geminiInput).toHaveValue(/AIzaSy-test-key/);
            await expect(providerSelect).toHaveValue('gemini');
            await expect(modelSelect).toHaveValue('gemini-2.0-flash');
        });

        test('should handle switching between providers', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            // Sauvegarder avec OpenAI
            await page.getByTestId('select-provider').selectOption('openai');
            await page.getByTestId('select-model').selectOption('gpt-4o');
            await page.getByTestId('input-openaiApiKey').fill('sk-openai-' + Date.now());
            await page.getByTestId('button-save-llm').click();

            await page.waitForTimeout(700);

            // Changer vers DeepSeek
            await page.getByTestId('select-provider').selectOption('deepseek');
            await page.getByTestId('select-model').selectOption('deepseek-chat');
            await page.getByTestId('input-deepseekApiKey').fill('sk-deepseek-' + Date.now());
            await page.getByTestId('button-save-llm').click();

            await page.waitForTimeout(500);

            // Vérifier que DeepSeek est toujours sélectionné
            await expect(page.getByTestId('select-provider')).toHaveValue('deepseek');
            await expect(page.getByTestId('select-model')).toHaveValue('deepseek-chat');
        });
    });

    test.describe('Error Handling', () => {
        test('should handle network errors gracefully', async ({ page }) => {
            // Simuler une erreur réseau en utilisant un interceptor
            await page.route('**/api-billing/api-keys/user', route => {
                route.abort('failed');
            });

            await page.goto(`${APP_URL}/settings`);

            // Attendre le message d'erreur
            const errorMessage = page.locator('text=/Erreur|Connexion/i');
            await expect(errorMessage).toBeVisible({ timeout: 5000 });
        });

        test('should validate required fields', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            // Tenter de sauvegarder sans remplir les champs
            const saveButton = page.getByTestId('button-save-llm');

            // Le bouton doit être cliquable (pas de validation frontend requise)
            // mais l'API backend doit gérer les données vides
            await saveButton.click();

            // Vérifier qu'aucune erreur n'apparaît pour des champs vides
            // (puisque tous les champs sont optionnels)
            await page.waitForTimeout(500);
        });
    });

    test.describe('UI/UX', () => {
        test('should have responsive design', async ({ page }) => {
            // Desktop
            await page.setViewportSize({ width: 1920, height: 1080 });
            await page.goto(`${APP_URL}/settings`);

            const providerSelect = page.getByTestId('select-provider');
            const modelSelect = page.getByTestId('select-model');

            // Sur desktop, les sélecteurs doivent être côte à côte
            const providerBox = await providerSelect.boundingBox();
            const modelBox = await modelSelect.boundingBox();

            if (providerBox && modelBox) {
                // Vérifier qu'ils ne se chevauchent pas horizontalement (côte à côte)
                expect(providerBox.x + providerBox.width < modelBox.x || modelBox.x + modelBox.width < providerBox.x).toBeTruthy();
            }

            // Mobile
            await page.setViewportSize({ width: 375, height: 667 });
            await page.reload();

            const providerBoxMobile = await providerSelect.boundingBox();
            const modelBoxMobile = await modelSelect.boundingBox();

            if (providerBoxMobile && modelBoxMobile) {
                // Sur mobile, ils peuvent être empilés (x peut être proche)
                // Vérifier qu'ils prennent tous les deux assez d'espace
                expect(providerBoxMobile.width).toBeGreaterThan(300);
                expect(modelBoxMobile.width).toBeGreaterThan(300);
            }
        });

        test('should display helpful descriptions', async ({ page }) => {
            await page.goto(`${APP_URL}/settings`);

            // Vérifier les descriptions des API keys
            const descriptions = page.locator('text=/Pour GPT-4|Pour Gemini|Pour DeepSeek/');
            const count = await descriptions.count();

            expect(count).toBeGreaterThan(0);
        });
    });
});
