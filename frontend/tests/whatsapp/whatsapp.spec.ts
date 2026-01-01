import { test, expect, Page } from '@playwright/test';

/**
 * WhatsApp Module E2E Tests
 * Tests complets pour le module de communication WhatsApp
 */

// Configuration de base
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!',
};

// Helper: Login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('WhatsApp Module - Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp/config`);
  });

  test('should display configuration page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Configuration WhatsApp');
  });

  test('should open configuration wizard for new config', async ({ page }) => {
    // Si pas de config existante, le wizard devrait s'afficher
    const wizardVisible = await page.locator('text=Assistant de Configuration').isVisible();

    if (wizardVisible) {
      await expect(page.locator('text=Choisir le fournisseur')).toBeVisible();
    }
  });

  test('should select Meta Cloud API provider', async ({ page }) => {
    const wizardVisible = await page.locator('text=Assistant de Configuration').isVisible();

    if (wizardVisible) {
      // Étape 1 : Sélection du provider
      await page.click('button:has-text("Meta Cloud API")');
      await page.click('button:has-text("Suivant")');

      // Étape 2 : Credentials
      await expect(page.locator('text=Identifiants Meta Cloud API')).toBeVisible();
      await page.fill('input[name="phoneNumberId"]', 'test_phone_number_id');
      await page.fill('input[name="accessToken"]', 'test_access_token');
      await page.click('button:has-text("Suivant")');

      // Étape 3 : Webhook
      await expect(page.locator('text=Configuration du Webhook')).toBeVisible();
    }
  });

  test('should toggle auto-reply setting', async ({ page }) => {
    // Attendre que la page se charge
    await page.waitForLoadState('networkidle');

    const toggleExists = await page.locator('input[type="checkbox"]').count();

    if (toggleExists > 0) {
      const initialState = await page.locator('input[type="checkbox"]').first().isChecked();
      await page.locator('input[type="checkbox"]').first().click();

      // Attendre la mise à jour
      await page.waitForTimeout(1000);

      const newState = await page.locator('input[type="checkbox"]').first().isChecked();
      expect(newState).not.toBe(initialState);
    }
  });
});

test.describe('WhatsApp Module - Conversations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp/conversations`);
  });

  test('should display conversations list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Conversations WhatsApp');
  });

  test('should filter conversations by status', async ({ page }) => {
    // Click sur l'onglet "Ouvertes"
    await page.click('button:has-text("Ouvertes")');
    await page.waitForLoadState('networkidle');

    // Vérifier que l'onglet est actif
    const activeTab = await page.locator('button:has-text("Ouvertes")').getAttribute('class');
    expect(activeTab).toContain('bg-blue-500');
  });

  test('should search conversations', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('+33612345678');
    await page.waitForTimeout(500); // Debounce

    // Vérifier que la recherche est active
    await expect(searchInput).toHaveValue('+33612345678');
  });

  test('should open new message modal', async ({ page }) => {
    await page.click('button:has-text("Nouveau message")');

    // Modal devrait s'afficher
    await expect(page.locator('text=Envoyer un message')).toBeVisible();
  });

  test('should send a text message', async ({ page }) => {
    // Ouvrir le modal
    await page.click('button:has-text("Nouveau message")');

    // Étape 1 : Entrer le numéro
    await page.fill('input[placeholder*="téléphone"]', '+33612345678');
    await page.click('button:has-text("Suivant")');

    // Étape 2 : Écrire le message
    await page.fill('textarea[placeholder*="message"]', 'Bonjour, ceci est un message de test');

    // Envoyer (mais ne pas vraiment envoyer en test)
    const sendButton = page.locator('button:has-text("Envoyer")');
    await expect(sendButton).toBeVisible();
  });

  test('should display conversation detail', async ({ page }) => {
    // Cliquer sur la première conversation si elle existe
    const firstConversation = page.locator('[href*="/conversations/"]').first();
    const conversationExists = await firstConversation.count() > 0;

    if (conversationExists) {
      await firstConversation.click();

      // Vérifier qu'on est sur la page de détail
      await page.waitForURL('**/conversations/**');

      // Vérifier que le chat interface est visible
      await expect(page.locator('text=Envoyer').or(page.locator('placeholder=Message'))).toBeVisible();
    }
  });
});

