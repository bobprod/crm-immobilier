import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../shared/database/prisma.service';

describe('Priority Inbox CRUD (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Create test user
    const testUser = await prismaService.users.create({
      data: {
        email: 'priority-test@example.com',
        password: 'hashed_password',
        firstName: 'Priority',
        lastName: 'Test',
      },
    });
    testUserId = testUser.id;

    // Mock login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'priority-test@example.com',
        password: 'test_password',
      });

    authToken = loginResponse.body.access_token || 'mock-jwt-token';
  });

  afterAll(async () => {
    await prismaService.users.deleteMany({
      where: { email: 'priority-test@example.com' },
    });
    await app.close();
  });

  describe('READ - GET /priority-inbox', () => {
    beforeEach(async () => {
      // Create test prospects with different priorities
      await prismaService.prospects.createMany({
        data: [
          {
            firstName: 'Urgent',
            lastName: 'Prospect',
            email: 'urgent@example.com',
            phone: '+216 98 111 111',
            city: 'Tunis',
            budget: 600000,
            status: 'qualified',
            notes: 'urgent immédiat',
            userId: testUserId,
          },
          {
            firstName: 'Normal',
            lastName: 'Prospect',
            email: 'normal@example.com',
            phone: '+216 98 222 222',
            city: 'Tunis',
            budget: 200000,
            status: 'new',
            userId: testUserId,
          },
        ],
      });

      // Create test appointments
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await prismaService.appointments.create({
        data: {
          title: 'Important Meeting',
          location: 'Office',
          startTime: tomorrow,
          endTime: new Date(tomorrow.getTime() + 3600000),
          status: 'scheduled',
          notes: 'High priority',
          userId: testUserId,
        },
      });
    });

    afterEach(async () => {
      await prismaService.prospects.deleteMany({
        where: { userId: testUserId },
      });
      await prismaService.appointments.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should return prioritized items', () => {
      return request(app.getHttpServer())
        .get('/priority-inbox')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'all', limit: 20 })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('type');
            expect(res.body[0]).toHaveProperty('title');
            expect(res.body[0]).toHaveProperty('priorityScore');
            expect(res.body[0]).toHaveProperty('urgencyLevel');
            expect(res.body[0]).toHaveProperty('reasons');
            expect(res.body[0]).toHaveProperty('recommendedActions');
          }
        });
    });

    it('should filter by type - prospects only', () => {
      return request(app.getHttpServer())
        .get('/priority-inbox')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'prospects' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((item: any) => {
            expect(item.type).toBe('prospect');
          });
        });
    });

    it('should filter by type - tasks only', () => {
      return request(app.getHttpServer())
        .get('/priority-inbox')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'tasks' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((item: any) => {
            expect(item.type).toBe('appointment');
          });
        });
    });

    it('should sort by priority score descending', () => {
      return request(app.getHttpServer())
        .get('/priority-inbox')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'all', limit: 20 })
        .expect(200)
        .expect((res) => {
          if (res.body.length > 1) {
            for (let i = 0; i < res.body.length - 1; i++) {
              expect(res.body[i].priorityScore).toBeGreaterThanOrEqual(
                res.body[i + 1].priorityScore,
              );
            }
          }
        });
    });

    it('should respect limit parameter', () => {
      return request(app.getHttpServer())
        .get('/priority-inbox')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'all', limit: 1 })
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeLessThanOrEqual(1);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/priority-inbox')
        .query({ type: 'all' })
        .expect(401);
    });
  });

  describe('READ - GET /priority-inbox/stats', () => {
    beforeEach(async () => {
      // Create test data
      await prismaService.prospects.createMany({
        data: [
          {
            firstName: 'Critical',
            lastName: 'Prospect',
            email: 'critical@example.com',
            phone: '+216 98 111 111',
            city: 'Tunis',
            budget: 600000,
            status: 'qualified',
            notes: 'urgent',
            userId: testUserId,
          },
          {
            firstName: 'Low',
            lastName: 'Prospect',
            email: 'low@example.com',
            phone: '+216 98 222 222',
            city: 'Tunis',
            budget: 50000,
            status: 'new',
            userId: testUserId,
          },
        ],
      });
    });

    afterEach(async () => {
      await prismaService.prospects.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should return priority statistics', () => {
      return request(app.getHttpServer())
        .get('/priority-inbox/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('critical');
          expect(res.body).toHaveProperty('high');
          expect(res.body).toHaveProperty('medium');
          expect(res.body).toHaveProperty('low');
          expect(res.body).toHaveProperty('byType');
          expect(res.body.byType).toHaveProperty('prospects');
          expect(res.body.byType).toHaveProperty('appointments');
          expect(typeof res.body.total).toBe('number');
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/priority-inbox/stats')
        .expect(401);
    });
  });
});
