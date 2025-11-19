import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Tests E2E pour l'authentification
 */
describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    it('should fail with duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'password123',
          name: 'User 1',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'password123',
          name: 'User 2',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('should fail with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
