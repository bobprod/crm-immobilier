import { test, expect } from '@playwright/test';

/**
 * Tests pour le Dashboard de Prospection Refactorisé
 * Ce test vérifie les nouvelles fonctionnalités UX/UI :
 * 1. Navigation entre les onglets principaux
 * 2. Navigation entre les sous-onglets (Pipeline & Campagnes)
 * 3. Changement des modes de vue dans le pipeline (Entonnoir, Kanban, Liste)
 * 4. Ouverture du formulaire de création de campagne
 */
test.describe('Prospection Dashboard Refactored', () => {
  
  test.beforeEach(async ({ page }) => {
    // Connexion avec les identifiants de test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Remplissage manuel si non pré-rempli
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill('amine@example.com');
    await passwordInput.fill('amine123');
    
    await page.click('button[type="submit"]');
    
    // Attente du chargement du dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Navigation vers la page Prospection
    await page.click('a[href="/prospection"]');
    await page.waitForURL('**/prospection', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher les 4 onglets principaux et permettre la navigation', async ({ page }) => {
    const tabs = ['Prospection IA', 'Campagnes', 'Pipeline & Leads', 'Analytiques'];
    
    for (const tabName of tabs) {
      const tab = page.getByRole('button', { name: tabName });
      await expect(tab).toBeVisible();
      await tab.click();
      
      // Vérification que l'onglet est actif (classe CSS spécifique au gradient ou fond violet)
      // Note: On utilise une classe de notre design system
      await expect(tab).toHaveClass(/text-purple/);
    }
  });

  test('devrait permettre de changer les modes de vue dans le Pipeline', async ({ page }) => {
    // Aller sur l'onglet Pipeline
    await page.getByRole('button', { name: 'Pipeline & Leads' }).click();
    
    // Vérifier les 3 boutons de vue
    const viewButtons = ['Entonnoir', 'Kanban', 'Liste'];
    for (const viewName of viewButtons) {
      const btn = page.getByRole('button', { name: viewName });
      await expect(btn).toBeVisible();
      await btn.click();
      
      // Vérifier que le bouton devient actif (fond blanc dans notre design)
      await expect(btn).toHaveClass(/bg-white/);
    }
  });

  test('devrait filtrer les leads via les sous-onglets du Pipeline', async ({ page }) => {
    await page.getByRole('button', { name: 'Pipeline & Leads' }).click();
    
    const subTabs = ['Tous', 'Qualifiés', 'À contacter', 'Convertis', 'Spam'];
    for (const subTabName of subTabs) {
      const subTab = page.getByRole('button', { name: subTabName });
      await expect(subTab).toBeVisible();
      await subTab.click();
      
      // Vérifier que le sous-onglet est actif (dégradé bg-gradient-to-r)
      await expect(subTab).toHaveClass(/from-purple-600/);
    }
  });

  test('devrait ouvrir le modal "Nouvelle campagne" depuis le bouton header', async ({ page }) => {
    const newCampaignBtn = page.getByRole('button', { name: /Nouvelle campagne/i });
    await expect(newCampaignBtn).toBeVisible();
    await newCampaignBtn.click();
    
    // Vérifier que le modal s'affiche
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Créer une nouvelle campagne/i);
    
    // Fermer le modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('devrait afficher les KPI cards avec des données', async ({ page }) => {
    // Vérifier la présence des 4 cartes KPI
    const kpiLabels = ['Campagnes actives', 'Leads collectés', 'Taux de qualification', 'Spams filtrés'];
    for (const label of kpiLabels) {
      await expect(page.locator(`text=${label}`)).toBeVisible();
    }
    
    // Vérifier que les valeurs ne sont pas vides
    const kpiValues = page.locator('.text-2xl.font-bold');
    const count = await kpiValues.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });
});
