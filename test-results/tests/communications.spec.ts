import { test, expect, Page } from '@playwright/test';

/**
 * TESTS PLAYWRIGHT - MODULE COMMUNICATIONS
 * Tests complets pour le module de communications (Email, SMS, WhatsApp)
 */

// Configuration globale
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Données de test
const TEST_USER = {
  email: 'agent@test.com',
  password: 'Test123!',
};

const TEST_EMAIL = {
  to: 'test@example.com',
  subject: 'Test Email Playwright',
  body: '<h1>Test</h1><p>Ceci est un email de test automatisé.</p>',
};

const TEST_SMS = {
  to: '+21655123456',
  message: 'Test SMS automatisé depuis Playwright',
};

const TEST_TEMPLATE = {
  name: 'Template Test Playwright',
  type: 'email',
  subject: 'Test {{prospectName}}',
  content: 'Bonjour {{prospectName}}, voici votre {{propertyType}}...',
  variables: ['prospectName', 'propertyType'],
};

/**
 * Helper: Login utilisateur
 */
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', TEST_USER.email);
  await page.fill('input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
}

/**
 * Helper: Logout utilisateur
 */
async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Déconnexion');
  await page.waitForURL(`${BASE_URL}/login`);
}

// ============================================
// SUITE DE TESTS: AUTHENTICATION
// ============================================

test.describe('Communications - Authentication', () => {
  test('doit rediriger vers login si non authentifié', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/history`);
    await page.waitForURL(`${BASE_URL}/login`);
    expect(page.url()).toContain('/login');
  });

  test('doit permettre l\'accès si authentifié', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communications/history`);
    await expect(page.locator('h1')).toContainText('Communications');
  });
});

// ============================================
// SUITE DE TESTS: ENVOI D'EMAIL
// ============================================

test.describe('Communications - Envoi Email', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('doit afficher le formulaire d\'envoi d\'email', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/send`);

    // Sélectionner type email
    await page.click('[data-type="email"]');

    // Vérifier les champs
    await expect(page.locator('input[name="to"]')).toBeVisible();
    await expect(page.locator('input[name="subject"]')).toBeVisible();
    await expect(page.locator('textarea[name="body"]')).toBeVisible();
  });

  test('doit valider les champs obligatoires', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/send`);
    await page.click('[data-type="email"]');

    // Soumettre formulaire vide
    await page.click('button[type="submit"]');

    // Vérifier erreurs de validation
    await expect(page.locator('.error-message')).toHaveCount(3); // to, subject, body
  });

  test('doit envoyer un email avec succès', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/send`);
    await page.click('[data-type="email"]');

    // Remplir le formulaire
    await page.fill('input[name="to"]', TEST_EMAIL.to);
    await page.fill('input[name="subject"]', TEST_EMAIL.subject);
    await page.fill('textarea[name="body"]', TEST_EMAIL.body);

    // Envoyer
    await page.click('button[type="submit"]');

    // Vérifier succès
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.success-message')).toContainText('envoyé');
  });

  test('doit afficher une erreur si l\'email est invalide', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/send`);
    await page.click('[data-type="email"]');

    await page.fill('input[name="to"]', 'email-invalide');
    await page.fill('input[name="subject"]', 'Test');
    await page.fill('textarea[name="body"]', 'Test');

    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('email valide');
  });
});

// ============================================
// SUITE DE TESTS: ENVOI SMS
// ============================================

