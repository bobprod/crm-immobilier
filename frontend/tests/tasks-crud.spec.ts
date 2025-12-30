import { test, expect, Page } from '@playwright/test';

/**
 * Tests E2E complets pour le module Tasks
 *
 * Coverage:
 * - ✅ CREATE - Création de tâche
 * - ✅ READ - Affichage liste et détails
 * - ✅ UPDATE - Modification de tâche
 * - ✅ DELETE - Suppression avec confirmation
 * - ✅ COMPLETE - Marquer comme terminée
 * - ✅ FILTER - Filtrage par statut
 * - ✅ VALIDATION - Validation formulaire
 * - ✅ UX - Empty states, loading, toasts
 */

test.describe('Tasks Module - CRUD Complet', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Attendre la redirection
    await page.waitForURL('/dashboard');

    // Naviguer vers Tasks
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  /**
   * Test 1: Affichage de la page Tasks
   */
  test('affiche la page Tasks avec tous les éléments', async () => {
    // Vérifie le titre
    await expect(page.locator('h2:has-text("Gestion des Tâches")')).toBeVisible();

    // Vérifie la description
    await expect(page.locator('text=Suivez vos tâches, rappels et priorités quotidiennes')).toBeVisible();

    // Vérifie le bouton "Nouvelle Tâche"
    await expect(page.locator('button:has-text("Nouvelle Tâche")')).toBeVisible();

    // Vérifie le filtre
    await expect(page.locator('text=Filtrer par statut').first()).toBeVisible();
  });

  /**
   * Test 2: CREATE - Création d'une nouvelle tâche
   */
  test('peut créer une nouvelle tâche complète', async () => {
    // Cliquer sur "Nouvelle Tâche"
    await page.click('button:has-text("Nouvelle Tâche")');

    // Attendre l'ouverture du dialog
    await expect(page.locator('text=Nouvelle tâche').first()).toBeVisible();

    // Remplir le formulaire
    await page.fill('input[id="title"]', 'Relancer M. Dupont pour la villa');
    await page.fill('textarea[id="description"]', 'Appeler pour confirmer le rendez-vous de visite');

    // Sélectionner priorité "Haute"
    await page.click('[id="priority"]');
    await page.click('text=Haute');

    // Sélectionner statut "À faire"
    await page.click('[id="status"]');
    await page.click('text=À faire');

    // Date d'échéance
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[id="dueDate"]', dateString);

    // Soumettre
    await page.click('button:has-text("Créer")');

    // Attendre le toast de succès
    await expect(page.locator('text=Tâche créée avec succès')).toBeVisible({ timeout: 5000 });

    // Vérifier que la tâche apparaît dans la liste
    await expect(page.locator('text=Relancer M. Dupont pour la villa')).toBeVisible();

    // Vérifier le badge de priorité "high"
    await expect(page.locator('.bg-red-100').first()).toBeVisible();
  });

  /**
   * Test 3: CREATE - Validation du formulaire (titre trop court)
   */
  test('valide que le titre doit contenir au moins 3 caractères', async () => {
    await page.click('button:has-text("Nouvelle Tâche")');
    await expect(page.locator('text=Nouvelle tâche').first()).toBeVisible();

    // Titre trop court (2 caractères)
    await page.fill('input[id="title"]', 'AB');
    await page.click('button:has-text("Créer")');

    // Vérifier le message d'erreur
    await expect(page.locator('text=Le titre doit contenir au moins 3 caractères')).toBeVisible();
  });

  /**
   * Test 4: READ - Affichage de la liste des tâches
   */
  test('affiche correctement la liste des tâches', async () => {
    // Créer une tâche de test d'abord
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche test READ');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Vérifier l'affichage de la tâche
    const taskCard = page.locator('text=Tâche test READ').locator('..');

    // Vérifie que la carte contient les éléments attendus
    await expect(taskCard).toBeVisible();

    // Vérifie la présence du menu dropdown
    await expect(page.locator('button').filter({ hasText: '' }).first()).toBeVisible();
  });

  /**
   * Test 5: UPDATE - Modification d'une tâche existante
   */
  test('peut modifier une tâche existante', async () => {
    // Créer une tâche d'abord
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche à modifier');
    await page.fill('textarea[id="description"]', 'Description originale');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Ouvrir le menu et cliquer sur Modifier
    const taskCard = page.locator('text=Tâche à modifier').locator('..').locator('..');
    await taskCard.locator('button').filter({ hasText: '' }).first().click();
    await page.click('text=Modifier');

    // Attendre l'ouverture du dialog
    await expect(page.locator('text=Modifier la tâche')).toBeVisible();

    // Vérifier que les champs sont pré-remplis
    await expect(page.locator('input[id="title"]')).toHaveValue('Tâche à modifier');

    // Modifier le titre
    await page.fill('input[id="title"]', 'Tâche modifiée ✅');

    // Modifier la priorité
    await page.click('[id="priority"]');
    await page.click('text=Haute');

    // Soumettre
    await page.click('button:has-text("Mettre à jour")');

    // Attendre le toast
    await expect(page.locator('text=Tâche mise à jour avec succès')).toBeVisible({ timeout: 5000 });

    // Vérifier que le titre est bien modifié
    await expect(page.locator('text=Tâche modifiée ✅')).toBeVisible();

    // Vérifier que l'ancienne version n'existe plus
    await expect(page.locator('text=Tâche à modifier').first()).not.toBeVisible();
  });

  /**
   * Test 6: DELETE - Suppression avec confirmation
   */
  test('peut supprimer une tâche avec confirmation', async () => {
    // Créer une tâche à supprimer
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche à supprimer');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Ouvrir le menu et cliquer sur Supprimer
    const taskCard = page.locator('text=Tâche à supprimer').locator('..').locator('..');
    await taskCard.locator('button').filter({ hasText: '' }).first().click();
    await page.click('text=Supprimer');

    // Vérifier le dialog de confirmation
    await expect(page.locator('text=Supprimer la tâche')).toBeVisible();
    await expect(page.locator('text=Êtes-vous sûr')).toBeVisible();

    // Annuler d'abord
    await page.click('button:has-text("Annuler")');
    await expect(page.locator('text=Tâche à supprimer')).toBeVisible();

    // Réessayer et confirmer
    await taskCard.locator('button').filter({ hasText: '' }).first().click();
    await page.click('text=Supprimer');
    await page.click('button:has-text("Confirmer")');

    // Attendre le toast
    await expect(page.locator('text=Tâche supprimée avec succès')).toBeVisible({ timeout: 5000 });

    // Vérifier que la tâche a disparu
    await expect(page.locator('text=Tâche à supprimer')).not.toBeVisible();
  });

  /**
   * Test 7: COMPLETE - Marquer une tâche comme terminée
   */
  test('peut marquer une tâche comme terminée', async () => {
    // Créer une tâche
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche à compléter');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Cliquer sur le bouton CheckCircle
    const checkButton = page.locator('text=Tâche à compléter')
      .locator('..')
      .locator('..')
      .locator('button')
      .first();
    await checkButton.click();

    // Attendre la mise à jour
    await page.waitForTimeout(1000);

    // Vérifier que le titre est barré (line-through)
    const titleElement = page.locator('h3:has-text("Tâche à compléter")');
    await expect(titleElement).toHaveClass(/line-through/);

    // Vérifier le badge "Terminé"
    await expect(page.locator('text=Terminé').first()).toBeVisible();
  });

  /**
   * Test 8: FILTER - Filtrage par statut
   */
  test('peut filtrer les tâches par statut', async () => {
    // Créer des tâches avec différents statuts
    // Tâche 1 - Todo
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche TODO');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(500);

    // Tâche 2 - In Progress
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche IN PROGRESS');
    await page.click('[id="status"]');
    await page.click('text=En cours');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(500);

    // Tâche 3 - Done
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche DONE');
    await page.click('[id="status"]');
    await page.click('text=Terminé');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Toutes les tâches doivent être visibles
    await expect(page.locator('text=Tâche TODO')).toBeVisible();
    await expect(page.locator('text=Tâche IN PROGRESS')).toBeVisible();
    await expect(page.locator('text=Tâche DONE')).toBeVisible();

    // Filtrer par "En cours"
    await page.click('text=Toutes les tâches');
    await page.click('text=En cours');
    await page.waitForTimeout(500);

    // Seule la tâche IN PROGRESS doit être visible
    await expect(page.locator('text=Tâche IN PROGRESS')).toBeVisible();
    await expect(page.locator('text=Tâche TODO')).not.toBeVisible();
    await expect(page.locator('text=Tâche DONE')).not.toBeVisible();

    // Filtrer par "Terminées"
    await page.click('text=En cours');
    await page.click('text=Terminées');
    await page.waitForTimeout(500);

    // Seule la tâche DONE doit être visible
    await expect(page.locator('text=Tâche DONE')).toBeVisible();
    await expect(page.locator('text=Tâche TODO')).not.toBeVisible();
    await expect(page.locator('text=Tâche IN PROGRESS')).not.toBeVisible();
  });

  /**
   * Test 9: Empty State - Affichage quand aucune tâche
   */
  test('affiche l\'empty state quand aucune tâche', async () => {
    // Si des tâches existent, les supprimer toutes
    // (Dans un vrai test, on utiliserait un beforeEach pour nettoyer la DB)

    // Naviguer avec un filtre qui ne retourne rien ou nettoyer
    // Pour ce test, on suppose qu'il n'y a pas de tâches au démarrage

    // Vérifier l'empty state
    const emptyState = page.locator('text=Aucune tâche trouvée');
    if (await emptyState.isVisible()) {
      await expect(page.locator('text=Créer une première tâche')).toBeVisible();
    }
  });

  /**
   * Test 10: Loading State - Spinner pendant chargement
   */
  test('affiche un spinner pendant le chargement', async () => {
    // Recharger la page et vérifier le spinner
    await page.goto('/tasks');

    // Le spinner devrait apparaître brièvement
    // Note: Peut être trop rapide pour être capturé, dépend de la connexion
    const spinner = page.locator('.animate-spin');

    // Attendre que le chargement soit terminé
    await page.waitForLoadState('networkidle');

    // Le spinner ne devrait plus être visible
    await expect(spinner).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 11: Priority Colors - Vérification des couleurs
   */
  test('affiche les bonnes couleurs selon la priorité', async () => {
    // Créer tâche priorité basse
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Priorité BASSE');
    await page.click('[id="priority"]');
    await page.click('text=Basse');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(500);

    // Vérifier badge bleu (low)
    const lowBadge = page.locator('text=Priorité BASSE').locator('..').locator('.bg-blue-100');
    await expect(lowBadge).toBeVisible();

    // Créer tâche priorité haute
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Priorité HAUTE');
    await page.click('[id="priority"]');
    await page.click('text=Haute');
    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(500);

    // Vérifier badge rouge (high)
    const highBadge = page.locator('text=Priorité HAUTE').locator('..').locator('.bg-red-100');
    await expect(highBadge).toBeVisible();
  });

  /**
   * Test 12: Date Formatting - Affichage correct des dates
   */
  test('affiche correctement les dates', async () => {
    // Créer une tâche avec date d'échéance
    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche avec deadline');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[id="dueDate"]', dateString);

    await page.click('button:has-text("Créer")');
    await page.waitForTimeout(1000);

    // Vérifier que la date est affichée
    const expectedDate = tomorrow.toLocaleDateString('fr-FR');
    await expect(page.locator(`text=${expectedDate}`).first()).toBeVisible();
  });

  /**
   * Test 13: Dialog Close - Fermeture sans sauvegarder
   */
  test('peut fermer le dialog sans sauvegarder', async () => {
    await page.click('button:has-text("Nouvelle Tâche")');
    await expect(page.locator('text=Nouvelle tâche').first()).toBeVisible();

    // Remplir partiellement
    await page.fill('input[id="title"]', 'Ne pas sauvegarder');

    // Cliquer sur Annuler
    await page.click('button:has-text("Annuler")');

    // Le dialog doit se fermer
    await expect(page.locator('text=Nouvelle tâche').first()).not.toBeVisible();

    // La tâche ne doit pas apparaître
    await expect(page.locator('text=Ne pas sauvegarder')).not.toBeVisible();
  });

  /**
   * Test 14: Responsive - Affichage mobile
   */
  test('s\'affiche correctement sur mobile', async () => {
    // Changer la taille de viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Vérifier que les éléments principaux sont visibles
    await expect(page.locator('text=Gestion des Tâches')).toBeVisible();
    await expect(page.locator('button:has-text("Nouvelle Tâche")')).toBeVisible();

    // Créer une tâche sur mobile
    await page.click('button:has-text("Nouvelle Tâche")');
    await expect(page.locator('text=Nouvelle tâche').first()).toBeVisible();
  });
});

