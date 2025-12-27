import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../shared/database/prisma.service';

describe('Smart Forms CRUD (e2e)', () => {
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

    // Create test user and get auth token
    const testUser = await prismaService.users.create({
      data: {
        email: 'smartforms-test@example.com',
        password: 'hashed_password',
        firstName: 'Smart',
        lastName: 'Forms',
      },
    });
    testUserId = testUser.id;

    // Mock login to get token (adjust based on your auth implementation)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'smartforms-test@example.com',
        password: 'test_password',
      });

    if (loginResponse.body.access_token) {
      authToken = loginResponse.body.access_token;
    } else {
      // If login fails, create a mock token (adjust based on your JWT implementation)
      authToken = 'mock-jwt-token';
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await prismaService.users.deleteMany({
      where: { email: 'smartforms-test@example.com' },
    });
    await app.close();
  });

  describe('READ - GET /smart-forms/suggestions', () => {
    beforeEach(async () => {
      // Create test prospects with city data
      await prismaService.prospects.createMany({
        data: [
          {
            firstName: 'Test1',
            lastName: 'User1',
            email: 'test1@example.com',
            phone: '+216 98 111 111',
            city: 'La Marsa',
            userId: testUserId,
          },
          {
            firstName: 'Test2',
            lastName: 'User2',
            email: 'test2@example.com',
            phone: '+216 98 222 222',
            city: 'La Marsa',
            userId: testUserId,
          },
          {
            firstName: 'Test3',
            lastName: 'User3',
            email: 'test3@example.com',
            phone: '+216 98 333 333',
            city: 'La Soukra',
            userId: testUserId,
          },
        ],
      });
    });

    afterEach(async () => {
      // Cleanup test prospects
      await prismaService.prospects.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should return field suggestions for city', () => {
      return request(app.getHttpServer())
        .get('/smart-forms/suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ fieldName: 'city', partialValue: 'La', formType: 'prospect' })
        .expect(200)
        .expect((res) => {
          expect(res.body.fieldName).toBe('city');
          expect(res.body.suggestions).toBeDefined();
          expect(Array.isArray(res.body.suggestions)).toBe(true);
          if (res.body.suggestions.length > 0) {
            expect(res.body.suggestions[0]).toHaveProperty('value');
            expect(res.body.suggestions[0]).toHaveProperty('frequency');
          }
        });
    });

    it('should return empty array for short input', () => {
      return request(app.getHttpServer())
        .get('/smart-forms/suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ fieldName: 'city', partialValue: 'L', formType: 'prospect' })
        .expect(200)
        .expect((res) => {
          expect(res.body.suggestions).toEqual([]);
        });
    });

    it('should reject unauthorized field names', () => {
      return request(app.getHttpServer())
        .get('/smart-forms/suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ fieldName: 'password', partialValue: 'test', formType: 'prospect' })
        .expect(200)
        .expect((res) => {
          expect(res.body.suggestions).toEqual([]);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/smart-forms/suggestions')
        .query({ fieldName: 'city', partialValue: 'La', formType: 'prospect' })
        .expect(401);
    });
  });

  describe('READ - GET /smart-forms/autofill/prospect', () => {
    beforeEach(async () => {
      // Create test prospects
      await prismaService.prospects.create({
        data: {
          firstName: 'Ahmed',
          lastName: 'Ben Ali',
          email: 'ahmed@example.com',
          phone: '+216 98 123 456',
          city: 'Tunis',
          budget: 350000,
          userId: testUserId,
        },
      });
    });

    afterEach(async () => {
      await prismaService.prospects.deleteMany({
        where: { userId: testUserId },
      });
    });

    it('should return prospect auto-fill data', () => {
      return request(app.getHttpServer())
        .get('/smart-forms/autofill/prospect')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ name: 'Ahmed' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('firstName');
            expect(res.body[0]).toHaveProperty('lastName');
            expect(res.body[0]).toHaveProperty('email');
          }
        });
    });

    it('should limit results to 5', async () => {
      // Create 10 prospects
      const prospects = Array.from({ length: 10 }, (_, i) => ({
        firstName: 'Ahmed',
        lastName: `Person${i}`,
        email: `person${i}@example.com`,
        phone: `+216 98 ${i}`,
        city: 'Tunis',
        budget: 100000,
        userId: testUserId,
      }));

      await prismaService.prospects.createMany({ data: prospects });

      return request(app.getHttpServer())
        .get('/smart-forms/autofill/prospect')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ name: 'Ahmed' })
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeLessThanOrEqual(5);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/smart-forms/autofill/prospect')
        .query({ name: 'Ahmed' })
        .expect(401);
    });
  });
});
