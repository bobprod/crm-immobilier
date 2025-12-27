import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * 🧪 Tests E2E pour le système de Notifications Smart AI
 *
 * Tests:
 * - CRUD notifications
 * - Smart AI routing
 * - Préférences utilisateur
 * - Analytics par canal
 * - WebSocket temps réel
 */

describe('Notifications E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let notificationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Authentification (adapter selon votre système d'auth)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
    userId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /notifications - Create notification', () => {
    it('should create a new notification', async () => {
      const response = await request(app.getHttpServer())
        .post('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          type: 'system',
          title: 'Test notification',
          message: 'This is a test notification',
          actionUrl: '/test',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test notification');
      expect(response.body.channel).toBeDefined();
      notificationId = response.body.id;
    });

    it('should respect Smart AI routing (quiet hours)', async () => {
      // Configurer quiet hours
      await request(app.getHttpServer())
        .put('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quietHours: {
            start: '22:00',
            end: '08:00',
            timezone: 'Europe/Paris',
          },
        })
        .expect(200);

      // TODO: Tester pendant quiet hours
      // La notification devrait être delayed
    });
  });

  describe('GET /notifications - List notifications', () => {
    it('should get user notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get unread notifications', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/unread')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get unread count', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/unread/count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });
  });

  describe('PATCH /notifications/:id/read - Mark as read', () => {
    it('should mark notification as read', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.isRead).toBe(true);
      expect(response.body.openedAt).toBeDefined();
    });

    it('should mark all as read', async () => {
      await request(app.getHttpServer())
        .patch('/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('DELETE /notifications/:id - Delete notification', () => {
    it('should delete a notification', async () => {
      await request(app.getHttpServer())
        .delete(`/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('GET /notifications/settings - User preferences', () => {
    it('should get user notification preferences', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('channels');
      expect(response.body).toHaveProperty('maxPerHour');
      expect(response.body).toHaveProperty('aiOptimization');
    });
  });

  describe('PUT /notifications/settings - Update preferences', () => {
    it('should update notification preferences', async () => {
      const response = await request(app.getHttpServer())
        .put('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          maxPerHour: 15,
          aiOptimization: true,
          dailyDigest: true,
          digestTime: '09:00',
        })
        .expect(200);

      expect(response.body.maxPerHour).toBe(15);
      expect(response.body.aiOptimization).toBe(true);
      expect(response.body.dailyDigest).toBe(true);
    });

    it('should update channel preferences', async () => {
      const response = await request(app.getHttpServer())
        .put('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          channels: {
            appointment: ['in_app', 'email', 'sms'],
            task: ['in_app'],
            lead: ['in_app', 'email'],
          },
        })
        .expect(200);

      expect(response.body.channels.appointment).toContain('email');
      expect(response.body.channels.task).toHaveLength(1);
    });
  });

  describe('GET /notifications/analytics/channels - Channel statistics', () => {
    it('should get channel analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/analytics/channels')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ days: 30 })
        .expect(200);

      expect(response.body).toHaveProperty('in_app');
      if (response.body.in_app) {
        expect(response.body.in_app).toHaveProperty('total');
        expect(response.body.in_app).toHaveProperty('deliveryRate');
        expect(response.body.in_app).toHaveProperty('openRate');
      }
    });
  });

  describe('GET /notifications/analytics - Global analytics', () => {
    it('should get global analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ days: 30 })
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('unread');
      expect(response.body).toHaveProperty('byChannel');
      expect(response.body).toHaveProperty('period');
    });
  });

  describe('GET /notifications/analytics/test - Test configuration', () => {
    it('should test Smart AI configuration', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications/analytics/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('preferences');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('optimalChannels');
      expect(response.body.status).toHaveProperty('canSendNow');
      expect(response.body.status).toHaveProperty('withinRateLimit');
      expect(response.body.status).toHaveProperty('aiOptimizationActive');
    });
  });

  describe('Smart AI Routing', () => {
    it('should select optimal channel based on history', async () => {
      // Créer plusieurs notifications pour construire un historique
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/notifications')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            userId,
            type: 'appointment',
            title: `Test appointment ${i}`,
            message: 'Testing channel selection',
          })
          .expect(201);
      }

      // Tester la configuration
      const testResponse = await request(app.getHttpServer())
        .get('/notifications/analytics/test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(testResponse.body.optimalChannels.appointment).toBeDefined();
    });

    it('should respect rate limiting', async () => {
      // Configurer rate limit bas
      await request(app.getHttpServer())
        .put('/notifications/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          maxPerHour: 2,
        })
        .expect(200);

      // Envoyer plus de notifications que la limite
      const responses = [];
      for (let i = 0; i < 3; i++) {
        const response = await request(app.getHttpServer())
          .post('/notifications')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            userId,
            type: 'system',
            title: `Rate limit test ${i}`,
            message: 'Testing rate limiting',
          });

        responses.push(response);
      }

      // La 3ème notification devrait être delayed
      const delayedNotif = responses.find((r) => r.body.delayed);
      expect(delayedNotif).toBeDefined();
    });
  });
});

/**
 * 📝 Comment exécuter les tests:
 *
 * 1. Installer les dépendances:
 * npm install --save-dev @nestjs/testing supertest @types/supertest jest
 *
 * 2. Configurer la base de données de test (.env.test):
 * DATABASE_URL="postgresql://user:password@localhost:5432/crm_test"
 *
 * 3. Exécuter les tests:
 * npm run test:e2e
 *
 * 4. Exécuter un test spécifique:
 * npm run test:e2e -- --testNamePattern="should create a new notification"
 *
 * 5. Mode watch:
 * npm run test:e2e -- --watch
 */