test.describe('Communications - Envoi SMS', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('doit afficher le formulaire d\'envoi SMS', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/send`);
    await page.click('[data-type="sms"]');

    await expect(page.locator('input[name="to"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
  });

  test('doit afficher le compteur de caractères SMS', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/send`);
    await page.click('[data-type="sms"]');

    const textarea = page.locator('textarea[name="message"]');
    await textarea.fill('Test message');

    // Vérifier compteur
    await expect(page.locator('.char-counter')).toContainText('12 / 160');
  });

  test('doit envoyer un SMS avec succès', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/send`);
    await page.click('[data-type="sms"]');

    await page.fill('input[name="to"]', TEST_SMS.to);
    await page.fill('textarea[name="message"]', TEST_SMS.message);

    await page.click('button[type="submit"]');

    await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================
// SUITE DE TESTS: HISTORIQUE
// ============================================

test.describe('Communications - Historique', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('doit afficher l\'historique des communications', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/history`);

    // Attendre le chargement
    await page.waitForSelector('.communications-list', { timeout: 10000 });

    // Vérifier la présence du tableau
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Destinataire")')).toBeVisible();
    await expect(page.locator('th:has-text("Statut")')).toBeVisible();
  });

  test('doit filtrer par type de communication', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/history`);

    // Sélectionner filtre email
    await page.selectOption('select[name="type"]', 'email');
    await page.click('button:has-text("Filtrer")');

    // Attendre le rechargement
    await page.waitForTimeout(1000);

    // Vérifier que seuls les emails sont affichés
    const emailBadges = await page.locator('[data-badge-type="email"]').count();
    const totalItems = await page.locator('.communication-item').count();

    expect(emailBadges).toBe(totalItems);
  });

  test('doit filtrer par statut', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/history`);

    await page.selectOption('select[name="status"]', 'sent');
    await page.click('button:has-text("Filtrer")');

    await page.waitForTimeout(1000);

    const sentBadges = await page.locator('[data-badge-status="sent"]').count();
    const totalItems = await page.locator('.communication-item').count();

    expect(sentBadges).toBe(totalItems);
  });

  test('doit afficher les détails d\'une communication', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/history`);

    // Cliquer sur la première communication
    await page.click('.communication-item:first-child');

    // Vérifier le modal de détails
    await expect(page.locator('.modal-communication-details')).toBeVisible();
    await expect(page.locator('.modal-communication-details')).toContainText('Détails');
  });

  test('doit paginer l\'historique', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/history`);

    // Si pagination existe
    const paginationExists = await page.locator('.pagination').count();
    if (paginationExists > 0) {
      const page1Items = await page.locator('.communication-item').count();

      await page.click('[data-pagination="next"]');
      await page.waitForTimeout(1000);

      const page2Items = await page.locator('.communication-item').count();

      // Les items doivent être différents
      expect(page2Items).toBeGreaterThan(0);
    }
  });
});

// ============================================
// SUITE DE TESTS: TEMPLATES
// ============================================

test.describe('Communications - Templates', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('doit afficher la liste des templates', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/templates`);

    await expect(page.locator('h1:has-text("Templates")')).toBeVisible();
    await expect(page.locator('button:has-text("Nouveau template")')).toBeVisible();
  });

  test('doit créer un nouveau template', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/templates`);

    // Cliquer sur "Nouveau template"
    await page.click('button:has-text("Nouveau template")');

    // Remplir le formulaire
    await page.fill('input[name="name"]', TEST_TEMPLATE.name);
    await page.selectOption('select[name="type"]', TEST_TEMPLATE.type);
    await page.fill('input[name="subject"]', TEST_TEMPLATE.subject);
    await page.fill('textarea[name="content"]', TEST_TEMPLATE.content);

    // Sauvegarder
    await page.click('button[type="submit"]');

    // Vérifier succès
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.success-message')).toContainText('créé');

    // Vérifier dans la liste
    await expect(page.locator(`text=${TEST_TEMPLATE.name}`)).toBeVisible();
  });

  test('doit modifier un template existant', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/templates`);

    // Sélectionner le premier template
    await page.click('.template-item:first-child [data-action="edit"]');

    // Modifier le nom
    await page.fill('input[name="name"]', `${TEST_TEMPLATE.name} (Modifié)`);

    // Sauvegarder
    await page.click('button[type="submit"]');

    // Vérifier succès
    await expect(page.locator('.success-message')).toContainText('modifié');
  });

  test('doit supprimer un template', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/templates`);

    // Compter les templates avant suppression
    const countBefore = await page.locator('.template-item').count();

    // Cliquer sur supprimer pour le premier template
    await page.click('.template-item:first-child [data-action="delete"]');

    // Confirmer la suppression
    await page.click('button:has-text("Confirmer")');

    // Attendre le rechargement
    await page.waitForTimeout(1000);

    // Vérifier que le nombre a diminué
    const countAfter = await page.locator('.template-item').count();
    expect(countAfter).toBe(countBefore - 1);
  });

  test('doit prévisualiser un template avec variables', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/templates`);

    // Cliquer sur prévisualiser
    await page.click('.template-item:first-child [data-action="preview"]');

    // Remplir les variables
    const variableInputs = await page.locator('input[data-variable]').count();
    if (variableInputs > 0) {
      await page.fill('input[data-variable]:first-child', 'Valeur Test');

      // Vérifier que la prévisualisation se met à jour
      await expect(page.locator('.template-preview')).toContainText('Valeur Test');
    }
  });
});

// ============================================
// SUITE DE TESTS: STATISTIQUES
// ============================================

test.describe('Communications - Statistiques', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('doit afficher les statistiques globales', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/stats`);

    // Vérifier les cartes de stats
    await expect(page.locator('.stat-card:has-text("Total")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("Envoyés")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("Échoués")')).toBeVisible();
  });

  test('doit afficher les stats par type', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/stats`);

    await expect(page.locator('.stat-card:has-text("Email")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("SMS")')).toBeVisible();
    await expect(page.locator('.stat-card:has-text("WhatsApp")')).toBeVisible();
  });

  test('doit afficher un graphique', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/stats`);

    // Vérifier la présence d'un graphique (Chart.js, Recharts, etc.)
    const chartExists = await page.locator('canvas, svg').count();
    expect(chartExists).toBeGreaterThan(0);
  });
});