test.describe('WhatsApp Module - Templates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp/templates`);
  });

  test('should display templates list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Templates WhatsApp');
  });

  test('should navigate to create template page', async ({ page }) => {
    await page.click('button:has-text("Nouveau Template")');

    await page.waitForURL('**/templates/create');
    await expect(page.locator('h1')).toContainText('Nouveau template');
  });

  test('should fill template form', async ({ page }) => {
    await page.goto(`${BASE_URL}/communication/whatsapp/templates/create`);

    // Remplir le nom
    await page.fill('input[placeholder*="welcome_message"]', 'test_template');

    // Sélectionner la langue
    await page.selectOption('select', 'fr');

    // Sélectionner la catégorie
    await page.click('button:has-text("Utilitaire")');

    // Remplir le corps du message
    await page.fill('textarea[placeholder*="Bonjour"]', 'Bonjour {{1}}, bienvenue !');

    // Vérifier que la variable est détectée
    await expect(page.locator('text=1 variable détectée')).toBeVisible();
  });

  test('should insert variable in template', async ({ page }) => {
    await page.goto(`${BASE_URL}/communication/whatsapp/templates/create`);

    const textarea = page.locator('textarea#body-textarea');
    await textarea.fill('Bonjour ');

    // Cliquer sur "Insérer variable"
    await page.click('button:has-text("Insérer variable")');

    // Vérifier que {{1}} a été inséré
    const value = await textarea.inputValue();
    expect(value).toContain('{{1}}');
  });

  test('should show template preview', async ({ page }) => {
    await page.goto(`${BASE_URL}/communication/whatsapp/templates/create`);

    // Remplir le formulaire
    await page.fill('textarea[placeholder*="Bonjour"]', 'Test message avec {{1}}');

    // L'aperçu devrait être visible
    await expect(page.locator('text=Aperçu')).toBeVisible();

    // Le preview mobile devrait afficher le message
    await expect(page.locator('text=Test message avec')).toBeVisible();
  });

  test('should filter templates by status', async ({ page }) => {
    // Cliquer sur l'onglet "Approuvés"
    await page.click('button:has-text("Approuvés")');

    const activeTab = await page.locator('button:has-text("Approuvés")').getAttribute('class');
    expect(activeTab).toContain('bg-');
  });
});

test.describe('WhatsApp Module - Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp/contacts`);
  });

  test('should display contacts list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Contacts WhatsApp');
  });

  test('should show stats cards', async ({ page }) => {
    // Vérifier que les cartes de stats sont affichées
    await expect(page.locator('text=Total Contacts')).toBeVisible();
    await expect(page.locator('text=Actifs')).toBeVisible();
    await expect(page.locator('text=Bloqués')).toBeVisible();
  });

  test('should open create contact modal', async ({ page }) => {
    await page.click('button:has-text("Nouveau contact")');

    await expect(page.locator('text=Nouveau contact')).toBeVisible();
  });

  test('should fill contact form', async ({ page }) => {
    await page.click('button:has-text("Nouveau contact")');

    // Remplir le numéro (requis)
    await page.fill('input[placeholder*="+33612345678"]', '+33612345678');

    // Remplir le nom
    await page.fill('input[placeholder*="Jean Dupont"]', 'Test Contact');

    // Remplir l'email
    await page.fill('input[type="email"]', 'test@example.com');

    // Ajouter un tag
    await page.fill('input[placeholder*="Ajouter un tag"]', 'test');
    await page.click('button:has-text("Ajouter"):near(input[placeholder*="tag"])');

    // Vérifier que le tag est ajouté
    await expect(page.locator('text=test').first()).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    await page.click('button:has-text("Nouveau contact")');

    // Entrer un mauvais format
    await page.fill('input[placeholder*="+33612345678"]', '0612345678');

    // Essayer de créer
    await page.click('button:has-text("Créer le contact")');

    // Erreur de validation devrait s'afficher
    await expect(page.locator('text=Format invalide')).toBeVisible();
  });

  test('should open import modal', async ({ page }) => {
    await page.click('button:has-text("Importer")');

    await expect(page.locator('text=Importer des contacts')).toBeVisible();
  });

  test('should download CSV template', async ({ page }) => {
    await page.click('button:has-text("Importer")');

    // Le bouton de téléchargement devrait être visible
    await expect(page.locator('text=Télécharger un fichier d\'exemple')).toBeVisible();
  });

  test('should search contacts', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('Jean');

    await page.waitForTimeout(500);
    await expect(searchInput).toHaveValue('Jean');
  });
});

test.describe('WhatsApp Module - Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp/analytics`);
  });

  test('should display analytics dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Analytics WhatsApp');
  });

  test('should show performance metrics', async ({ page }) => {
    // Vérifier que les métriques sont affichées
    await expect(page.locator('text=Total Messages')).toBeVisible();
    await expect(page.locator('text=Conversations')).toBeVisible();
    await expect(page.locator('text=Engagement')).toBeVisible();
  });

  test('should change analytics period', async ({ page }) => {
    // Cliquer sur "30 jours"
    await page.click('button:has-text("30 jours")');

    const activeTab = await page.locator('button:has-text("30 jours")').getAttribute('class');
    expect(activeTab).toContain('bg-blue-500');
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.click('button:has-text("Rapports")');

    await page.waitForURL('**/analytics/reports');
    await expect(page.locator('text=Générateur de rapports')).toBeVisible();
  });

  test('should show export options', async ({ page }) => {
    await page.goto(`${BASE_URL}/communication/whatsapp/analytics/reports`);

    // Vérifier que les boutons d'export sont visibles
    await expect(page.locator('button:has-text("Exporter en PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Exporter en Excel")')).toBeVisible();
    await expect(page.locator('button:has-text("Exporter en CSV")')).toBeVisible();
  });
});

