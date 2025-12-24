import { test, expect } from '@playwright/test';

test.describe('AI Chat Assistant', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/ai-assistant');
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin'
      }));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should load AI assistant page', async ({ page }) => {
    // Check if page loads
    await expect(page).toHaveURL(/.*ai-assistant/);

    // Check for main page elements
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Copilot Immobilier');
  });

  test('should show new conversation button', async ({ page }) => {
    // Check for new conversation button
    const newConvButton = page.locator('button:has-text("Nouvelle conversation")');
    await expect(newConvButton).toBeVisible();
  });

  test('should show welcome message when no conversations', async ({ page }) => {
    // Mock API response for empty conversations
    await page.route('**/api/ai-chat-assistant/conversations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for empty state message
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Aucune conversation');
  });

  test('should have input field and send button', async ({ page }) => {
    // Create a conversation first by mocking the API
    await page.route('**/api/ai-chat-assistant/conversations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-conv-1',
            title: 'Test Conversation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0
          }
        ]),
      });
    });

    await page.route('**/api/ai-chat-assistant/messages/test-conv-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for input field
    const inputField = page.locator('input[placeholder*="Posez votre question"]');
    await expect(inputField).toBeVisible();

    // Check for send button
    const sendButton = page.locator('button:has-text("Envoyer")');
    await expect(sendButton).toBeVisible();
  });

  test('should show example prompts in welcome screen', async ({ page }) => {
    // Mock API for conversation with no messages
    await page.route('**/api/ai-chat-assistant/conversations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-conv-1',
            title: 'Nouvelle conversation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0
          }
        ]),
      });
    });

    await page.route('**/api/ai-chat-assistant/messages/test-conv-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for example prompts
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Bienvenue dans Copilot Immobilier');
    expect(pageContent).toContain('Recherche');
    expect(pageContent).toContain('Rapports');
    expect(pageContent).toContain('Emails');
    expect(pageContent).toContain('Conseils');
  });
});
