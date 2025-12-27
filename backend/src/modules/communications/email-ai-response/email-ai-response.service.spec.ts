import { Test, TestingModule } from '@nestjs/testing';
import { EmailAIResponseService } from './email-ai-response.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { QuickWinsLLMService } from '../../intelligence/quick-wins-llm/quick-wins-llm.service';
import { CommunicationsService } from '../communications.service';

describe('EmailAIResponseService', () => {
  let service: EmailAIResponseService;
  let prismaService: PrismaService;
  let llmService: QuickWinsLLMService;
  let communicationsService: CommunicationsService;

  const mockPrismaService = {
    emailAIAnalysis: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    emailAIDraft: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    prospect: {
      findUnique: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
    },
    communication: {
      findMany: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
  };

  const mockLLMService = {
    analyzeText: jest.fn(),
  };

  const mockCommunicationsService = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailAIResponseService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: QuickWinsLLMService,
          useValue: mockLLMService,
        },
        {
          provide: CommunicationsService,
          useValue: mockCommunicationsService,
        },
      ],
    }).compile();

    service = module.get<EmailAIResponseService>(EmailAIResponseService);
    prismaService = module.get<PrismaService>(PrismaService);
    llmService = module.get<QuickWinsLLMService>(QuickWinsLLMService);
    communicationsService = module.get<CommunicationsService>(CommunicationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeEmail', () => {
    it('should analyze email and detect intent using LLM', async () => {
      const userId = 'user-1';
      const emailData = {
        from: 'client@example.com',
        subject: 'Interested in apartment',
        body: 'Hello, I would like to schedule a visit',
      };

      mockLLMService.analyzeText.mockResolvedValue({
        intent: 'appointment',
        confidence: 0.9,
        keywords: ['schedule', 'visit', 'appointment'],
      });

      mockPrismaService.emailAIAnalysis.create.mockResolvedValue({
        id: 'analysis-1',
        userId,
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        intent: 'appointment',
        confidence: 90,
        keywords: ['schedule', 'visit', 'appointment'],
        suggestedActions: ['Schedule a visit', 'Send availability'],
        contextGathered: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.analyzeEmail(userId, emailData);

      expect(result.intent).toBe('appointment');
      expect(result.confidence).toBe(90);
      expect(result.keywords).toContain('schedule');
      expect(mockLLMService.analyzeText).toHaveBeenCalledWith(
        userId,
        expect.stringContaining('Subject: Interested in apartment'),
      );
    });

    it('should fallback to rule-based detection when LLM fails', async () => {
      const userId = 'user-1';
      const emailData = {
        from: 'client@example.com',
        subject: 'Price negotiation',
        body: 'Can we negotiate the price? My budget is lower.',
      };

      mockLLMService.analyzeText.mockRejectedValue(new Error('LLM unavailable'));

      mockPrismaService.emailAIAnalysis.create.mockResolvedValue({
        id: 'analysis-1',
        userId,
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        intent: 'negotiation',
        confidence: 70,
        keywords: ['negotiate', 'price', 'budget'],
        suggestedActions: ['Discuss pricing options'],
        contextGathered: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.analyzeEmail(userId, emailData);

      expect(result.intent).toBe('negotiation');
      expect(result.keywords).toContain('negotiate');
    });

    it('should gather prospect context when prospectId provided', async () => {
      const userId = 'user-1';
      const prospectId = 'prospect-1';
      const emailData = {
        from: 'client@example.com',
        subject: 'Question',
        body: 'I have a question',
        prospectId,
      };

      mockPrismaService.prospect.findUnique.mockResolvedValue({
        id: prospectId,
        name: 'John Doe',
        email: 'client@example.com',
        phone: '+1234567890',
        budget: 300000,
      });

      mockPrismaService.communication.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.findMany.mockResolvedValue([]);

      mockLLMService.analyzeText.mockResolvedValue({
        intent: 'information',
        confidence: 0.85,
        keywords: ['question'],
      });

      mockPrismaService.emailAIAnalysis.create.mockResolvedValue({
        id: 'analysis-1',
        userId,
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        intent: 'information',
        confidence: 85,
        keywords: ['question'],
        suggestedActions: [],
        contextGathered: {
          prospect: {
            name: 'John Doe',
            email: 'client@example.com',
            budget: 300000,
          },
        },
        prospectId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.analyzeEmail(userId, emailData);

      expect(result.contextGathered).toHaveProperty('prospect');
      expect(result.contextGathered.prospect.name).toBe('John Doe');
      expect(mockPrismaService.prospect.findUnique).toHaveBeenCalledWith({
        where: { id: prospectId },
      });
    });
  });

  describe('generateDraft', () => {
    it('should generate email draft using LLM', async () => {
      const userId = 'user-1';
      const analysisId = 'analysis-1';

      mockPrismaService.emailAIAnalysis.findUnique.mockResolvedValue({
        id: analysisId,
        userId,
        from: 'client@example.com',
        subject: 'Question about apartment',
        body: 'I would like more information',
        intent: 'information',
        confidence: 85,
        keywords: ['information', 'apartment'],
        suggestedActions: ['Send property details'],
        contextGathered: {
          prospect: { name: 'John Doe' },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockLLMService.analyzeText.mockResolvedValue({
        subject: 'RE: Question about apartment',
        body: '<p>Dear John Doe,</p><p>Thank you for your interest...</p>',
      });

      mockPrismaService.emailAIDraft.create.mockResolvedValue({
        id: 'draft-1',
        analysisId,
        userId,
        to: 'client@example.com',
        subject: 'RE: Question about apartment',
        body: '<p>Dear John Doe,</p><p>Thank you for your interest...</p>',
        attachmentSuggestions: ['Property brochure', 'Floor plans'],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.generateDraft(userId, { analysisId });

      expect(result.subject).toContain('RE:');
      expect(result.body).toContain('Dear John Doe');
      expect(result.status).toBe('pending');
      expect(mockLLMService.analyzeText).toHaveBeenCalled();
    });

    it('should use fallback template when LLM fails', async () => {
      const userId = 'user-1';
      const analysisId = 'analysis-1';

      mockPrismaService.emailAIAnalysis.findUnique.mockResolvedValue({
        id: analysisId,
        userId,
        from: 'client@example.com',
        subject: 'Question',
        body: 'I have a question',
        intent: 'information',
        confidence: 80,
        keywords: [],
        suggestedActions: [],
        contextGathered: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockLLMService.analyzeText.mockRejectedValue(new Error('LLM unavailable'));

      mockPrismaService.emailAIDraft.create.mockResolvedValue({
        id: 'draft-1',
        analysisId,
        userId,
        to: 'client@example.com',
        subject: 'RE: Question',
        body: expect.stringContaining('Bonjour'),
        attachmentSuggestions: [],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.generateDraft(userId, { analysisId });

      expect(result.body).toBeTruthy();
      expect(result.status).toBe('pending');
    });

    it('should include attachment suggestions based on intent', async () => {
      const userId = 'user-1';
      const analysisId = 'analysis-1';

      mockPrismaService.emailAIAnalysis.findUnique.mockResolvedValue({
        id: analysisId,
        userId,
        from: 'client@example.com',
        subject: 'Need property details',
        body: 'Can you send me the details?',
        intent: 'information',
        confidence: 90,
        keywords: ['details', 'property'],
        suggestedActions: [],
        contextGathered: {
          property: { title: 'Luxury Apartment' },
        },
        propertyId: 'property-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockLLMService.analyzeText.mockResolvedValue({
        subject: 'RE: Need property details',
        body: '<p>Here are the details...</p>',
      });

      mockPrismaService.emailAIDraft.create.mockResolvedValue({
        id: 'draft-1',
        analysisId,
        userId,
        to: 'client@example.com',
        subject: 'RE: Need property details',
        body: '<p>Here are the details...</p>',
        attachmentSuggestions: [
          'Fiche détaillée de la propriété',
          'Photos haute résolution',
          'Plan de masse',
        ],
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.generateDraft(userId, { analysisId });

      expect(result.attachmentSuggestions).toHaveLength(3);
      expect(result.attachmentSuggestions).toContain('Fiche détaillée de la propriété');
    });
  });

  describe('approveAndSend', () => {
    it('should send email and update draft status', async () => {
      const userId = 'user-1';
      const draftId = 'draft-1';
      const approvalData = {
        draftId,
        subject: 'RE: Question',
        body: '<p>Modified email body...</p>',
      };

      mockPrismaService.emailAIDraft.findUnique.mockResolvedValue({
        id: draftId,
        userId,
        to: 'client@example.com',
        subject: 'Original subject',
        body: 'Original body',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockCommunicationsService.sendEmail.mockResolvedValue({
        id: 'comm-1',
        success: true,
      });

      mockPrismaService.emailAIDraft.update.mockResolvedValue({
        id: draftId,
        userId,
        to: 'client@example.com',
        subject: approvalData.subject,
        body: approvalData.body,
        status: 'sent',
        sentAt: new Date(),
        communicationId: 'comm-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.approveAndSend(userId, approvalData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('comm-1');
      expect(mockCommunicationsService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'client@example.com',
          subject: approvalData.subject,
          body: approvalData.body,
        }),
      );
      expect(mockPrismaService.emailAIDraft.update).toHaveBeenCalledWith({
        where: { id: draftId },
        data: expect.objectContaining({
          status: 'sent',
          sentAt: expect.any(Date),
        }),
      });
    });

    it('should throw error if draft not found', async () => {
      const userId = 'user-1';
      const approvalData = {
        draftId: 'non-existent',
        subject: 'Test',
        body: 'Test',
      };

      mockPrismaService.emailAIDraft.findUnique.mockResolvedValue(null);

      await expect(service.approveAndSend(userId, approvalData)).rejects.toThrow();
    });
  });

  describe('getDrafts', () => {
    it('should return drafts filtered by status', async () => {
      const userId = 'user-1';

      mockPrismaService.emailAIDraft.findMany.mockResolvedValue([
        {
          id: 'draft-1',
          userId,
          to: 'client1@example.com',
          subject: 'RE: Question 1',
          body: 'Response 1',
          status: 'pending',
          createdAt: new Date(),
          analysis: {
            intent: 'information',
            confidence: 85,
          },
        },
        {
          id: 'draft-2',
          userId,
          to: 'client2@example.com',
          subject: 'RE: Question 2',
          body: 'Response 2',
          status: 'pending',
          createdAt: new Date(),
          analysis: {
            intent: 'appointment',
            confidence: 90,
          },
        },
      ]);

      const result = await service.getDrafts(userId, { status: 'pending' });

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(mockPrismaService.emailAIDraft.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          status: 'pending',
          deletedAt: null,
        },
        include: {
          analysis: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getHistory', () => {
    it('should return analysis history with pagination', async () => {
      const userId = 'user-1';

      mockPrismaService.emailAIAnalysis.findMany.mockResolvedValue([
        {
          id: 'analysis-1',
          userId,
          from: 'client1@example.com',
          subject: 'Question 1',
          intent: 'information',
          confidence: 85,
          createdAt: new Date(),
        },
        {
          id: 'analysis-2',
          userId,
          from: 'client2@example.com',
          subject: 'Question 2',
          intent: 'appointment',
          confidence: 90,
          createdAt: new Date(),
        },
      ]);

      const result = await service.getHistory(userId, { limit: 10 });

      expect(result).toHaveLength(2);
      expect(mockPrismaService.emailAIAnalysis.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: null,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getStats', () => {
    it('should return statistics for email AI responses', async () => {
      const userId = 'user-1';

      mockPrismaService.emailAIAnalysis.findMany.mockResolvedValue([
        { intent: 'information', createdAt: new Date() },
        { intent: 'appointment', createdAt: new Date() },
        { intent: 'information', createdAt: new Date() },
      ]);

      mockPrismaService.emailAIDraft.findMany
        .mockResolvedValueOnce([{ id: '1' }, { id: '2' }]) // Total drafts
        .mockResolvedValueOnce([{ id: '1', sentAt: new Date() }]); // Sent drafts

      const result = await service.getStats(userId);

      expect(result.totalAnalyzed).toBe(3);
      expect(result.totalDraftsGenerated).toBe(2);
      expect(result.totalSent).toBe(1);
      expect(result.intentDistribution).toHaveProperty('information', 2);
      expect(result.intentDistribution).toHaveProperty('appointment', 1);
    });
  });
});
