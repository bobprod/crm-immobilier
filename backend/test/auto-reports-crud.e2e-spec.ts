import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../shared/database/prisma.service';

describe('Auto Reports CRUD (e2e)', () => {
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
        email: 'reports-test@example.com',
        password: 'hashed_password',
        firstName: 'Reports',
        lastName: 'Test',
      },
    });
    testUserId = testUser.id;

    // Mock login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'reports-test@example.com',
        password: 'test_password',
      });

    authToken = loginResponse.body.access_token || 'mock-jwt-token';
  });

  afterAll(async () => {
    await prismaService.users.deleteMany({
      where: { email: 'reports-test@example.com' },
    });
    await app.close();
  });

  describe('CREATE - POST /auto-reports/generate', () => {
    beforeEach(async () => {
      // Create test data for reports
      await prismaService.prospects.createMany({
        data: [
          {
            firstName: 'Test1',
            lastName: 'Prospect1',
            email: 'test1@example.com',
            phone: '+216 98 111 111',
            city: 'Tunis',
            budget: 200000,
            status: 'new',
            userId: testUserId,
          },
          {
            firstName: 'Test2',
            lastName: 'Prospect2',
            email: 'test2@example.com',
            phone: '+216 98 222 222',
            city: 'Tunis',
            budget: 300000,
            status: 'qualified',
            userId: testUserId,
          },
        ],
      });

      await prismaService.properties.createMany({
        data: [
          {
            title: 'Test Property 1',
            description: 'Test description',
            address: '123 Test St',
            city: 'Tunis',
            type: 'apartment',
            price: 250000,
            surface: 100,
            rooms: 3,
            userId: testUserId,
          },
        ],
      });

      await prismaService.appointments.createMany({
        data: [
          {
            title: 'Test Appointment',
            location: 'Office',
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000),
            status: 'completed',
            userId: testUserId,
          },
        ],
      });
    });

    afterEach(async () => {
      await prismaService.prospects.deleteMany({
        where: { userId: testUserId },
      });
      await prismaService.properties.deleteMany({
        where: { userId: testUserId },
      });
      await prismaService.appointments.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should generate a daily report', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportType: 'daily',
          format: 'json',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('period');
          expect(res.body).toHaveProperty('summary');
          expect(res.body).toHaveProperty('insights');
          expect(res.body).toHaveProperty('recommendations');
          expect(res.body.period.label).toBe("Aujourd'hui");
        });
    });

    it('should generate a weekly report', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportType: 'weekly',
          format: 'json',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.period.label).toBe('Cette semaine');
        });
    });

    it('should generate a monthly report', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportType: 'monthly',
          format: 'json',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.period.label).toBe('Ce mois');
        });
    });

    it('should generate a custom report with date range', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportType: 'custom',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          format: 'json',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.period.label).toBe('Période personnalisée');
        });
    });

    it('should include summary statistics', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportType: 'daily',
          format: 'json',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.summary).toHaveProperty('totalProspects');
          expect(res.body.summary).toHaveProperty('newProspects');
          expect(res.body.summary).toHaveProperty('qualifiedProspects');
          expect(res.body.summary).toHaveProperty('totalProperties');
          expect(res.body.summary).toHaveProperty('newProperties');
          expect(res.body.summary).toHaveProperty('totalAppointments');
          expect(res.body.summary).toHaveProperty('completedAppointments');
          expect(res.body.summary).toHaveProperty('qualificationRate');
        });
    });

    it('should include insights array', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportType: 'weekly',
          format: 'json',
        })
        .expect(201)
        .expect((res) => {
          expect(Array.isArray(res.body.insights)).toBe(true);
          expect(res.body.insights.length).toBeGreaterThan(0);
        });
    });

    it('should include recommendations array', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportType: 'weekly',
          format: 'json',
        })
        .expect(201)
        .expect((res) => {
          expect(Array.isArray(res.body.recommendations)).toBe(true);
        });
    });

    it('should validate report type', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportType: 'invalid',
          format: 'json',
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .send({
          reportType: 'daily',
          format: 'json',
        })
        .expect(401);
    });
  });

  describe('READ - GET /auto-reports/history', () => {
    it('should return report history', () => {
      return request(app.getHttpServer())
        .get('/auto-reports/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // Currently returns empty array as history is not implemented
        });
    });

    it('should respect limit parameter', () => {
      return request(app.getHttpServer())
        .get('/auto-reports/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 5 })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/auto-reports/history')
        .expect(401);
    });
  });

  describe('Report Statistics Validation', () => {
    beforeEach(async () => {
      // Create specific test data for validation
      await prismaService.prospects.createMany({
        data: [
          {
            firstName: 'New',
            lastName: 'Prospect',
            email: 'new@example.com',
            phone: '+216 98 111 111',
            city: 'Tunis',
            budget: 200000,
            status: 'new',
            userId: testUserId,
          },
          {
            firstName: 'Qualified',
            lastName: 'Prospect',
            email: 'qualified@example.com',
            phone: '+216 98 222 222',
            city: 'Tunis',
            budget: 300000,
            status: 'qualified',
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

    it('should calculate qualification rate correctly', () => {
      return request(app.getHttpServer())
        .post('/auto-reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportType: 'weekly',
          format: 'json',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.summary.qualificationRate).toBeDefined();
          expect(typeof res.body.summary.qualificationRate).toBe('number');
          expect(res.body.summary.qualificationRate).toBeGreaterThanOrEqual(0);
          expect(res.body.summary.qualificationRate).toBeLessThanOrEqual(100);
        });
    });
  });
});