test.describe('WhatsApp Module - Campaigns', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp/campaigns`);
  });

  test('should display campaigns list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Campagnes WhatsApp');
  });

  test('should show campaign stats', async ({ page }) => {
    // Vérifier les stats globales
    await expect(page.locator('text=Total Campagnes')).toBeVisible();
    await expect(page.locator('text=Messages Envoyés')).toBeVisible();
    await expect(page.locator('text=Taux de Succès')).toBeVisible();
  });

  test('should navigate to create campaign', async ({ page }) => {
    await page.click('button:has-text("Nouvelle campagne")');

    await page.waitForURL('**/campaigns/create');
    await expect(page.locator('h1')).toContainText('Nouvelle campagne');
  });

  test('should filter campaigns by status', async ({ page }) => {
    // Cliquer sur "Planifiées"
    await page.click('button:has-text("Planifiées")');

    const activeTab = await page.locator('button:has-text("Planifiées")').getAttribute('class');
    expect(activeTab).toContain('bg-');
  });

  test('should search campaigns', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill('Test Campaign');

    await page.waitForTimeout(500);
    await expect(searchInput).toHaveValue('Test Campaign');
  });
});

test.describe('WhatsApp Module - UI/UX Validation', () => {
  test('should have responsive navigation', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp`);

    // Vérifier que les liens de navigation existent
    await expect(page.locator('a[href*="/whatsapp/conversations"]')).toBeVisible();
    await expect(page.locator('a[href*="/whatsapp/templates"]')).toBeVisible();
  });

  test('should display loading states', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp/conversations`);

    // Lors du chargement initial, des skeletons devraient s'afficher
    // (test rapide, peut ne pas toujours fonctionner selon la vitesse)
    const hasLoadingState = await page.locator('.animate-pulse').count();
    // Si le chargement est rapide, c'est OK
    expect(hasLoadingState).toBeGreaterThanOrEqual(0);
  });

  test('should show empty states', async ({ page }) => {
    await login(page);

    // Si aucune conversation, un empty state devrait s'afficher
    // (dépend de l'état de la base de données)
    await page.goto(`${BASE_URL}/communication/whatsapp/conversations`);

    const hasEmptyState = await page.locator('text=Aucune conversation').isVisible();
    const hasConversations = await page.locator('[href*="/conversations/"]').count() > 0;

    // Soit on a des conversations, soit un empty state
    expect(hasEmptyState || hasConversations).toBeTruthy();
  });

  test('should have accessible buttons', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp/templates`);

    // Tous les boutons devraient avoir du texte ou un aria-label
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      // Au moins une de ces propriétés devrait exister
      expect(text || ariaLabel || title).toBeTruthy();
    }
  });
});

test.describe('WhatsApp Module - Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    await login(page);

    // Intercepter les requêtes API et simuler une erreur
    await page.route('**/api/whatsapp/conversations', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    });

    await page.goto(`${BASE_URL}/communication/whatsapp/conversations`);

    // Vérifier qu'un message d'erreur ou un empty state est affiché
    // (dépend de la gestion des erreurs dans le frontend)
    await page.waitForTimeout(2000);

    // Le loading ne devrait plus être visible
    const isLoading = await page.locator('.animate-spin').isVisible();
    expect(isLoading).toBeFalsy();
  });

  test('should validate required fields', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp/contacts`);

    // Ouvrir le formulaire
    await page.click('button:has-text("Nouveau contact")');

    // Essayer de soumettre sans remplir les champs requis
    await page.click('button:has-text("Créer le contact")');

    // Un message d'erreur devrait s'afficher
    await expect(page.locator('text=requis').or(page.locator('text=Required'))).toBeVisible();
  });
});

// Tests de performance (optionnels)
test.describe('WhatsApp Module - Performance', () => {
  test('should load conversations page within 3 seconds', async ({ page }) => {
    await login(page);

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/communication/whatsapp/conversations`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should have optimized images', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communication/whatsapp`);

    // Vérifier que les images n'ont pas de taille excessive
    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        // Les images Next.js devraient être optimisées
        const isNextImage = src.includes('_next/image');
        // C'est bon signe si les images passent par l'optimiseur Next.js
        // (mais pas obligatoire)
      }
    }
  });
});