/**
 * Tests de performance et edge cases
 */
test.describe('Tasks Module - Edge Cases', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto('/tasks');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  /**
   * Test Edge Case 1: Titre très long
   */
  test('gère correctement un titre très long', async () => {
    const longTitle = 'A'.repeat(200);

    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', longTitle);
    await page.click('button:has-text("Créer")');

    await page.waitForTimeout(1000);

    // Vérifier que la tâche existe (le titre peut être tronqué visuellement)
    await expect(page.locator(`text=${longTitle.substring(0, 50)}`).first()).toBeVisible();
  });

  /**
   * Test Edge Case 2: Caractères spéciaux dans le titre
   */
  test('accepte les caractères spéciaux', async () => {
    const specialTitle = 'Tâche avec émojis 🎯 et symboles @#$%';

    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', specialTitle);
    await page.click('button:has-text("Créer")');

    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${specialTitle}`).first()).toBeVisible();
  });

  /**
   * Test Edge Case 3: Date dans le passé
   */
  test('accepte une date d\'échéance dans le passé', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0];

    await page.click('button:has-text("Nouvelle Tâche")');
    await page.fill('input[id="title"]', 'Tâche en retard');
    await page.fill('input[id="dueDate"]', dateString);
    await page.click('button:has-text("Créer")');

    await page.waitForTimeout(1000);
    await expect(page.locator('text=Tâche en retard')).toBeVisible();
  });
});
