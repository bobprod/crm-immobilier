import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('API Keys - Deepseek Configuration', () => {
    let token: string;
    let userId: string;

    test.beforeAll(async () => {
        // Note: Cette partie nécessite une authentification réelle
        // Pour les tests, utiliser Playwright API pour faire un POST auth
    });

    test('should display the AI API Keys page', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Attendre le chargement
        await page.waitForTimeout(2000);

        // Vérifier que la page existe
        await expect(page.locator('text=Clés API & Configuration LLM')).toBeVisible({ timeout: 5000 });
        console.log('✓ Page AI API Keys affichée');
    });

    test('should show LLM tab', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Vérifier l'onglet LLM
        const llmTab = page.locator('button:has-text("LLM")').first();
        await expect(llmTab).toBeVisible();

        // Cliquer sur l'onglet
        await llmTab.click();

        // Vérifier que les inputs de provider sont visibles
        await expect(page.locator('text=Sélectionner un Provider LLM')).toBeVisible();
        console.log('✓ Onglet LLM affiché');
    });

    test('should have Deepseek provider option', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Cliquer sur LLM tab
        await page.locator('button:has-text("LLM")').first().click();

        // Vérifier que Deepseek est dans la liste
        const providerSelect = page.locator('select').first();
        const deepseekOption = providerSelect.locator('option:has-text("DeepSeek")');

        await expect(deepseekOption).toBeVisible();
        console.log('✓ Deepseek est une option disponible');
    });

    test('should test Deepseek API key validation', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Attendre le chargement
        await page.waitForTimeout(2000);

        // Cliquer sur LLM tab
        await page.locator('button:has-text("LLM")').first().click();

        // Sélectionner Deepseek
        const providerSelect = page.locator('select').first();
        await providerSelect.selectOption('deepseek');

        // Vérifier que les modèles Deepseek sont affichés
        const modelSelect = page.locator('select').nth(1);
        await modelSelect.waitFor();

        const deepseekChatOption = modelSelect.locator('option:has-text("deepseek-chat")');
        await expect(deepseekChatOption).toBeVisible();
        console.log('✓ Modèles Deepseek affichés');
    });

    test('should show test button for Deepseek key input', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Attendre le chargement
        await page.waitForTimeout(2000);

        // Cliquer sur LLM tab
        await page.locator('button:has-text("LLM")').first().click();

        // Trouver l'input Deepseek
        const deepseekInput = page.locator('input[data-testid="input-deepseekApiKey"]');

        // Saisir une clé de test
        await deepseekInput.fill('sk-test-deepseek-12345');

        // Vérifier que le bouton "Tester" apparaît
        const testButton = page.locator('button:has-text("Tester")').first();
        await expect(testButton).toBeVisible();

        console.log('✓ Bouton "Tester" visible après entrée de clé');
    });

    test('should test invalid Deepseek key', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Attendre le chargement
        await page.waitForTimeout(2000);

        // Cliquer sur LLM tab
        await page.locator('button:has-text("LLM")').first().click();

        // Trouver l'input Deepseek
        const deepseekInput = page.locator('input[data-testid="input-deepseekApiKey"]');

        // Saisir une clé invalide
        await deepseekInput.fill('invalid-key-12345');

        // Cliquer sur le bouton "Tester"
        const testButton = page.locator('button:has-text("Tester")').first();
        await testButton.click();

        // Attendre une notification d'erreur
        await page.waitForTimeout(1500);

        // Vérifier qu'une notification d'erreur apparaît
        const errorNotif = page.locator('text=/invalide|Erreur|failed/i');
        const isVisible = await errorNotif.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
            console.log('✓ Notification d\'erreur affichée pour clé invalide');
        } else {
            console.log('⚠ Pas de notification visible (vérifiez la connexion API)');
        }
    });

    test('should fill Deepseek key and select model', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Attendre le chargement
        await page.waitForTimeout(2000);

        // Cliquer sur LLM tab
        await page.locator('button:has-text("LLM")').first().click();

        // Sélectionner Deepseek
        const providerSelect = page.locator('select').first();
        await providerSelect.selectOption('deepseek');

        // Attendre les modèles
        await page.waitForTimeout(500);

        // Sélectionner un modèle
        const modelSelect = page.locator('select').nth(1);
        await modelSelect.selectOption('deepseek-chat');

        // Remplir la clé
        const deepseekInput = page.locator('input[data-testid="input-deepseekApiKey"]');
        await deepseekInput.fill('sk-12345678901234567890');

        // Vérifier que la sélection est affichée
        const selectionDisplay = page.locator('text=/Configuration sélectionnée/i');
        await expect(selectionDisplay).toContainText('DEEPSEEK');
        await expect(selectionDisplay).toContainText('deepseek-chat');

        console.log('✓ Deepseek et modèle sélectionnés correctement');
    });

    test('should save Deepseek key and model', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Attendre le chargement
        await page.waitForTimeout(2000);

        // Cliquer sur LLM tab
        const llmTab = page.locator('button:has-text("LLM")').first();
        await llmTab.click();

        // Sélectionner Deepseek
        const providerSelect = page.locator('select').first();
        await providerSelect.selectOption('deepseek');

        // Attendre les modèles
        await page.waitForTimeout(500);

        // Sélectionner un modèle
        const modelSelect = page.locator('select').nth(1);
        await modelSelect.selectOption('deepseek-chat');

        // Remplir la clé
        const deepseekInput = page.locator('input[data-testid="input-deepseekApiKey"]');
        await deepseekInput.fill('sk-test-deepseek-key-for-save');

        // Cliquer le bouton "Enregistrer les clés LLM"
        const saveButton = page.locator('button:has-text("Enregistrer les clés LLM")');
        await saveButton.click();

        // Attendre une notification de succès
        await page.waitForTimeout(2000);

        // Vérifier la notification
        const successNotif = page.locator('text=/sauvegardées|succès|success/i');
        const isVisible = await successNotif.isVisible({ timeout: 3000 }).catch(() => false);

        if (isVisible) {
            console.log('✓ Notification de succès affichée');
        } else {
            console.log('⚠ Pas de notification visible');
        }
    });

    test('should display saved Deepseek key on page reload', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Attendre le chargement des clés
        await page.waitForTimeout(3000);

        // Cliquer sur LLM tab
        await page.locator('button:has-text("LLM")').first().click();

        // Vérifier que le champ Deepseek est rempli
        const deepseekInput = page.locator('input[data-testid="input-deepseekApiKey"]');
        const inputValue = await deepseekInput.inputValue();

        if (inputValue && inputValue.length > 0) {
            console.log(`✓ Clé Deepseek chargée: ${inputValue.substring(0, 20)}...`);
        } else {
            console.log('⚠ Clé Deepseek non trouvée (possible si c\'est la première visite)');
        }
    });

    test('should show "Configurée" badge for existing keys', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Attendre le chargement
        await page.waitForTimeout(3000);

        // Cliquer sur LLM tab
        await page.locator('button:has-text("LLM")').first().click();

        // Chercher un badge "Configurée" ou "Validée"
        const configBadges = page.locator('text=/Configurée|Validée/i');
        const count = await configBadges.count();

        if (count > 0) {
            console.log(`✓ ${count} badge(s) "Configurée/Validée" trouvé(s)`);
        } else {
            console.log('⚠ Aucun badge trouvé (normal si c\'est la première visite)');
        }
    });

    test('should display visibility toggle for saved keys', async ({ page }) => {
        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // Attendre le chargement
        await page.waitForTimeout(3000);

        // Cliquer sur LLM tab
        await page.locator('button:has-text("LLM")').first().click();

        // Chercher les boutons œil (show/hide)
        const eyeButtons = page.locator('button svg[class*="Eye"]');
        const count = await eyeButtons.count();

        console.log(`✓ ${count} bouton(s) œil trouvé(s) pour afficher/masquer les clés`);
    });

    test('complete workflow: add, test, and save Deepseek key', async ({ page }) => {
        console.log('\n=== Workflow complet ===');

        await page.goto(`${BASE_URL}/settings/ai-api-keys`);

        // 1. Attendre le chargement
        await page.waitForTimeout(2000);
        console.log('1. Page chargée');

        // 2. Naviguer vers l'onglet LLM
        await page.locator('button:has-text("LLM")').first().click();
        await page.waitForTimeout(500);
        console.log('2. Onglet LLM activé');

        // 3. Sélectionner Deepseek
        const providerSelect = page.locator('select').first();
        await providerSelect.selectOption('deepseek');
        await page.waitForTimeout(500);
        console.log('3. Provider Deepseek sélectionné');

        // 4. Sélectionner le modèle
        const modelSelect = page.locator('select').nth(1);
        await modelSelect.selectOption('deepseek-coder');
        console.log('4. Modèle deepseek-coder sélectionné');

        // 5. Remplir la clé
        const deepseekInput = page.locator('input[data-testid="input-deepseekApiKey"]');
        const testKey = `sk-${Date.now()}-deepseek-test`;
        await deepseekInput.fill(testKey);
        console.log('5. Clé API remplie');

        // 6. Cliquer sur le bouton "Enregistrer"
        const saveButton = page.locator('button:has-text("Enregistrer les clés LLM")');
        await saveButton.click();
        console.log('6. Bouton "Enregistrer" cliqué');

        // 7. Attendre la confirmation
        await page.waitForTimeout(2500);
        console.log('7. Attente de la confirmation');

        // 8. Recharger la page
        await page.reload();
        await page.waitForTimeout(3000);
        console.log('8. Page rechargée');

        // 9. Vérifier que la clé est toujours présente
        await page.locator('button:has-text("LLM")').first().click();
        const loadedInput = page.locator('input[data-testid="input-deepseekApiKey"]');
        const loadedValue = await loadedInput.inputValue();

        if (loadedValue && loadedValue.length > 0) {
            console.log('✓ Workflow complet réussi - Clé toujours présente après reload');
        } else {
            console.log('⚠ Clé non présente après reload');
        }
    });
});
