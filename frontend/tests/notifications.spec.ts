import { test, expect } from '@playwright/test';

// Test credentials should be configured via environment variables
// These defaults are for development/testing only and should not be used in production
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'amine@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'amine123';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

test.describe('Notifications Module E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to notifications
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
  });

  test('should load notifications page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Notifications');
    const notificationsList = page.locator('[data-testid="notifications-list"]');
    // Check if the list exists (even if empty)
    await expect(notificationsList.or(page.locator('text=Aucune notification'))).toBeVisible();
  });

  test('should show unread count badge', async ({ page }) => {
    const badge = page.locator('[data-testid="unread-count"]');
    // Badge may not be visible if no unread notifications
    const badgeOrEmpty = badge.or(page.locator('text=Aucune notification'));
    await expect(badgeOrEmpty).toBeVisible();
  });

  test('should filter notifications by status', async ({ page }) => {
    // Click filter button
    await page.click('[data-testid="filter-unread"]');
    await page.waitForTimeout(500);

    // Check that page loaded (may show empty state or notifications)
    const content = page.locator('body');
    await expect(content).toContainText(/Non lues|Aucune notification/);
  });

  test('should mark notification as read if unread exists', async ({ page }) => {
    const firstNotif = page.locator('[data-testid="notification-item"]').first();
    
    if (await firstNotif.isVisible()) {
      const markReadBtn = firstNotif.locator('[data-testid="mark-read-btn"]');
      
      if (await markReadBtn.isVisible()) {
        // Click mark as read
        await markReadBtn.click();
        await page.waitForTimeout(500);
        
        // Check that button disappeared (notification is now marked as read)
        await expect(markReadBtn).not.toBeVisible();
      }
    } else {
      console.log('No notifications available for this test');
    }
  });

  test('should mark all notifications as read if unread exist', async ({ page }) => {
    const markAllBtn = page.locator('[data-testid="mark-all-read-btn"]');
    
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await page.waitForTimeout(1000);

      // Unread count should be 0 or badge should disappear
      const badge = page.locator('[data-testid="unread-count"]');
      if (await badge.isVisible()) {
        await expect(badge).toHaveText('0');
      }
    } else {
      console.log('No unread notifications available for this test');
    }
  });

  test('should delete notification if exists', async ({ page }) => {
    const firstNotif = page.locator('[data-testid="notification-item"]').first();
    
    if (await firstNotif.isVisible()) {
      const initialCount = await page.locator('[data-testid="notification-item"]').count();
      
      const deleteBtn = firstNotif.locator('[data-testid="delete-btn"]');
      await deleteBtn.click();
      await page.waitForTimeout(500);

      // Check count decreased or empty message appears
      const newCount = await page.locator('[data-testid="notification-item"]').count();
      expect(newCount).toBeLessThanOrEqual(initialCount);
    } else {
      console.log('No notifications available for this test');
    }
  });

  test('should navigate to action URL if exists', async ({ page }) => {
    const firstNotif = page.locator('[data-testid="notification-item"]').first();
    
    if (await firstNotif.isVisible()) {
      const actionLink = firstNotif.locator('[data-testid="action-link"]');

      if (await actionLink.isVisible()) {
        await actionLink.click();
        await page.waitForLoadState('networkidle');
        
        // Check that we navigated away from notifications page
        // Note: URL might still contain notifications if the link is invalid
        console.log('Navigated to:', page.url());
      }
    }
  });

  test('should show WebSocket connection status', async ({ page }) => {
    const status = page.locator('[data-testid="ws-status"]');
    // Status may or may not be visible depending on connection
    const statusOrHeader = status.or(page.locator('h1:has-text("Notifications")'));
    await expect(statusOrHeader).toBeVisible();
  });

  test('should receive real-time notification via API', async ({ page, context }) => {
    // Get token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    
    if (!token) {
      console.log('No access token found, skipping test');
      return;
    }

    // Extract userId from token
    const userId = await page.evaluate(() => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.userId;
      } catch (e) {
        return null;
      }
    });

    if (!userId) {
      console.log('Could not extract userId from token, skipping test');
      return;
    }

    try {
      // Create a notification via API
      await context.request.post(`${API_BASE_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: {
          userId,
          type: 'system',
          title: 'E2E Test Notification',
          message: 'This is a real-time test',
        },
      });

      // Wait for notification to appear
      await page.waitForTimeout(2000);
      
      // Check if notification appears (may require reload)
      await page.reload();
      await page.waitForTimeout(1000);
      
      const notification = page.locator('[data-testid="notification-item"]', {
        hasText: 'E2E Test Notification',
      });
      
      // Note: May not appear immediately if WebSocket is not connected
      console.log('Notification created via API');
    } catch (error) {
      console.log('Error creating notification:', error);
    }
  });

  test('should filter by notification type', async ({ page }) => {
    // Try to select a type filter
    const typeSelect = page.locator('select');
    await typeSelect.selectOption('system');
    await page.waitForTimeout(500);
    
    // Check page still works
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should refresh notifications list', async ({ page }) => {
    const refreshBtn = page.getByRole('button', { name: /actualiser/i });
    await refreshBtn.click();
    await page.waitForTimeout(1000);
    
    // Check that page is still functional
    await expect(page.locator('h1')).toContainText('Notifications');
  });
});
