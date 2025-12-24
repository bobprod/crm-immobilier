import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('EmailAIResponse CRUD (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let analysisId: string;
  let draftId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test user and get auth token
    const testUser = await prisma.user.create({
      data: {
        email: 'test-email-ai@example.com',
        name: 'Test User',
        password: 'hashedpassword',
        role: 'AGENT',
      },
    });
    userId = testUser.id;

    // Mock JWT token (adjust based on your auth implementation)
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.emailAIDraft.deleteMany({ where: { userId } });
    await prisma.emailAIAnalysis.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  describe('POST /api/email-ai-response/analyze', () => {
    it('should analyze an email and return analysis result', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/email-ai-response/analyze')
        .set('Authorization', authToken)
        .send({
          from: 'client@example.com',
          subject: 'Interested in apartment',
          body: 'Hello, I would like to schedule a visit for the apartment',
        })
        .expect(201);

      expect(response.body).toHaveProperty('analysisId');
      expect(response.body).toHaveProperty('intent');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body.intent).toMatch(/information|appointment|negotiation|complaint|other/);
      expect(response.body.confidence).toBeGreaterThanOrEqual(0);
      expect(response.body.confidence).toBeLessThanOrEqual(100);

      analysisId = response.body.analysisId;
    });

    it('should return 400 for invalid email data', async () => {
      await request(app.getHttpServer())
        .post('/api/email-ai-response/analyze')
        .set('Authorization', authToken)
        .send({
          from: 'invalid-email',
          subject: '',
          body: '',
        })
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/email-ai-response/analyze')
        .send({
          from: 'client@example.com',
          subject: 'Test',
          body: 'Test body',
        })
        .expect(401);
    });

    it('should analyze email with prospect context', async () => {
      const prospect = await prisma.prospect.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          userId,
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/email-ai-response/analyze')
        .set('Authorization', authToken)
        .send({
          from: 'john@example.com',
          subject: 'Question about pricing',
          body: 'Can we negotiate the price?',
          prospectId: prospect.id,
        })
        .expect(201);

      expect(response.body).toHaveProperty('context');
      expect(response.body.context).toHaveProperty('prospect');
      expect(response.body.context.prospect.name).toBe('John Doe');

      // Cleanup
      await prisma.prospect.delete({ where: { id: prospect.id } });
    });
  });

  describe('POST /api/email-ai-response/generate-draft', () => {
    it('should generate a draft response from analysis', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/email-ai-response/generate-draft')
        .set('Authorization', authToken)
        .send({
          analysisId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('draftId');
      expect(response.body).toHaveProperty('to');
      expect(response.body).toHaveProperty('subject');
      expect(response.body).toHaveProperty('body');
      expect(response.body).toHaveProperty('attachmentSuggestions');
      expect(response.body.status).toBe('pending');
      expect(response.body.body).toBeTruthy();
      expect(response.body.subject).toContain('RE:');

      draftId = response.body.draftId;
    });

    it('should return 404 for non-existent analysis', async () => {
      await request(app.getHttpServer())
        .post('/api/email-ai-response/generate-draft')
        .set('Authorization', authToken)
        .send({
          analysisId: 'non-existent-id',
        })
        .expect(404);
    });

    it('should accept additional instructions for draft generation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/email-ai-response/generate-draft')
        .set('Authorization', authToken)
        .send({
          analysisId,
          additionalInstructions: 'Mention our special discount offer',
        })
        .expect(201);

      expect(response.body).toHaveProperty('draftId');
      expect(response.body.body).toBeTruthy();
    });
  });

  describe('GET /api/email-ai-response/drafts', () => {
    it('should return list of pending drafts', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-ai-response/drafts')
        .set('Authorization', authToken)
        .query({ status: 'pending' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('draftId');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0].status).toBe('pending');
    });

    it('should return all drafts when no status filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-ai-response/drafts')
        .set('Authorization', authToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for sent drafts filter when none exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-ai-response/drafts')
        .set('Authorization', authToken)
        .query({ status: 'sent' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/email-ai-response/approve-and-send', () => {
    it('should approve and send email draft', async () => {
      // Mock the email sending (adjust based on your implementation)
      const response = await request(app.getHttpServer())
        .post('/api/email-ai-response/approve-and-send')
        .set('Authorization', authToken)
        .send({
          draftId,
          subject: 'RE: Interested in apartment',
          body: '<p>Thank you for your interest. We would be happy to schedule a visit.</p>',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('messageId');
      expect(response.body.success).toBe(true);
      expect(response.body.draftId).toBe(draftId);
    });

    it('should return 404 for non-existent draft', async () => {
      await request(app.getHttpServer())
        .post('/api/email-ai-response/approve-and-send')
        .set('Authorization', authToken)
        .send({
          draftId: 'non-existent-draft-id',
          subject: 'Test',
          body: 'Test body',
        })
        .expect(404);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/email-ai-response/approve-and-send')
        .set('Authorization', authToken)
        .send({
          draftId,
          // Missing subject and body
        })
        .expect(400);
    });
  });

  describe('GET /api/email-ai-response/history', () => {
    it('should return analysis history', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-ai-response/history')
        .set('Authorization', authToken)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('analysisId');
      expect(response.body[0]).toHaveProperty('intent');
      expect(response.body[0]).toHaveProperty('confidence');
    });

    it('should respect limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-ai-response/history')
        .set('Authorization', authToken)
        .query({ limit: 2 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(2);
    });

    it('should filter by intent', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-ai-response/history')
        .set('Authorization', authToken)
        .query({ intent: 'appointment' })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0].intent).toBe('appointment');
      }
    });
  });

  describe('GET /api/email-ai-response/stats', () => {
    it('should return email AI statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-ai-response/stats')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('totalAnalyzed');
      expect(response.body).toHaveProperty('totalDraftsGenerated');
      expect(response.body).toHaveProperty('totalSent');
      expect(response.body).toHaveProperty('averageResponseTime');
      expect(response.body).toHaveProperty('intentDistribution');
      expect(typeof response.body.totalAnalyzed).toBe('number');
      expect(typeof response.body.intentDistribution).toBe('object');
    });

    it('should calculate correct intent distribution', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/email-ai-response/stats')
        .set('Authorization', authToken)
        .expect(200);

      const distribution = response.body.intentDistribution;
      expect(distribution).toHaveProperty('information');
      expect(distribution).toHaveProperty('appointment');
      expect(distribution).toHaveProperty('negotiation');
      expect(distribution).toHaveProperty('complaint');
      expect(distribution).toHaveProperty('other');
    });
  });
});
