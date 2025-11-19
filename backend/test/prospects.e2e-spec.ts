import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Tests E2E pour le module Prospects
 */
describe('Prospects E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let prospectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a prospect', async () => {
    const response = await request(app.getHttpServer())
      .post('/prospects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+33612345678',
        source: 'website',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    prospectId = response.body.id;
  });

  it('should list prospects', async () => {
    const response = await request(app.getHttpServer())
      .get('/prospects')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body.prospects)).toBe(true);
  });

  it('should get prospect by id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/prospects/${prospectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(prospectId);
  });

  it('should update prospect', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/prospects/${prospectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'qualified' })
      .expect(200);

    expect(response.body.status).toBe('qualified');
  });

  it('should delete prospect', async () => {
    await request(app.getHttpServer())
      .delete(`/prospects/${prospectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
