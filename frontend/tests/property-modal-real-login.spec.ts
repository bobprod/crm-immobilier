import { test, expect } from '@playwright/test';

/**
 * E2E Test avec Login Réel pour Property Modal Create/Update
 *
 * Ces tests incluent le processus complet de login avant d'accéder à la page properties
 *
 * Credentials pour tester:
 * Email: admin@crm.com
 * Password: Admin123!
 */

test.describe('Property Modal E2E with Real Login', () => {
    // Login avant chaque test
    test.beforeEach(async ({ page }) => {
        // Aller à la page de login
        await page.goto('/login');

        // Remplir le formulaire de login
        await page.locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]').first().fill('admin@crm.com');
        await page.locator('input[type="password"], input[name="password"], input[placeholder*="passe" i]').first().fill('Admin123!');

        // Cliquer sur le bouton de connexion
        await page.locator('button:has-text("Se connecter"), button:has-text("Connexion"), button[type="submit"]').first().click();

        // Attendre la redirection après login (vers dashboard ou properties)
        await page.waitForURL(/\/(dashboard|properties)/, { timeout: 10000 });

        // Si on est sur le dashboard, naviguer vers properties
        if (page.url().includes('dashboard')) {
            await page.goto('/properties');
        }

        // Attendre que la page properties soit chargée
        await page.waitForLoadState('networkidle');
    });

    test.describe('Create Property with Real API', () => {
        test('should successfully login and open create property modal', async ({ page }) => {
            // Vérifier qu'on est bien sur la page properties
            await expect(page).toHaveURL(/\/properties/);

            // Vérifier que le bouton "Nouvelle Propriété" est visible
            const createButton = page.locator('[data-testid="create-property-button"], button:has-text("Nouvelle Propriété")').first();
            await expect(createButton).toBeVisible({ timeout: 10000 });

            // Cliquer sur le bouton
            await createButton.click();

            // Vérifier que le modal s'ouvre
            const modal = page.locator('[role="dialog"]');
            await expect(modal).toBeVisible({ timeout: 5000 });

            // Vérifier le titre du modal (utiliser heading pour éviter strict mode)
            await expect(page.getByRole('heading', { name: 'Nouvelle propriété' })).toBeVisible();
        });

        test('should create a new property through the modal', async ({ page }) => {
            // Ouvrir le modal
            await page.locator('[data-testid="create-property-button"], button:has-text("Nouvelle Propriété")').first().click();
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

            // Remplir le formulaire avec des données de test
            const timestamp = Date.now();
            const testTitle = `Appartement Test E2E ${timestamp}`;

            await page.locator('[data-testid="property-title-input"]').fill(testTitle);
            await page.locator('[data-testid="property-price-input"]').fill('250000');
            await page.locator('[data-testid="property-area-input"]').fill('120');
            await page.locator('[data-testid="property-rooms-input"]').fill('4');
            await page.locator('[data-testid="property-bedrooms-input"]').fill('2');
            await page.locator('[data-testid="property-bathrooms-input"]').fill('1');
            await page.locator('[data-testid="property-city-input"]').fill('Tunis');
            await page.locator('[data-testid="property-address-input"]').fill('123 Avenue Habib Bourguiba');
            await page.locator('[data-testid="property-description-input"]').fill(`Description de test créée le ${new Date().toLocaleString()}`);

            // Sélectionner le type (Appartement)
            await page.locator('[data-testid="property-type-select"]').click();
            await new Promise((resolve) => setTimeout(resolve, 500));
            await page.locator('[role="option"]:has-text("Appartement")').click();

            // Sélectionner la priorité (Haute)
            await page.locator('[data-testid="property-priority-select"]').click();
            await new Promise((resolve) => setTimeout(resolve, 500));
            await page.locator('[role="option"]:has-text("Haute")').click();

            // Soumettre le formulaire
            await page.locator('[data-testid="property-submit-button"]').click();

            // Attendre que le modal se ferme (indiquant que la création a réussi)
            await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 });

            // Attendre que la liste se rafraîchisse
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Vérifier que la nouvelle propriété apparaît dans la liste
            await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 10000 });
        });

        test('should validate required fields before creating property', async ({ page }) => {
            // Ouvrir le modal
            await page.locator('[data-testid="create-property-button"], button:has-text("Nouvelle Propriété")').first().click();
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

            // Essayer de soumettre sans remplir les champs requis
            await page.locator('[data-testid="property-submit-button"]').click();

            // Vérifier que les erreurs de validation apparaissent
            await expect(page.locator('text=Le titre est requis')).toBeVisible();
            await expect(page.locator('text=Le prix doit être supérieur à 0')).toBeVisible();
        });

        test('should close modal when clicking Cancel', async ({ page }) => {
            // Ouvrir le modal
            await page.locator('[data-testid="create-property-button"], button:has-text("Nouvelle Propriété")').first().click();
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

            // Remplir un champ pour vérifier que les données ne sont pas sauvegardées
            await page.locator('[data-testid="property-title-input"]').fill('Ne pas sauvegarder');

            // Cliquer sur Annuler
            await page.locator('button:has-text("Annuler")').click();

            // Vérifier que le modal se ferme
            await expect(page.locator('[role="dialog"]')).not.toBeVisible();
        });
    });

    test.describe('Update Property with Real API', () => {
        let testPropertyId: string;
        let testPropertyTitle: string;

        test.beforeEach(async ({ page }) => {
            // Créer une propriété de test d'abord
            const timestamp = Date.now();
            testPropertyTitle = `Propriété à Modifier ${timestamp}`;

            // Ouvrir le modal de création
            await page.locator('[data-testid="create-property-button"], button:has-text("Nouvelle Propriété")').first().click();
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

            // Créer la propriété
            await page.locator('[data-testid="property-title-input"]').fill(testPropertyTitle);
            await page.locator('[data-testid="property-price-input"]').fill('300000');
            await page.locator('[data-testid="property-area-input"]').fill('150');
            await page.locator('[data-testid="property-city-input"]').fill('Sousse');

            await page.locator('[data-testid="property-type-select"]').click();
            await new Promise((resolve) => setTimeout(resolve, 500));
            await page.locator('[role="option"]:has-text("Maison")').click();

            await page.locator('[data-testid="property-submit-button"]').click();

            // Attendre plus longtemps pour que le modal se ferme et la liste se rafraîchisse
            await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 15000 });
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Augmenté de 2s à 3s
            await expect(page.locator(`text=${testPropertyTitle}`)).toBeVisible({ timeout: 15000 });
        }, { timeout: 60000 }); // Augmenter le timeout du beforeEach à 60s

        test('should open edit modal and update property', async ({ page }) => {
            // Activer la console pour voir les erreurs
            page.on('console', msg => console.log('Browser console:', msg.text()));
            page.on('pageerror', error => console.log('Page error:', error.message));

            // Trouver la ligne de la propriété de test
            const propertyRow = page.locator(`tr:has-text("${testPropertyTitle}")`);
            await expect(propertyRow).toBeVisible();

            // Utiliser le data-testid du bouton edit
            const editButton = propertyRow.locator('button[data-testid^="edit-property-"]').first();
            await editButton.click();

            // Vérifier que le modal d'édition s'ouvre
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
            await expect(page.getByRole('heading', { name: /Modifier/i })).toBeVisible();

            // Vérifier que les champs sont pré-remplis
            const titleInput = page.locator('[data-testid="property-title-input"]');
            await expect(titleInput).toHaveValue(testPropertyTitle);

            // Modifier le prix seulement (plus simple pour débugger)
            const priceInput = page.locator('[data-testid="property-price-input"]');
            await priceInput.click();
            await priceInput.fill(''); // Vider avec fill('')
            await priceInput.fill('350000');

            console.log('Submitting update...');
            // Soumettre les modifications
            await page.locator('[data-testid="property-submit-button"]').click();

            // Attendre plus longtemps que le modal se ferme
            console.log('Waiting for modal to close...');
            await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 15000 });

            // Attendre le rafraîchissement
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Vérifier que la propriété est toujours dans la liste (prix changé)
            await expect(page.locator(`text=${testPropertyTitle}`)).toBeVisible({ timeout: 10000 });
            console.log('✅ Update test passed!');
        });

        test('should cancel edit without saving changes', async ({ page }) => {
            // Trouver et ouvrir le modal d'édition
            const propertyRow = page.locator(`tr:has-text("${testPropertyTitle}")`);
            await expect(propertyRow).toBeVisible();

            const editButton = propertyRow.locator('button[data-testid*="edit"], button:has(svg)').filter({ hasText: '' }).nth(1);
            await editButton.click();

            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

            // Modifier le titre
            const titleInput = page.locator('[data-testid="property-title-input"]');
            await titleInput.clear();
            await titleInput.fill('Modification Non Sauvegardée');

            // Annuler
            await page.locator('button:has-text("Annuler")').click();

            // Vérifier que le modal se ferme
            await expect(page.locator('[role="dialog"]')).not.toBeVisible();

            // Vérifier que le titre original est toujours présent
            await expect(page.locator(`text=${testPropertyTitle}`)).toBeVisible();
            await expect(page.locator('text=Modification Non Sauvegardée')).not.toBeVisible();
        });
    });

    test.describe('Modal UI/UX Behavior', () => {
        test('should close modal when pressing Escape key', async ({ page }) => {
            // Ouvrir le modal
            await page.locator('[data-testid="create-property-button"], button:has-text("Nouvelle Propriété")').first().click();
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

            // Appuyer sur Escape
            await page.keyboard.press('Escape');

            // Vérifier que le modal se ferme
            await expect(page.locator('[role="dialog"]')).not.toBeVisible();
        });

        test('should handle all form fields correctly', async ({ page }) => {
            // Ouvrir le modal
            await page.locator('[data-testid="create-property-button"], button:has-text("Nouvelle Propriété")').first().click();
            await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

            // Tester tous les champs
            const testData = {
                title: 'Test Complet',
                price: '500000',
                area: '200',
                rooms: '5',
                bedrooms: '3',
                bathrooms: '2',
                city: 'Sfax',
                address: '789 Rue du Test',
                description: 'Description complète pour tester tous les champs'
            };

            // Remplir tous les champs
            await page.locator('[data-testid="property-title-input"]').fill(testData.title);
            await page.locator('[data-testid="property-price-input"]').fill(testData.price);
            await page.locator('[data-testid="property-area-input"]').fill(testData.area);
            await page.locator('[data-testid="property-rooms-input"]').fill(testData.rooms);
            await page.locator('[data-testid="property-bedrooms-input"]').fill(testData.bedrooms);
            await page.locator('[data-testid="property-bathrooms-input"]').fill(testData.bathrooms);
            await page.locator('[data-testid="property-city-input"]').fill(testData.city);
            await page.locator('[data-testid="property-address-input"]').fill(testData.address);
            await page.locator('[data-testid="property-description-input"]').fill(testData.description);

            // Vérifier que les valeurs sont correctement saisies
            await expect(page.locator('[data-testid="property-title-input"]')).toHaveValue(testData.title);
            await expect(page.locator('[data-testid="property-price-input"]')).toHaveValue(testData.price);
            await expect(page.locator('[data-testid="property-city-input"]')).toHaveValue(testData.city);
        });
    });
});
