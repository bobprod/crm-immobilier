import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/database/prisma.service';
import { TrackingPlatform } from '../src/modules/marketing/tracking/dto/tracking.dto';

describe('Tracking Pixels Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test user and get token
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'hashedpassword123',
      },
    });

    userId = testUser.id;

    // Mock authentication - in real app, you'd login to get a token
    authToken = 'test-auth-token';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.trackingConfig.deleteMany({
      where: { userId },
    });
    await prisma.user.delete({
      where: { id: userId },
    });

    await app.close();
  });

  describe('/marketing-tracking/config (POST)', () => {
    it('should create a Meta Pixel configuration', () => {
      return request(app.getHttpServer())
        .post('/marketing-tracking/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: TrackingPlatform.FACEBOOK,
          config: {
            pixelId: '123456789012345',
            accessToken: 'EAAtest123',
            testEventCode: 'TEST12345',
          },
          isActive: true,
          useServerSide: true,
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.platform).toBe(TrackingPlatform.FACEBOOK);
          expect(response.body.config.pixelId).toBe('123456789012345');
          expect(response.body.isActive).toBe(true);
        });
    });

    it('should create a Google Tag Manager configuration', () => {
      return request(app.getHttpServer())
        .post('/marketing-tracking/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: TrackingPlatform.GTM,
          config: {
            containerId: 'GTM-XXXXXXX',
            serverContainerUrl: 'https://gtm-server.example.com',
          },
          isActive: true,
        })
        .expect(201)
        .then((response) => {
          expect(response.body.platform).toBe(TrackingPlatform.GTM);
          expect(response.body.config.containerId).toBe('GTM-XXXXXXX');
        });
    });

    it('should reject invalid platform', () => {
      return request(app.getHttpServer())
        .post('/marketing-tracking/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: 'invalid_platform',
          config: {},
          isActive: true,
        })
        .expect(400);
    });

    it('should reject missing config', () => {
      return request(app.getHttpServer())
        .post('/marketing-tracking/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: TrackingPlatform.FACEBOOK,
          isActive: true,
        })
        .expect(400);
    });
  });

  describe('/marketing-tracking/config (GET)', () => {
    beforeAll(async () => {
      // Create test configs
      await prisma.trackingConfig.createMany({
        data: [
          {
            userId,
            platform: TrackingPlatform.FACEBOOK,
            config: { pixelId: '111111111111111' },
            isActive: true,
            useServerSide: true,
          },
          {
            userId,
            platform: TrackingPlatform.TIKTOK,
            config: { pixelId: 'TIKTOK123' },
            isActive: false,
            useServerSide: false,
          },
        ],
      });
    });

    it('should return all configurations', () => {
      return request(app.getHttpServer())
        .get('/marketing-tracking/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });

    it('should return specific platform configuration', () => {
      return request(app.getHttpServer())
        .get(`/marketing-tracking/config/${TrackingPlatform.FACEBOOK}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.platform).toBe(TrackingPlatform.FACEBOOK);
          expect(response.body.config.pixelId).toBe('111111111111111');
        });
    });

    it('should return 404 for non-existent platform', () => {
      return request(app.getHttpServer())
        .get(`/marketing-tracking/config/${TrackingPlatform.SNAPCHAT}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/marketing-tracking/config/:platform (DELETE)', () => {
    beforeAll(async () => {
      await prisma.trackingConfig.create({
        data: {
          userId,
          platform: TrackingPlatform.LINKEDIN,
          config: { partnerId: '123456' },
          isActive: true,
          useServerSide: false,
        },
      });
    });

    it('should delete a configuration', () => {
      return request(app.getHttpServer())
        .delete(`/marketing-tracking/config/${TrackingPlatform.LINKEDIN}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body.platform).toBe(TrackingPlatform.LINKEDIN);
        });
    });

    it('should return 404 when deleting non-existent config', () => {
      return request(app.getHttpServer())
        .delete(`/marketing-tracking/config/${TrackingPlatform.SNAPCHAT}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/marketing-tracking/config/:platform/test (POST)', () => {
    beforeAll(async () => {
      await prisma.trackingConfig.upsert({
        where: {
          userId_platform: {
            userId,
            platform: TrackingPlatform.FACEBOOK,
          },
        },
        create: {
          userId,
          platform: TrackingPlatform.FACEBOOK,
          config: {
            pixelId: '123456789012345',
            accessToken: 'EAAtest',
          },
          isActive: true,
          useServerSide: true,
        },
        update: {},
      });
    });

    it('should test pixel connection', () => {
      return request(app.getHttpServer())
        .post(`/marketing-tracking/config/${TrackingPlatform.FACEBOOK}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('success');
          expect(response.body).toHaveProperty('message');
          expect(typeof response.body.success).toBe('boolean');
        });
    });
  });

  describe('/marketing-tracking/events (POST)', () => {
    it('should create a tracking event', () => {
      return request(app.getHttpServer())
        .post('/marketing-tracking/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventName: 'Lead',
          data: {
            propertyId: '123',
            leadType: 'contact_form',
            value: 0,
            currency: 'EUR',
          },
          sessionId: 'session-123',
          url: 'https://example.com/property/123',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.eventName).toBe('Lead');
          expect(response.body.data.propertyId).toBe('123');
        });
    });

    it('should create PageView event', () => {
      return request(app.getHttpServer())
        .post('/marketing-tracking/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventName: 'PageView',
          data: {
            url: '/property/456',
            title: 'Villa Antibes',
          },
          sessionId: 'session-456',
        })
        .expect(201);
    });
  });

  describe('/marketing-tracking/events (GET)', () => {
    beforeAll(async () => {
      // Create test events
      await prisma.trackingEvent.createMany({
        data: [
          {
            userId,
            eventName: 'PageView',
            eventType: 'standard',
            platform: TrackingPlatform.GA4,
            data: { url: '/home' },
            source: 'web',
          },
          {
            userId,
            eventName: 'Lead',
            eventType: 'standard',
            platform: TrackingPlatform.FACEBOOK,
            data: { leadType: 'contact' },
            source: 'web',
          },
        ],
      });
    });

    it('should return all events for user', () => {
      return request(app.getHttpServer())
        .get('/marketing-tracking/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(Array.isArray(response.body)).toBe(true);
          expect(response.body.length).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe('/marketing-tracking/events/stats (GET)', () => {
    it('should return tracking statistics', () => {
      return request(app.getHttpServer())
        .get('/marketing-tracking/events/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('totalEvents');
          expect(response.body).toHaveProperty('eventsByPlatform');
          expect(response.body).toHaveProperty('eventsByType');
          expect(response.body).toHaveProperty('conversionRate');
          expect(response.body).toHaveProperty('topEvents');
        });
    });
  });

  describe('/public-tracking/event (POST)', () => {
    it('should accept public tracking event without auth', () => {
      return request(app.getHttpServer())
        .post('/public-tracking/event')
        .send({
          eventName: 'PageView',
          data: {
            url: '/property/789',
          },
          sessionId: 'anonymous-session-123',
        })
        .expect(201);
    });
  });

  describe('Authorization', () => {
    it('should reject requests without token', () => {
      return request(app.getHttpServer())
        .get('/marketing-tracking/config')
        .expect(401);
    });

    it('should reject requests with invalid token', () => {
      return request(app.getHttpServer())
        .get('/marketing-tracking/config')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Data Validation', () => {
    it('should validate Meta Pixel config structure', () => {
      return request(app.getHttpServer())
        .post('/marketing-tracking/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          platform: TrackingPlatform.FACEBOOK,
          config: {
            invalidField: 'test',
          },
          isActive: true,
        })
        .expect(400);
    });

    it('should validate required fields for tracking event', () => {
      return request(app.getHttpServer())
        .post('/marketing-tracking/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing eventName
          data: {},
        })
        .expect(400);
    });
  });

  describe('Performance', () => {
    it('should handle batch event creation', async () => {
      const events = Array.from({ length: 10 }, (_, i) => ({
        eventName: 'PageView',
        data: { url: `/property/${i}` },
        sessionId: `session-${i}`,
      }));

      const promises = events.map((event) =>
        request(app.getHttpServer())
          .post('/marketing-tracking/events')
          .set('Authorization', `Bearer ${authToken}`)
          .send(event)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
      });
    });

    it('should respond quickly to stats request', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .get('/marketing-tracking/events/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const duration = Date.now() - start;

      // Should respond in less than 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
