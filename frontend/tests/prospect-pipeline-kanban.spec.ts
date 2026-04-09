import { test, expect } from '@playwright/test';

/**
 * 🧪 Tests E2E Playwright — Pipeline Kanban Prospects
 *
 * Valide les fonctionnalités kanban inspirées de Bitrix24/Odoo CRM :
 * - Accès à la page pipeline depuis la liste des prospects
 * - Affichage des colonnes kanban par stage
 * - Bouton "Actualiser"
 * - Toggle du funnel chart
 * - Accès au bouton "Marquer comme Perdu" et affichage de la modale Lost Reason
 */

test.describe('Pipeline Kanban Prospects', () => {
  test.beforeEach(async ({ page }) => {
    // Authentification
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'test@playwright.com');
    await page.fill('input[type="password"]', 'Test1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  // ──────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────

  test('should navigate to pipeline page from prospects list', async ({ page }) => {
    await page.goto('http://localhost:3000/prospects');
    await page.waitForLoadState('networkidle');

    // Le bouton "Vue Pipeline" doit être visible
    const pipelineButton = page.locator('a[href="/prospects/pipeline"]').first();
    await expect(pipelineButton).toBeVisible({ timeout: 5000 });

    // Cliquer sur le bouton
    await pipelineButton.click();
    await page.waitForURL('**/prospects/pipeline', { timeout: 10000 });

    // Vérifier qu'on est bien sur la page pipeline
    expect(page.url()).toContain('/prospects/pipeline');
  });

  // ──────────────────────────────────────────────
  // Affichage du pipeline kanban
  // ──────────────────────────────────────────────

  test('should display kanban pipeline page with stage columns', async ({ page }) => {
    await page.goto('http://localhost:3000/prospects/pipeline');
    await page.waitForLoadState('networkidle');

    // Attendre le chargement du pipeline (le spinner disparaît)
    await page.waitForSelector('text=Pipeline CRM', { timeout: 15000 });

    // Vérifier que les colonnes de stage apparaissent
    // Au moins quelques colonnes doivent être visibles
    const nouveauColumn = page.locator('text=Nouveau').first();
    await expect(nouveauColumn).toBeVisible({ timeout: 10000 });

    const contacteColumn = page.locator('text=Contacté').first();
    await expect(contacteColumn).toBeVisible({ timeout: 5000 });

    const qualifieColumn = page.locator('text=Qualifié').first();
    await expect(qualifieColumn).toBeVisible({ timeout: 5000 });
  });

  test('should show pipeline header with total prospects and conversion rate', async ({ page }) => {
    await page.goto('http://localhost:3000/prospects/pipeline');
    await page.waitForSelector('text=Pipeline CRM', { timeout: 15000 });

    // Le titre "Pipeline CRM" doit être visible
    await expect(page.locator('h2:has-text("Pipeline CRM")')).toBeVisible({ timeout: 5000 });

    // Le badge de taux de conversion doit apparaître
    const conversionBadge = page.locator('text=converti').first();
    await expect(conversionBadge).toBeVisible({ timeout: 5000 });
  });

  // ──────────────────────────────────────────────
  // Toolbar actions
  // ──────────────────────────────────────────────

  test('should refresh pipeline when clicking Actualiser button', async ({ page }) => {
    await page.goto('http://localhost:3000/prospects/pipeline');
    await page.waitForSelector('text=Pipeline CRM', { timeout: 15000 });

    // Intercepter l'appel API pipeline
    const pipelineRequest = page.waitForResponse(
      (response) =>
        response.url().includes('/prospects/pipeline') && response.request().method() === 'GET',
      { timeout: 10000 },
    );

    // Cliquer sur "Actualiser"
    const refreshButton = page.locator('button:has-text("Actualiser")').first();
    await refreshButton.click();

    // Vérifier que l'API a été appelée
    const response = await pipelineRequest;
    expect(response.status()).toBe(200);
  });

  test('should toggle funnel chart on/off', async ({ page }) => {
    await page.goto('http://localhost:3000/prospects/pipeline');
    await page.waitForSelector('text=Pipeline CRM', { timeout: 15000 });

    // Le chart est caché par défaut
    await expect(page.locator('text=Tunnel de Conversion')).not.toBeVisible();

    // Cliquer sur "Funnel" pour l'afficher
    const funnelButton = page.locator('button:has-text("Funnel")').first();
    await expect(funnelButton).toBeVisible({ timeout: 5000 });
    await funnelButton.click();

    // Le chart doit maintenant être visible
    await expect(page.locator('text=Tunnel de Conversion')).toBeVisible({ timeout: 5000 });

    // Re-cliquer pour le masquer
    const hideButton = page.locator('button:has-text("Masquer")').first();
    await hideButton.click();
    await expect(page.locator('text=Tunnel de Conversion')).not.toBeVisible();
  });

  test('should have "Nouveau prospect" button that navigates to new prospect form', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/prospects/pipeline');
    await page.waitForSelector('text=Pipeline CRM', { timeout: 15000 });

    const addButton = page.locator('button:has-text("Nouveau prospect")').first();
    await expect(addButton).toBeVisible({ timeout: 5000 });

    await addButton.click();
    await page.waitForURL('**/prospects/new', { timeout: 10000 });
    expect(page.url()).toContain('/prospects/new');
  });

  // ──────────────────────────────────────────────
  // API data validation
  // ──────────────────────────────────────────────

  test('should call GET /prospects/pipeline API on load', async ({ page }) => {
    // Intercepter l'appel avant de naviguer
    const pipelineRequest = page.waitForResponse(
      (response) =>
        response.url().includes('/prospects/pipeline') && response.request().method() === 'GET',
      { timeout: 15000 },
    );

    await page.goto('http://localhost:3000/prospects/pipeline');

    const response = await pipelineRequest;
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Vérifier la structure de la réponse API
    expect(data).toHaveProperty('columns');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('conversionRate');
    expect(Array.isArray(data.columns)).toBe(true);
    expect(data.columns.length).toBe(7);
  });

  test('should show pipeline column structure from API response', async ({ page }) => {
    // Mock ou vérification réelle : les colonnes doivent avoir les bons keys
    await page.goto('http://localhost:3000/prospects/pipeline');
    await page.waitForSelector('text=Pipeline CRM', { timeout: 15000 });

    // Vérifier toutes les 7 colonnes
    const expectedLabels = ['Nouveau', 'Contacté', 'Qualifié', 'Visite', 'Offre', 'Gagné', 'Perdu'];
    for (const label of expectedLabels) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  // ──────────────────────────────────────────────
  // Lost Reason Modal
  // ──────────────────────────────────────────────

  test('should show LostReasonModal with reason options when clicking Perdu on a card', async ({
    page,
  }) => {
    await page.goto('http://localhost:3000/prospects/pipeline');
    await page.waitForSelector('text=Pipeline CRM', { timeout: 15000 });

    // Chercher un bouton "Perdu" sur une carte (visible au hover)
    // On survole la première carte disponible
    const firstCard = page
      .locator('.group')
      .filter({ hasText: 'Avancer' })
      .first();

    const cardExists = await firstCard.count();
    if (cardExists === 0) {
      // Pipeline vide — le test est ignoré proprement
      test.skip();
      return;
    }

    // Hover sur la carte pour faire apparaître les boutons
    await firstCard.hover();

    // Cliquer sur "Perdu"
    const lostButton = firstCard.locator('button:has-text("Perdu")');
    await expect(lostButton).toBeVisible({ timeout: 3000 });
    await lostButton.click();

    // La modale Lost Reason doit s'ouvrir
    await expect(page.locator('text=Marquer comme Perdu')).toBeVisible({ timeout: 5000 });

    // Les raisons prédéfinies doivent être visibles
    await expect(page.locator('text=Prix trop élevé')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Concurrent choisi')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Financement refusé')).toBeVisible({ timeout: 3000 });

    // Le bouton "Confirmer la perte" doit être désactivé tant qu'aucune raison n'est choisie
    const confirmButton = page.locator('button:has-text("Confirmer la perte")');
    await expect(confirmButton).toBeDisabled({ timeout: 3000 });

    // Sélectionner une raison
    await page.locator('button:has-text("Prix trop élevé")').click();

    // Le bouton "Confirmer la perte" doit être activé
    await expect(confirmButton).toBeEnabled({ timeout: 3000 });

    // Fermer la modale avec Annuler
    await page.locator('button:has-text("Annuler")').click();
    await expect(page.locator('text=Marquer comme Perdu')).not.toBeVisible({ timeout: 3000 });
  });
});
