import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

export interface HistoryChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export type HistoryAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'restore' 
  | 'status_changed'
  | 'priority_changed'
  | 'assigned'
  | 'image_uploaded'
  | 'image_deleted';

@Injectable()
export class PropertyHistoryService {
  private readonly logger = new Logger(PropertyHistoryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Log a property change to history
   * @param propertyId ID of the property
   * @param userId ID of the user making the change
   * @param action Type of action performed
   * @param changes Array of field changes (optional)
   * @param metadata Additional metadata (optional)
   */
  async logChange(
    propertyId: string,
    userId: string,
    action: HistoryAction,
    changes?: HistoryChange[],
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.prisma.propertyHistory.create({
        data: {
          propertyId,
          userId,
          action,
          changes: changes || null,
          metadata: metadata || null,
        },
      });
      
      this.logger.debug(
        `Logged ${action} for property ${propertyId} by user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log history for property ${propertyId}: ${error.message}`,
      );
      // Don't throw - history logging should not break main operations
    }
  }

  /**
   * Get history for a specific property
   * @param propertyId ID of the property
   * @param limit Maximum number of records to return
   * @returns Array of history records
   */
  async getPropertyHistory(propertyId: string, limit = 50) {
    return this.prisma.propertyHistory.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get user activity across all properties
   * @param userId ID of the user
   * @param limit Maximum number of records to return
   * @returns Array of history records with property info
   */
  async getUserActivity(userId: string, limit = 50) {
    return this.prisma.propertyHistory.findMany({
      where: { userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            reference: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get recent activity for all properties
   * @param userId Optional user ID to filter by
   * @param limit Maximum number of records to return
   * @returns Array of history records
   */
  async getRecentActivity(userId?: string, limit = 100) {
    const where = userId ? { userId } : {};
    
    return this.prisma.propertyHistory.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            reference: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Compare two property objects and extract changes
   * @param oldData Previous property data
   * @param newData New property data
   * @returns Array of changes
   */
  detectChanges(
    oldData: Record<string, any>,
    newData: Record<string, any>,
  ): HistoryChange[] {
    const changes: HistoryChange[] = [];
    const fieldsToTrack = [
      'title',
      'description',
      'type',
      'category',
      'price',
      'status',
      'priority',
      'area',
      'bedrooms',
      'bathrooms',
      'address',
      'city',
      'delegation',
      'zipCode',
      'latitude',
      'longitude',
      'assignedTo',
      'isFeatured',
      'notes',
      'ownerId',
    ];

    for (const field of fieldsToTrack) {
      if (
        newData[field] !== undefined &&
        oldData[field] !== newData[field]
      ) {
        changes.push({
          field,
          oldValue: oldData[field],
          newValue: newData[field],
        });
      }
    }

    return changes;
  }

  /**
   * Log property creation
   */
  async logCreate(propertyId: string, userId: string, data: any) {
    await this.logChange(propertyId, userId, 'create', undefined, {
      initialData: data,
    });
  }

  /**
   * Log property update
   */
  async logUpdate(
    propertyId: string,
    userId: string,
    oldData: any,
    newData: any,
  ) {
    const changes = this.detectChanges(oldData, newData);
    if (changes.length > 0) {
      await this.logChange(propertyId, userId, 'update', changes);
    }
  }

  /**
   * Log property deletion (soft delete)
   */
  async logDelete(propertyId: string, userId: string) {
    await this.logChange(propertyId, userId, 'delete');
  }

  /**
   * Log property restoration
   */
  async logRestore(propertyId: string, userId: string) {
    await this.logChange(propertyId, userId, 'restore');
  }

  /**
   * Log status change
   */
  async logStatusChange(
    propertyId: string,
    userId: string,
    oldStatus: string,
    newStatus: string,
  ) {
    await this.logChange(propertyId, userId, 'status_changed', [
      { field: 'status', oldValue: oldStatus, newValue: newStatus },
    ]);
  }

  /**
   * Log priority change
   */
  async logPriorityChange(
    propertyId: string,
    userId: string,
    oldPriority: string,
    newPriority: string,
  ) {
    await this.logChange(propertyId, userId, 'priority_changed', [
      { field: 'priority', oldValue: oldPriority, newValue: newPriority },
    ]);
  }

  /**
   * Log assignment change
   */
  async logAssignment(
    propertyId: string,
    userId: string,
    oldAssignee: string | null,
    newAssignee: string,
  ) {
    await this.logChange(propertyId, userId, 'assigned', [
      { field: 'assignedTo', oldValue: oldAssignee, newValue: newAssignee },
    ]);
  }
}
