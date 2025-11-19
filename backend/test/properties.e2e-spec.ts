import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Tests E2E pour le module Properties
 * 
 * Ces tests vérifient le fonctionnement complet
 * du flux Properties de bout en bout
 */
describe('Properties E2E', () => {
  let app: INestApplication;
  let authToken: string;
  let propertyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login pour obtenir le token
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

  describe('POST /properties', () => {
    it('should create a new property', async () => {
      const response = await request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Belle maison E2E',
          description: 'Maison de test',
          type: 'house',
          price: 350000,
          surface: 120,
          rooms: 4,
          address: '123 Test Street',
          city: 'Paris',
          zipCode: '75001',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Belle maison E2E');
      propertyId = response.body.id;
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/properties')
        .send({
          title: 'Test',
          price: 100000,
        })
        .expect(401);
    });

    it('should fail with invalid data', async () => {
      await request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          price: -1000,
        })
        .expect(400);
    });
  });

  describe('GET /properties', () => {
    it('should return all properties', async () => {
      const response = await request(app.getHttpServer())
        .get('/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('properties');
      expect(Array.isArray(response.body.properties)).toBe(true);
    });

    it('should filter properties by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/properties?type=house')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.properties.every(p => p.type === 'house')).toBe(true);
    });

    it('should filter by price range', async () => {
      const response = await request(app.getHttpServer())
        .get('/properties?minPrice=300000&maxPrice=400000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(
        response.body.properties.every(
          p => p.price >= 300000 && p.price <= 400000
        )
      ).toBe(true);
    });
  });

  describe('GET /properties/:id', () => {
    it('should return a specific property', async () => {
      const response = await request(app.getHttpServer())
        .get(`/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(propertyId);
      expect(response.body.title).toBe('Belle maison E2E');
    });

    it('should return 404 for non-existent property', async () => {
      await request(app.getHttpServer())
        .get('/properties/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /properties/:id', () => {
    it('should update a property', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          price: 360000,
          title: 'Maison mise à jour E2E',
        })
        .expect(200);

      expect(response.body.price).toBe(360000);
      expect(response.body.title).toBe('Maison mise à jour E2E');
    });
  });

  describe('DELETE /properties/:id', () => {
    it('should delete a property', async () => {
      await request(app.getHttpServer())
        .delete(`/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Vérifier que la propriété n'existe plus
      await request(app.getHttpServer())
        .get(`/properties/${propertyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Complete workflow', () => {
    it('should handle full property lifecycle', async () => {
      // 1. Créer
      const createResponse = await request(app.getHttpServer())
        .post('/properties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Workflow Test',
          type: 'apartment',
          price: 200000,
          surface: 80,
          address: '456 Workflow St',
          city: 'Lyon',
          zipCode: '69001',
        })
        .expect(201);

      const id = createResponse.body.id;

      // 2. Lire
      await request(app.getHttpServer())
        .get(`/properties/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 3. Mettre à jour
      await request(app.getHttpServer())
        .patch(`/properties/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ price: 210000 })
        .expect(200);

      // 4. Supprimer
      await request(app.getHttpServer())
        .delete(`/properties/${id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
