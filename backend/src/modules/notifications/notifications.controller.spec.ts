import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotificationsService = {
    createNotification: jest.fn(),
    getUserNotifications: jest.fn(),
    getUserNotificationsPaginated: jest.fn(),
    getUnreadNotifications: jest.fn(),
    countUnreadNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    updateNotification: jest.fn(),
    deleteNotification: jest.fn(),
    restoreNotification: jest.fn(),
    getReadingStats: jest.fn(),
    getEngagementStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return notification settings', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const result = await controller.getSettings(req);
      
      expect(result).toHaveProperty('preferredChannel');
      expect(result).toHaveProperty('optimalTimingEnabled');
      expect(result).toHaveProperty('enablePush');
      expect(result).toHaveProperty('frequency');
    });
  });

  describe('saveSettings', () => {
    it('should save notification settings', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const settings = {
        preferredChannel: 'email',
        optimalTimingEnabled: true,
        frequency: 'normal',
      };
      
      const result = await controller.saveSettings(req, settings);
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('settings');
    });
  });

  describe('getEngagementStats', () => {
    it('should return engagement statistics', async () => {
      const req = { user: { userId: 'test-user-id' } };
      const mockStats = {
        total: 100,
        unread: 20,
        read: 80,
        openRate: '80.0',
      };
      
      mockNotificationsService.getEngagementStats.mockResolvedValue(mockStats);
      
      const result = await controller.getEngagementStats(req);
      
      expect(result).toEqual(mockStats);
      expect(service.getEngagementStats).toHaveBeenCalledWith('test-user-id');
    });
  });

  describe('countUnread', () => {
    it('should return unread count', async () => {
      const req = { user: { userId: 'test-user-id' } };
      mockNotificationsService.countUnreadNotifications.mockResolvedValue(5);
      
      const result = await controller.countUnread(req);
      
      expect(result).toEqual({ count: 5 });
      expect(service.countUnreadNotifications).toHaveBeenCalledWith('test-user-id');
    });
  });
});
