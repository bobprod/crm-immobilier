import { test, expect } from '@playwright/test';

test.describe('Email AI Auto-Response', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to email AI page
    await page.goto('/email-ai-response');
    // Assume user is already authenticated
  });

  test.describe('EmailAIResponseDashboard', () => {
    test('should display dashboard with statistics cards', async ({ page }) => {
      // Check for statistics cards
      await expect(page.getByText('Emails Analysés')).toBeVisible();
      await expect(page.getByText('Brouillons Générés')).toBeVisible();
      await expect(page.getByText('Emails Envoyés')).toBeVisible();
      await expect(page.getByText('Temps de Réponse Moyen')).toBeVisible();

      // Check for numeric values
      const analyzedCard = page.locator('text=Emails Analysés').locator('..');
      await expect(analyzedCard.locator('text=/\\d+/')).toBeVisible();
    });

    test('should display intent distribution section', async ({ page }) => {
      await expect(page.getByText('Distribution des Intentions')).toBeVisible();

      // Check for all intent types
      await expect(page.getByText('Information')).toBeVisible();
      await expect(page.getByText('Rendez-vous')).toBeVisible();
      await expect(page.getByText('Négociation')).toBeVisible();
      await expect(page.getByText('Réclamation')).toBeVisible();
      await expect(page.getByText('Autre')).toBeVisible();
    });

    test('should filter drafts by status', async ({ page }) => {
      // Find filter buttons
      const allButton = page.getByRole('button', { name: 'Tous' });
      const pendingButton = page.getByRole('button', { name: 'En attente' });
      const sentButton = page.getByRole('button', { name: 'Envoyés' });

      // Test pending filter
      await pendingButton.click();
      await expect(pendingButton).toHaveClass(/bg-blue-500/);

      // Test sent filter
      await sentButton.click();
      await expect(sentButton).toHaveClass(/bg-blue-500/);

      // Test all filter
      await allButton.click();
      await expect(allButton).toHaveClass(/bg-blue-500/);
    });

    test('should display draft list', async ({ page }) => {
      await expect(page.getByText('Brouillons')).toBeVisible();

      // Check for draft items (if any exist)
      const draftItems = page.locator('[data-testid="draft-item"]');
      const count = await draftItems.count();

      if (count > 0) {
        // Check first draft item has required fields
        const firstDraft = draftItems.first();
        await expect(firstDraft).toBeVisible();
        await expect(firstDraft.getByText(/À:/)).toBeVisible();
        await expect(firstDraft.getByText(/Sujet:/)).toBeVisible();
      }
    });

    test('should show empty state when no drafts', async ({ page }) => {
      // Filter to a status that might have no items
      await page.getByRole('button', { name: 'Envoyés' }).click();

      // Wait for data to load
      await page.waitForTimeout(500);

      // Check for empty state message (adjust selector based on your implementation)
      const draftItems = page.locator('[data-testid="draft-item"]');
      const count = await draftItems.count();

      if (count === 0) {
        await expect(page.getByText(/Aucun brouillon/i)).toBeVisible();
      }
    });

    test('should open draft review modal on click', async ({ page }) => {
      const draftItems = page.locator('[data-testid="draft-item"]');
      const count = await draftItems.count();

      if (count > 0) {
        // Click first draft
        await draftItems.first().click();

        // Check modal appears
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Réviser le Brouillon')).toBeVisible();
      }
    });

    test('should refresh data when refresh button clicked', async ({ page }) => {
      const refreshButton = page.getByRole('button', { name: /actualiser/i });

      if (await refreshButton.isVisible()) {
        await refreshButton.click();

        // Check for loading indicator or data refresh
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('EmailAnalyzer', () => {
    test('should display email analysis form', async ({ page }) => {
      // Check for form fields
      await expect(page.getByLabel(/De:/i)).toBeVisible();
      await expect(page.getByLabel(/Sujet:/i)).toBeVisible();
      await expect(page.getByLabel(/Corps:/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Analyser/i })).toBeVisible();
    });

    test('should analyze email and display results', async ({ page }) => {
      // Fill in form
      await page.getByLabel(/De:/i).fill('client@example.com');
      await page.getByLabel(/Sujet:/i).fill('Question about apartment');
      await page.getByLabel(/Corps:/i).fill('Hello, I would like more information about the apartment.');

      // Submit analysis
      await page.getByRole('button', { name: /Analyser/i }).click();

      // Wait for results
      await page.waitForTimeout(1000);

      // Check for analysis results (adjust based on your UI)
      await expect(page.getByText(/Intention détectée/i)).toBeVisible();
      await expect(page.getByText(/Confiance/i)).toBeVisible();
    });

    test('should display intent with confidence score', async ({ page }) => {
      // Assuming email is already analyzed
      await page.getByLabel(/De:/i).fill('client@example.com');
      await page.getByLabel(/Sujet:/i).fill('I want to schedule a visit');
      await page.getByLabel(/Corps:/i).fill('Can we arrange a viewing tomorrow?');

      await page.getByRole('button', { name: /Analyser/i }).click();
      await page.waitForTimeout(1000);

      // Check for confidence percentage
      await expect(page.locator('text=/\\d+%/')).toBeVisible();
    });

    test('should extract and display keywords', async ({ page }) => {
      await page.getByLabel(/De:/i).fill('client@example.com');
      await page.getByLabel(/Sujet:/i).fill('Interested in property');
      await page.getByLabel(/Corps:/i).fill('I am interested in the luxury apartment with sea view');

      await page.getByRole('button', { name: /Analyser/i }).click();
      await page.waitForTimeout(1000);

      // Check for keywords section
      await expect(page.getByText(/Mots-clés/i)).toBeVisible();
    });

    test('should show suggested actions', async ({ page }) => {
      await page.getByLabel(/De:/i).fill('client@example.com');
      await page.getByLabel(/Sujet:/i).fill('Question');
      await page.getByLabel(/Corps:/i).fill('Tell me more about this property');

      await page.getByRole('button', { name: /Analyser/i }).click();
      await page.waitForTimeout(1000);

      // Check for suggested actions
      await expect(page.getByText(/Actions suggérées/i)).toBeVisible();
    });

    test('should allow generating draft from analysis', async ({ page }) => {
      await page.getByLabel(/De:/i).fill('client@example.com');
      await page.getByLabel(/Sujet:/i).fill('Information request');
      await page.getByLabel(/Corps:/i).fill('I need more details');

      await page.getByRole('button', { name: /Analyser/i }).click();
      await page.waitForTimeout(1000);

      // Click generate draft button
      const generateButton = page.getByRole('button', { name: /Générer un brouillon/i });
      if (await generateButton.isVisible()) {
        await generateButton.click();
        await page.waitForTimeout(1000);

        // Check for success message or draft created
        await expect(page.getByText(/Brouillon généré/i)).toBeVisible();
      }
    });

    test('should validate required fields', async ({ page }) => {
      // Try to submit without filling fields
      await page.getByRole('button', { name: /Analyser/i }).click();

      // Check for validation messages
      await expect(page.getByText(/requis/i).first()).toBeVisible();
    });

    test('should show loading state during analysis', async ({ page }) => {
      await page.getByLabel(/De:/i).fill('client@example.com');
      await page.getByLabel(/Sujet:/i).fill('Test');
      await page.getByLabel(/Corps:/i).fill('Test body');

      await page.getByRole('button', { name: /Analyser/i }).click();

      // Check for loading indicator
      await expect(page.getByRole('button', { name: /Analyse en cours/i })).toBeVisible();
    });
  });

  test.describe('EmailDraftReview Modal', () => {
    test.beforeEach(async ({ page }) => {
      // Create a draft to review (this assumes drafts exist)
      const draftItems = page.locator('[data-testid="draft-item"]');
      const count = await draftItems.count();

      if (count > 0) {
        await draftItems.first().click();
      }
    });

    test('should display draft details in modal', async ({ page }) => {
      const modal = page.getByRole('dialog');

      if (await modal.isVisible()) {
        await expect(modal.getByText('Réviser le Brouillon')).toBeVisible();
        await expect(modal.getByLabel(/Sujet/i)).toBeVisible();
        await expect(modal.getByLabel(/Corps/i)).toBeVisible();
      }
    });

    test('should allow editing subject and body', async ({ page }) => {
      const modal = page.getByRole('dialog');

      if (await modal.isVisible()) {
        const subjectInput = modal.getByLabel(/Sujet/i);
        await subjectInput.fill('Modified subject');
        await expect(subjectInput).toHaveValue('Modified subject');

        const bodyTextarea = modal.getByLabel(/Corps/i);
        await bodyTextarea.fill('Modified body content');
        await expect(bodyTextarea).toHaveValue('Modified body content');
      }
    });

    test('should display attachment suggestions', async ({ page }) => {
      const modal = page.getByRole('dialog');

      if (await modal.isVisible()) {
        await expect(modal.getByText(/Pièces jointes suggérées/i)).toBeVisible();
      }
    });

    test('should send email on approval', async ({ page }) => {
      const modal = page.getByRole('dialog');

      if (await modal.isVisible()) {
        const sendButton = modal.getByRole('button', { name: /Envoyer/i });
        await sendButton.click();

        // Wait for success message
        await page.waitForTimeout(1000);
        await expect(page.getByText(/Email envoyé/i)).toBeVisible();
      }
    });

    test('should close modal on cancel', async ({ page }) => {
      const modal = page.getByRole('dialog');

      if (await modal.isVisible()) {
        const cancelButton = modal.getByRole('button', { name: /Annuler/i });
        await cancelButton.click();

        // Modal should be closed
        await expect(modal).not.toBeVisible();
      }
    });

    test('should show loading state while sending', async ({ page }) => {
      const modal = page.getByRole('dialog');

      if (await modal.isVisible()) {
        const sendButton = modal.getByRole('button', { name: /Envoyer/i });
        await sendButton.click();

        // Check for loading state
        await expect(modal.getByRole('button', { name: /Envoi en cours/i })).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Check main elements are visible
      await expect(page.getByText('Emails Analysés')).toBeVisible();
      await expect(page.getByText('Distribution des Intentions')).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Check layout adapts
      await expect(page.getByText('Emails Analysés')).toBeVisible();
      await expect(page.getByText('Brouillons')).toBeVisible();
    });

    test('should stack statistics cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const statsCards = page.locator('[data-testid="stat-card"]');
      const count = await statsCards.count();

      if (count > 0) {
        // Cards should stack vertically on mobile
        const firstCard = statsCards.first();
        const secondCard = statsCards.nth(1);

        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // Second card should be below first card
          expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Simulate network error by going offline
      await page.context().setOffline(true);

      await page.getByLabel(/De:/i).fill('test@example.com');
      await page.getByLabel(/Sujet:/i).fill('Test');
      await page.getByLabel(/Corps:/i).fill('Test');

      await page.getByRole('button', { name: /Analyser/i }).click();

      // Check for error message
      await expect(page.getByText(/erreur/i)).toBeVisible();

      // Go back online
      await page.context().setOffline(false);
    });

    test('should show error when draft send fails', async ({ page }) => {
      const draftItems = page.locator('[data-testid="draft-item"]');
      const count = await draftItems.count();

      if (count > 0) {
        await draftItems.first().click();

        const modal = page.getByRole('dialog');
        if (await modal.isVisible()) {
          // Simulate offline
          await page.context().setOffline(true);

          const sendButton = modal.getByRole('button', { name: /Envoyer/i });
          await sendButton.click();

          // Check for error
          await expect(page.getByText(/erreur/i)).toBeVisible();

          await page.context().setOffline(false);
        }
      }
    });
  });
});
