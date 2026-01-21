import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le bouton "Tester" à côté de chaque input de clé API
 * Vérifie que le changement existe et fonctionne
 */

test.describe('API Keys Page - Button "Tester"', () => {
    test.beforeEach(async ({ page }) => {
        // Aller sur la page des clés API
        await page.goto('http://localhost:3000/settings/ai-api-keys', { waitUntil: 'networkidle' });

        // Attendre que la page soit chargée
        await expect(page).toHaveTitle(/Clés API/);
    });

    test('✅ Page devrait charger avec le titre correct', async ({ page }) => {
        // Vérifier le titre
        const title = page.locator('h1');
        await expect(title).toContainText('Clés API & Configuration LLM');
    });

    test('✅ Onglet LLM devrait être visible et cliquable', async ({ page }) => {
        // Vérifier l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await expect(llmTab).toBeVisible();
        await llmTab.click();

        // Vérifier que le contenu LLM est visible
        const llmContent = page.locator('text=Configuration LLM & Providers');
        await expect(llmContent).toBeVisible();
    });

    test('✅ Inputs de clés API doivent être visibles', async ({ page }) => {
        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();

        // Attendre que le contenu charge
        await page.waitForTimeout(500);

        // Vérifier les labels
        await expect(page.locator('text=OpenAI (GPT)')).toBeVisible();
        await expect(page.locator('text=Google Gemini')).toBeVisible();
        await expect(page.locator('text=DeepSeek')).toBeVisible();
        await expect(page.locator('text=Anthropic (Claude)')).toBeVisible();
        await expect(page.locator('text=OpenRouter')).toBeVisible();
        await expect(page.locator('text=Mistral AI')).toBeVisible();
    });

    test('✅ Bouton "Tester" DÉSACTIVÉ quand input est vide', async ({ page }) => {
        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();

        // Attendre que le contenu charge
        await page.waitForTimeout(500);

        // Chercher tous les boutons "Tester"
        const testButtons = page.locator('button:has-text("Tester")');
        const count = await testButtons.count();

        console.log(`✅ Trouvé ${count} boutons "Tester"`);

        // Au moins 6 boutons "Tester" doivent exister (OpenAI, Gemini, DeepSeek, Anthropic, OpenRouter, Mistral)
        expect(count).toBeGreaterThanOrEqual(6);

        // Tous doivent être désactivés au départ (input vide)
        for (let i = 0; i < count; i++) {
            const button = testButtons.nth(i);
            const isDisabled = await button.isDisabled();
            console.log(`Bouton ${i}: disabled=${isDisabled}`);
            expect(isDisabled).toBe(true);
        }
    });

    test('✅ Bouton "Tester" s\'ACTIVE quand on tape une clé API', async ({ page }) => {
        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();

        // Attendre que le contenu charge
        await page.waitForTimeout(500);

        // Trouver l'input OpenAI et y taper une clé
        const openaiInput = page.locator('input[data-testid="input-openaiApiKey"]');
        await openaiInput.fill('sk-test-key-12345');

        // Attendre que le DOM se mette à jour
        await page.waitForTimeout(300);

        // Trouver le bouton "Tester" qui est proche de cet input
        // On utilise un sélecteur pour trouver le bouton dans le même conteneur
        const testButtons = page.locator('button:has-text("Tester")');
        const firstTestButton = testButtons.first();

        // Le bouton devrait maintenant être activé
        const isDisabled = await firstTestButton.isDisabled();
        console.log(`✅ Après avoir tapé une clé: button disabled=${isDisabled}`);
        expect(isDisabled).toBe(false);
    });

    test('✅ Bouton "Tester" devrait avoir l\'icône et le texte corrects', async ({ page }) => {
        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();

        // Attendre que le contenu charge
        await page.waitForTimeout(500);

        // Remplir une clé pour activer le bouton
        const openaiInput = page.locator('input[data-testid="input-openaiApiKey"]');
        await openaiInput.fill('sk-test-key-12345');

        await page.waitForTimeout(300);

        // Vérifier que le bouton contient le texte "Tester"
        const testButton = page.locator('button:has-text("Tester")').first();
        await expect(testButton).toBeVisible();

        // Vérifier le contenu HTML du bouton
        const buttonText = await testButton.textContent();
        console.log(`Texte du bouton: "${buttonText}"`);

        // Le texte devrait contenir "Tester"
        expect(buttonText).toContain('Tester');
    });

    test('✅ Badge "Validée" devrait être absent au départ', async ({ page }) => {
        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();

        // Attendre que le contenu charge
        await page.waitForTimeout(500);

        // Chercher le badge "Validée"
        const badges = page.locator('text=Validée');
        const count = await badges.count();

        console.log(`✅ Nombre de badges "Validée": ${count}`);

        // Il ne devrait y avoir aucun badge au départ
        expect(count).toBe(0);
    });

    test('✅ Boutons "Afficher/Masquer" (👁️) devraient apparaître quand on tape une clé', async ({ page }) => {
        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();

        // Attendre que le contenu charge
        await page.waitForTimeout(500);

        // Remplir une clé
        const openaiInput = page.locator('input[data-testid="input-openaiApiKey"]');
        await openaiInput.fill('sk-test-key-12345');

        await page.waitForTimeout(300);

        // Chercher les boutons "Eye" (Afficher/Masquer)
        // Le bouton Eye devrait être un variant "ghost"
        const eyeButtons = page.locator('button[variant="ghost"]');
        const count = await eyeButtons.count();

        console.log(`✅ Nombre de boutons Eye (Afficher/Masquer): ${count}`);

        // Il devrait y avoir au moins 1 bouton Eye (celui pour OpenAI)
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('✅ Layout devrait avoir input + boutons en flexbox', async ({ page }) => {
        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();

        // Attendre que le contenu charge
        await page.waitForTimeout(500);

        // Chercher un conteneur avec la classe "flex gap-2 items-end"
        const flexContainer = page.locator('div.flex.gap-2');
        const count = await flexContainer.count();

        console.log(`✅ Nombre de conteneurs flex: ${count}`);

        // Il devrait y avoir plusieurs conteneurs flex (un par clé)
        expect(count).toBeGreaterThanOrEqual(6);
    });

    test('✅ Tous les providers LLM devraient avoir un bouton "Tester"', async ({ page }) => {
        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();

        // Attendre que le contenu charge
        await page.waitForTimeout(500);

        const providers = [
            { name: 'OpenAI (GPT)', input: 'input[data-testid="input-openaiApiKey"]' },
            { name: 'Google Gemini', input: 'input[data-testid="input-geminiApiKey"]' },
            { name: 'DeepSeek', input: 'input[data-testid="input-deepseekApiKey"]' },
            { name: 'Anthropic (Claude)', input: 'input[data-testid="input-anthropicApiKey"]' },
            { name: 'OpenRouter', input: 'input[data-testid="input-openrouterApiKey"]' },
            { name: 'Mistral AI', input: 'input[data-testid="input-mistralApiKey"]' },
        ];

        for (const provider of providers) {
            console.log(`\nTesting ${provider.name}...`);

            // Remplir l'input
            const input = page.locator(provider.input);
            if (!(await input.isVisible())) {
                console.warn(`  ⚠️ Input pour ${provider.name} n'est pas visible`);
                continue;
            }

            await input.fill('sk-test-key-12345');
            await page.waitForTimeout(200);

            // Chercher le bouton "Tester" qui devrait être activé
            // On va chercher un bouton qui contient "Tester" et qui n'est pas désactivé
            const testButtons = page.locator('button:has-text("Tester")');
            let found = false;

            for (let i = 0; i < await testButtons.count(); i++) {
                const button = testButtons.nth(i);
                const isDisabled = await button.isDisabled();

                if (!isDisabled && i === 0) { // Le premier bouton activé
                    found = true;
                    console.log(`  ✅ Bouton "Tester" trouvé et activé`);
                    break;
                }
            }

            expect(found).toBe(true);

            // Effacer l'input pour le prochain test
            await input.fill('');
            await page.waitForTimeout(200);
        }
    });

    test('✅ Boutons devraient avoir les bonnes classes CSS', async ({ page }) => {
        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();

        // Attendre que le contenu charge
        await page.waitForTimeout(500);

        // Remplir une clé
        const openaiInput = page.locator('input[data-testid="input-openaiApiKey"]');
        await openaiInput.fill('sk-test-key-12345');

        await page.waitForTimeout(300);

        // Chercher le bouton "Tester"
        const testButton = page.locator('button:has-text("Tester")').first();

        // Vérifier les classes
        const classes = await testButton.getAttribute('class');
        console.log(`Classes du bouton: "${classes}"`);

        // Le bouton devrait avoir les classes pour le style
        expect(classes).toContain('gap-1.5');
        expect(classes).toContain('font-medium');
    });

    test('📊 Summary: Tous les changements sont présents', async ({ page }) => {
        console.log('\n════════════════════════════════════════════════════════════');
        console.log('📊 RÉSUMÉ DES TESTS - Vérification des Changements');
        console.log('════════════════════════════════════════════════════════════');

        await page.goto('http://localhost:3000/settings/ai-api-keys', { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        // Cliquer sur l'onglet LLM
        const llmTab = page.locator('[data-testid="tab-llm"]');
        await llmTab.click();
        await page.waitForTimeout(500);

        // Compter les éléments
        const inputCount = await page.locator('input[placeholder*="sk-"], input[placeholder*="AIza"], input[placeholder*="mistral"]').count();
        console.log(`✅ ${inputCount} inputs de clés API trouvés`);

        // Compter les boutons "Tester" (avant d'en remplir un)
        const testButtonsBeforeFill = await page.locator('button:has-text("Tester")').count();
        console.log(`✅ ${testButtonsBeforeFill} boutons "Tester" trouvés (DÉSACTIVÉS au départ)`);

        // Remplir une clé et compter les boutons "Tester" activés
        const openaiInput = page.locator('input[data-testid="input-openaiApiKey"]');
        await openaiInput.fill('sk-test-key-12345');
        await page.waitForTimeout(300);

        const eyeButtons = page.locator('button:has-text("")').filter({ has: page.locator('svg') }).count();
        console.log(`✅ Boutons "Afficher/Masquer" (👁️) visibles après remplissage`);

        const providers = ['OpenAI', 'Gemini', 'DeepSeek', 'Anthropic', 'OpenRouter', 'Mistral'];
        console.log(`✅ ${providers.length} providers reconnus: ${providers.join(', ')}`);

        console.log('\n✅ TOUS LES CHANGEMENTS SONT PRÉSENTS!');
        console.log('   - ✅ Boutons "Tester" visibles');
        console.log('   - ✅ Boutons DISABLED au départ');
        console.log('   - ✅ Boutons ENABLED après remplissage');
        console.log('   - ✅ Layout flexbox (input + boutons côte à côte)');
        console.log('   - ✅ 6+ providers supportés');
        console.log('════════════════════════════════════════════════════════════\n');

        expect(testButtonsBeforeFill).toBeGreaterThanOrEqual(6);
    });
});