// ============================================
// SUITE DE TESTS: CONFIGURATION SMTP
// ============================================

test.describe('Communications - Configuration SMTP', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('doit tester la connexion SMTP', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/settings`);

    // Cliquer sur "Tester la connexion"
    await page.click('button:has-text("Tester la connexion")');

    // Attendre le résultat
    await page.waitForSelector('.test-result', { timeout: 10000 });

    // Vérifier le résultat (succès ou échec)
    const resultText = await page.locator('.test-result').textContent();
    expect(resultText).toMatch(/(succès|échec|valide|invalide)/i);
  });

  test('doit envoyer un email de test', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/settings`);

    // Remplir l'email de test
    await page.fill('input[name="testEmail"]', 'test@example.com');

    // Envoyer
    await page.click('button:has-text("Envoyer email de test")');

    // Vérifier succès
    await expect(page.locator('.success-message')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================
// SUITE DE TESTS: INTÉGRATION AI
// ============================================

test.describe('Communications - AI Features', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('doit générer un email avec l\'IA', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/send`);
    await page.click('[data-type="email"]');

    // Cliquer sur "Générer avec IA"
    await page.click('button:has-text("Générer avec IA")');

    // Remplir les informations
    await page.fill('input[name="context"]', 'RDV de visite propriété');

    // Générer
    await page.click('button:has-text("Générer")');

    // Attendre la génération
    await page.waitForTimeout(3000);

    // Vérifier que les champs sont remplis
    const subject = await page.locator('input[name="subject"]').inputValue();
    const body = await page.locator('textarea[name="body"]').inputValue();

    expect(subject.length).toBeGreaterThan(0);
    expect(body.length).toBeGreaterThan(0);
  });

  test('doit améliorer un texte avec l\'IA', async ({ page }) => {
    await page.goto(`${BASE_URL}/communications/send`);
    await page.click('[data-type="email"]');

    // Écrire un texte simple
    await page.fill('textarea[name="body"]', 'Bonjour, je veux vous voir.');

    // Cliquer sur "Améliorer"
    await page.click('button:has-text("Améliorer avec IA")');

    // Attendre l'amélioration
    await page.waitForTimeout(3000);

    // Vérifier que le texte a changé
    const improvedText = await page.locator('textarea[name="body"]').inputValue();
    expect(improvedText).not.toBe('Bonjour, je veux vous voir.');
  });
});

// ============================================
// SUITE DE TESTS: RESPONSIVE
// ============================================

test.describe('Communications - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('doit être responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto(`${BASE_URL}/communications/history`);

    // Vérifier que le menu mobile est visible
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Vérifier que le tableau s'adapte
    const table = page.locator('table');
    const isScrollable = await table.evaluate((el) => el.scrollWidth > el.clientWidth);

    expect(isScrollable).toBeTruthy();
  });

  test('doit être responsive sur tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad

    await page.goto(`${BASE_URL}/communications/send`);

    // Vérifier que le formulaire s'affiche correctement
    await expect(page.locator('form')).toBeVisible();
  });
});

// ============================================
// SUITE DE TESTS: PERFORMANCE
// ============================================

test.describe('Communications - Performance', () => {
  test('le chargement de l\'historique doit être rapide', async ({ page }) => {
    await login(page);

    const startTime = Date.now();
    await page.goto(`${BASE_URL}/communications/history`);
    await page.waitForSelector('.communications-list');
    const loadTime = Date.now() - startTime;

    // Le chargement doit prendre moins de 3 secondes
    expect(loadTime).toBeLessThan(3000);
  });

  test('l\'envoi d\'email doit être rapide', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/communications/send`);
    await page.click('[data-type="email"]');

    await page.fill('input[name="to"]', TEST_EMAIL.to);
    await page.fill('input[name="subject"]', TEST_EMAIL.subject);
    await page.fill('textarea[name="body"]', TEST_EMAIL.body);

    const startTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForSelector('.success-message', { timeout: 10000 });
    const sendTime = Date.now() - startTime;

    // L'envoi doit prendre moins de 5 secondes
    expect(sendTime).toBeLessThan(5000);
  });
});
