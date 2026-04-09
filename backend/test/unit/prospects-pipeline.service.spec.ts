import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProspectsService } from '../../src/modules/business/prospects/prospects.service';
import { PrismaService } from '../../src/shared/database/prisma.service';
import { ProspectHistoryService } from '../../src/modules/business/prospects/prospect-history.service';

/**
 * 🧪 Tests Unitaires — ProspectsService.getPipeline()
 *
 * Valide la logique Kanban pipeline inspirée de Bitrix24 / Odoo CRM :
 * - Regroupement des prospects par stage
 * - Calcul du taux de conversion
 * - Gestion du champ lostReason
 * - Cas limites : pipeline vide, tous perdus, tous gagnés
 */
describe('ProspectsService - Pipeline Kanban', () => {
    let service: ProspectsService;
    let prisma: jest.Mocked<PrismaService>;

    const makeProspect = (id: string, status: string, score = 50, lostReason?: string) => ({
        id,
        firstName: 'Test',
        lastName: `User${id}`,
        email: `user${id}@test.com`,
        phone: null,
        type: 'buyer',
        status,
        score,
        source: 'website',
        budget: null,
        lostReason: lostReason || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        interactions: [],
    });

    beforeEach(async () => {
        const mockPrisma = {
            prospects: {
                findMany: jest.fn(),
                count: jest.fn(),
                aggregate: jest.fn(),
                groupBy: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                findFirst: jest.fn(),
                findUnique: jest.fn(),
            },
        };

        const mockHistoryService = {
            logChange: jest.fn(),
        };

        const mockEventEmitter = {
            emit: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProspectsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: ProspectHistoryService, useValue: mockHistoryService },
                { provide: EventEmitter2, useValue: mockEventEmitter },
            ],
        }).compile();

        service = module.get<ProspectsService>(ProspectsService);
        prisma = module.get(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getPipeline()', () => {
        it('should be defined', () => {
            expect(service.getPipeline).toBeDefined();
        });

        it('should return 7 pipeline columns', async () => {
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.getPipeline('user-1');

            expect(result.columns).toHaveLength(7);
            const keys = result.columns.map((c) => c.key);
            expect(keys).toEqual(['nouveau', 'contacte', 'qualifie', 'visite', 'offre', 'gagne', 'perdu']);
        });

        it('should return total = 0 and conversionRate = 0 when pipeline is empty', async () => {
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.getPipeline('user-1');

            expect(result.total).toBe(0);
            expect(result.conversionRate).toBe(0);
            expect(result.unassigned).toBe(0);
        });

        it('should group a prospect with status "active" into the "contacte" column', async () => {
            const prospects = [makeProspect('p1', 'active', 70)];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            const contacteCol = result.columns.find((c) => c.key === 'contacte');
            expect(contacteCol).toBeDefined();
            expect(contacteCol!.count).toBe(1);
            expect(contacteCol!.cards[0].id).toBe('p1');
        });

        it('should group a prospect with status "qualified" into the "qualifie" column', async () => {
            const prospects = [makeProspect('p2', 'qualified', 85)];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            const qualifieCol = result.columns.find((c) => c.key === 'qualifie');
            expect(qualifieCol!.count).toBe(1);
            expect(qualifieCol!.cards[0].score).toBe(85);
        });

        it('should group a prospect with status "converted" into the "gagne" column', async () => {
            const prospects = [makeProspect('p3', 'converted', 100)];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            const gagneCol = result.columns.find((c) => c.key === 'gagne');
            expect(gagneCol!.count).toBe(1);
        });

        it('should group a prospect with status "lost" into the "perdu" column and expose lostReason', async () => {
            const prospects = [makeProspect('p4', 'lost', 20, 'Prix trop élevé')];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            const perduCol = result.columns.find((c) => c.key === 'perdu');
            expect(perduCol!.count).toBe(1);
            expect(perduCol!.cards[0].lostReason).toBe('Prix trop élevé');
        });

        it('should compute correct conversionRate when some prospects are won', async () => {
            // 2 won out of 4 total → 50%
            const prospects = [
                makeProspect('p1', 'converted'),
                makeProspect('p2', 'converted'),
                makeProspect('p3', 'active'),
                makeProspect('p4', 'lost'),
            ];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            expect(result.total).toBe(4);
            expect(result.conversionRate).toBe(50);
        });

        it('should compute conversionRate = 100 when all prospects are won', async () => {
            const prospects = [
                makeProspect('p1', 'converted'),
                makeProspect('p2', 'won'),
            ];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            expect(result.conversionRate).toBe(100);
        });

        it('should count unassigned prospects (unknown status)', async () => {
            const prospects = [makeProspect('p1', 'unknown_status')];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            expect(result.unassigned).toBe(1);
            expect(result.total).toBe(1);
        });

        it('should include nextActivity from interactions when available', async () => {
            const nextActionDate = new Date(Date.now() + 86400000); // tomorrow
            const prospects = [
                {
                    ...makeProspect('p1', 'active'),
                    interactions: [
                        {
                            nextActionDate,
                            nextAction: 'Rappel client',
                            channel: 'call',
                        },
                    ],
                },
            ];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            const contacteCol = result.columns.find((c) => c.key === 'contacte');
            const card = contacteCol!.cards[0];
            expect(card.nextActivity).not.toBeNull();
            expect(card.nextActivity!.channel).toBe('call');
            expect(card.nextActivity!.nextAction).toBe('Rappel client');
        });

        it('should set nextActivity to null when no interactions', async () => {
            const prospects = [makeProspect('p1', 'qualified')];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            const qualifieCol = result.columns.find((c) => c.key === 'qualifie');
            expect(qualifieCol!.cards[0].nextActivity).toBeNull();
        });

        it('should compute totalScore per column correctly', async () => {
            const prospects = [
                makeProspect('p1', 'active', 60),
                makeProspect('p2', 'active', 80),
            ];
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue(prospects);

            const result = await service.getPipeline('user-1');

            const contacteCol = result.columns.find((c) => c.key === 'contacte');
            expect(contacteCol!.totalScore).toBe(140);
        });

        it('should query only non-deleted prospects for the given userId', async () => {
            (prisma.prospects.findMany as jest.Mock).mockResolvedValue([]);

            await service.getPipeline('user-abc');

            expect(prisma.prospects.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 'user-abc',
                        deletedAt: null,
                    }),
                }),
            );
        });
    });
});
