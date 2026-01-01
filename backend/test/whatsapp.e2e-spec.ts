import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/core/prisma/prisma.service';

/**
 * Tests E2E pour WhatsApp
 */
describe('WhatsApp E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let configId: string;
  let conversationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    await app.init();

    // Create test user and get auth token
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `whatsapp-test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'WhatsApp Test User',
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (configId) {
      await prisma.whatsAppConfig.deleteMany({
        where: { userId },
      });
    }

    await app.close();
  });

  describe('WhatsApp Configuration', () => {
    describe('POST /whatsapp/config', () => {
      it('should create WhatsApp config successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/whatsapp/config')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            provider: 'meta',
            phoneNumberId: 'phone-123-test',
            businessAccountId: 'business-123',
            accessToken: 'test-access-token',
            isActive: true,
            autoReplyEnabled: true,
            businessHoursOnly: false,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.provider).toBe('meta');
        expect(response.body.phoneNumberId).toBe('phone-123-test');
        expect(response.body.isActive).toBe(true);

        configId = response.body.id;
      });

      it('should fail to create duplicate config', async () => {
        await request(app.getHttpServer())
          .post('/whatsapp/config')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            provider: 'meta',
            phoneNumberId: 'phone-456',
            accessToken: 'test-token',
          })
          .expect(400);
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .post('/whatsapp/config')
          .send({
            provider: 'meta',
            phoneNumberId: 'phone-789',
          })
          .expect(401);
      });
    });

    describe('GET /whatsapp/config', () => {
      it('should get WhatsApp config successfully', async () => {
        const response = await request(app.getHttpServer())
          .get('/whatsapp/config')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body.userId).toBe(userId);
        expect(response.body.provider).toBe('meta');
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .get('/whatsapp/config')
          .expect(401);
      });
    });

    describe('PUT /whatsapp/config', () => {
      it('should update WhatsApp config successfully', async () => {
        const response = await request(app.getHttpServer())
          .put('/whatsapp/config')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            isActive: false,
            autoReplyEnabled: false,
          })
          .expect(200);

        expect(response.body.isActive).toBe(false);
        expect(response.body.autoReplyEnabled).toBe(false);
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .put('/whatsapp/config')
          .send({ isActive: true })
          .expect(401);
      });
    });
  });

  describe('Message Sending', () => {
    beforeAll(async () => {
      // Ensure config is active for message tests
      await request(app.getHttpServer())
        .put('/whatsapp/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isActive: true });
    });

    describe('POST /whatsapp/messages/text', () => {
      it('should send text message successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/whatsapp/messages/text')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            phoneNumber: '+33612345678',
            message: 'Hello E2E Test',
          })
          .expect(201);

        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('messageId');
        expect(response.body).toHaveProperty('conversationId');

        conversationId = response.body.conversationId;
      });

      it('should fail with inactive config', async () => {
        // Deactivate config
        await request(app.getHttpServer())
          .put('/whatsapp/config')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ isActive: false });

        await request(app.getHttpServer())
          .post('/whatsapp/messages/text')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            phoneNumber: '+33612345678',
            message: 'Test',
          })
          .expect(400);

        // Reactivate config
        await request(app.getHttpServer())
          .put('/whatsapp/config')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ isActive: true });
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .post('/whatsapp/messages/text')
          .send({
            phoneNumber: '+33612345678',
            message: 'Test',
          })
          .expect(401);
      });

      it('should fail with invalid phone number', async () => {
        await request(app.getHttpServer())
          .post('/whatsapp/messages/text')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            phoneNumber: 'invalid',
            message: 'Test',
          })
          .expect(400);
      });
    });

    describe('POST /whatsapp/messages/media', () => {
      it('should send media message successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/whatsapp/messages/media')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            phoneNumber: '+33612345678',
            type: 'image',
            mediaUrl: 'https://example.com/test-image.jpg',
            caption: 'Test image E2E',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('messageId');
      });

      it('should send different media types', async () => {
        const mediaTypes = [
          { type: 'document', url: 'https://example.com/doc.pdf' },
          { type: 'video', url: 'https://example.com/video.mp4' },
          { type: 'audio', url: 'https://example.com/audio.mp3' },
        ];

        for (const media of mediaTypes) {
          const response = await request(app.getHttpServer())
            .post('/whatsapp/messages/media')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              phoneNumber: '+33612345678',
              type: media.type,
              mediaUrl: media.url,
            })
            .expect(201);

          expect(response.body.success).toBe(true);
        }
      });
    });

    describe('POST /whatsapp/messages/template', () => {
      it('should send template message successfully', async () => {
        // First create a template
        const template = await prisma.whatsAppTemplate.create({
          data: {
            configId,
            name: 'test_template',
            language: 'fr',
            category: 'marketing',
            body: 'Bonjour {{1}}, bienvenue!',
            status: 'approved',
            variables: ['name'],
          },
        });

        const response = await request(app.getHttpServer())
          .post('/whatsapp/messages/template')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            phoneNumber: '+33612345678',
            templateName: 'test_template',
            language: 'fr',
            parameters: ['John'],
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('messageId');

        // Cleanup
        await prisma.whatsAppTemplate.delete({ where: { id: template.id } });
      });

      it('should fail with non-existent template', async () => {
        await request(app.getHttpServer())
          .post('/whatsapp/messages/template')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            phoneNumber: '+33612345678',
            templateName: 'non_existent_template',
            language: 'fr',
          })
          .expect(404);
      });
    });

    describe('POST /whatsapp/messages/bulk', () => {
      it('should send bulk messages successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/whatsapp/messages/bulk')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            phoneNumbers: ['+33612345678', '+33698765432'],
            message: 'Bulk message E2E test',
            delayMs: 100,
          })
          .expect(201);

        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('successful');
        expect(response.body).toHaveProperty('failed');
        expect(response.body).toHaveProperty('results');
        expect(response.body.total).toBe(2);
      });
    });
  });

  describe('Conversation Management', () => {
    describe('GET /whatsapp/conversations', () => {
      it('should get conversations list', async () => {
        const response = await request(app.getHttpServer())
          .get('/whatsapp/conversations')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('conversations');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.conversations)).toBe(true);
      });

      it('should filter conversations by status', async () => {
        const response = await request(app.getHttpServer())
          .get('/whatsapp/conversations?status=open')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.conversations.every((c: any) => c.status === 'open')).toBe(true);
      });

      it('should filter by phone number', async () => {
        const response = await request(app.getHttpServer())
          .get('/whatsapp/conversations?phoneNumber=%2B33612345678')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.conversations).toBeDefined();
      });

      it('should paginate results', async () => {
        const response = await request(app.getHttpServer())
          .get('/whatsapp/conversations?limit=10&offset=0')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.limit).toBe(10);
        expect(response.body.offset).toBe(0);
      });
    });

    describe('GET /whatsapp/conversations/:id', () => {
      it('should get conversation by ID with messages', async () => {
        if (!conversationId) {
          // Create a conversation first
          const sendResponse = await request(app.getHttpServer())
            .post('/whatsapp/messages/text')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              phoneNumber: '+33612345678',
              message: 'Test for conversation',
            });

          conversationId = sendResponse.body.conversationId;
        }

        const response = await request(app.getHttpServer())
          .get(`/whatsapp/conversations/${conversationId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('messages');
        expect(Array.isArray(response.body.messages)).toBe(true);
      });

      it('should fail with non-existent conversation', async () => {
        await request(app.getHttpServer())
          .get('/whatsapp/conversations/non-existent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('PUT /whatsapp/conversations/:id', () => {
      it('should update conversation successfully', async () => {
        const response = await request(app.getHttpServer())
          .put(`/whatsapp/conversations/${conversationId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            tags: ['important', 'follow-up'],
            status: 'assigned',
          })
          .expect(200);

        expect(response.body.tags).toContain('important');
        expect(response.body.status).toBe('assigned');
      });
    });

    describe('POST /whatsapp/conversations/:id/close', () => {
      it('should close conversation successfully', async () => {
        const response = await request(app.getHttpServer())
          .post(`/whatsapp/conversations/${conversationId}/close`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(201);

        expect(response.body.status).toBe('closed');
      });
    });

    describe('POST /whatsapp/conversations/:id/assign', () => {
      it('should assign conversation to user', async () => {
        // Create another user for assignment
        const agentResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: `agent-${Date.now()}@example.com`,
            password: 'password123',
            name: 'Agent User',
          });

        const agentUserId = agentResponse.body.user.id;

        const response = await request(app.getHttpServer())
          .post(`/whatsapp/conversations/${conversationId}/assign`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            userId: agentUserId,
          })
          .expect(201);

        expect(response.body.status).toBe('assigned');
        expect(response.body.assignedTo).toBe(agentUserId);
      });
    });
  });

  describe('Webhook Endpoints', () => {
    describe('GET /whatsapp/webhook', () => {
      it('should verify webhook with valid token', async () => {
        process.env.WHATSAPP_META_WEBHOOK_TOKEN = 'test_verify_token';

        const response = await request(app.getHttpServer())
          .get('/whatsapp/webhook')
          .query({
            'hub.mode': 'subscribe',
            'hub.verify_token': 'test_verify_token',
            'hub.challenge': 'challenge_123',
          })
          .expect(200);

        expect(response.text).toBe('challenge_123');
      });

      it('should reject webhook with invalid token', async () => {
        await request(app.getHttpServer())
          .get('/whatsapp/webhook')
          .query({
            'hub.mode': 'subscribe',
            'hub.verify_token': 'wrong_token',
            'hub.challenge': 'challenge_123',
          })
          .expect(400);
      });
    });

    describe('POST /whatsapp/webhook', () => {
      it('should accept incoming webhook', async () => {
        const webhook = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: 'entry-123',
              changes: [
                {
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      phone_number_id: 'phone-123-test',
                    },
                    messages: [
                      {
                        from: '33612345678',
                        id: 'msg-webhook-123',
                        timestamp: '1234567890',
                        type: 'text',
                        text: {
                          body: 'Hello from webhook',
                        },
                      },
                    ],
                    statuses: [],
                    contacts: [],
                  },
                  field: 'messages',
                },
              ],
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/whatsapp/webhook')
          .send(webhook)
          .expect(200);

        expect(response.body.status).toBe('ok');
      });
    });
  });

  describe('DELETE /whatsapp/config', () => {
    it('should delete WhatsApp config successfully', async () => {
      await request(app.getHttpServer())
        .delete('/whatsapp/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify config is deleted
      await request(app.getHttpServer())
        .get('/whatsapp/config')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
