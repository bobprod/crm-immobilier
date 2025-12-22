import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreatePropertyDto, UpdatePropertyDto, PropertyFiltersDto, PaginationQueryDto, PaginatedResponse } from './dto';
import { PropertyHistoryService } from './property-history.service';
import { ImageCompressionService } from '../../../shared/services/image-compression.service';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private prisma: PrismaService,
    private historyService: PropertyHistoryService,
    private imageCompression: ImageCompressionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(userId: string, data: CreatePropertyDto) {
    const property = await this.prisma.properties.create({
      data: {
        ...data,
        userId,
      },
    });

    // Log creation to history
    await this.historyService.logCreate(property.id, userId, data);

    // Invalidate cache
    await this.invalidateCache();

    return property;
  }

  async findAll(userId: string, filters?: PropertyFiltersDto) {
    const where: any = { userId, deletedAt: null }; // Filter out soft-deleted

    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;
    if (filters?.city) where.city = filters.city;
    if (filters?.minPrice) {
      where.price = { ...(where.price || {}), gte: parseFloat(String(filters.minPrice)) };
    }
    if (filters?.maxPrice) {
      where.price = { ...(where.price || {}), lte: parseFloat(String(filters.maxPrice)) };
    }

    return this.prisma.properties.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.properties.findFirst({
      where: { id, userId, deletedAt: null }, // Filter out soft-deleted
    });
  }

  async update(id: string, userId: string, data: UpdatePropertyDto) {
    // Get old data for history
    const oldProperty = await this.prisma.properties.findFirst({
      where: { id, userId },
    });

    if (!oldProperty) {
      throw new Error('Property not found');
    }

    const updated = await this.prisma.properties.update({
      where: { id },
      data,
    });

    // Log update to history
    await this.historyService.logUpdate(id, userId, oldProperty, data);

    // Invalidate cache
    await this.invalidateCache();

    return updated;
  }

  async delete(id: string, userId: string) {
    // Soft delete: Set deletedAt timestamp
    const property = await this.prisma.properties.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log deletion to history
    await this.historyService.logDelete(id, userId);

    // Invalidate cache
    await this.invalidateCache();

    return property;
  }

  /**
   * Restore a soft-deleted property
   */
  async restore(id: string, userId: string) {
    const property = await this.prisma.properties.update({
      where: { id },
      data: { deletedAt: null },
    });

    // Log restoration to history
    await this.historyService.logRestore(id, userId);

    // Invalidate cache
    await this.invalidateCache();

    return property;
  }

  /**
   * Get all trashed (soft-deleted) properties
   */
  async getTrashed(userId: string) {
    return this.prisma.properties.findMany({
      where: { 
        userId,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  /**
   * Permanently delete a property (cannot be undone)
   */
  async permanentDelete(id: string, userId: string) {
    return this.prisma.properties.delete({
      where: { id },
    });
  }

  /**
   * Cursor-based pagination for infinite scroll
   */
  async findAllPaginated(
    userId: string,
    pagination: PaginationQueryDto,
    filters?: PropertyFiltersDto,
  ): Promise<PaginatedResponse<any>> {
    const limit = pagination.limit || 20;
    const where: any = { userId, deletedAt: null };

    // Apply filters
    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;
    if (filters?.city) where.city = filters.city;
    if (filters?.minPrice || filters?.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = parseFloat(String(filters.minPrice));
      if (filters.maxPrice) where.price.lte = parseFloat(String(filters.maxPrice));
    }

    // Get total count
    const total = await this.prisma.properties.count({ where });

    // Build cursor query
    const cursorQuery: any = pagination.cursor
      ? { cursor: { id: pagination.cursor }, skip: 1 }
      : {};

    // Fetch items
    const items = await this.prisma.properties.findMany({
      where,
      take: limit + 1, // Fetch one extra to check if there's a next page
      orderBy: { createdAt: 'desc' },
      ...cursorQuery,
    });

    const hasNextPage = items.length > limit;
    const resultItems = hasNextPage ? items.slice(0, limit) : items;
    const nextCursor = hasNextPage ? resultItems[resultItems.length - 1].id : null;

    return {
      items: resultItems,
      nextCursor,
      hasNextPage,
      total,
    };
  }

  async syncWithWordPress(id: string, userId: string, wpSyncId: string) {
    return this.prisma.properties.update({
      where: { id },
      data: {
        wpSyncId,
        wpSyncedAt: new Date(),
      },
    });
  }

  async uploadImages(id: string, userId: string, files: Express.Multer.File[]) {
    // Get existing property
    const property = await this.prisma.properties.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const existingImages = (property.images as string[]) || [];
    const newImages: string[] = [];

    // Process each uploaded file with compression
    for (const file of files) {
      try {
        const originalPath = file.path;
        const compressedPath = originalPath.replace(/(\.[^.]+)$/, '_compressed$1');
        const thumbnailPath = originalPath.replace(/(\.[^.]+)$/, '_thumb$1');

        // Compress and generate thumbnail
        await this.imageCompression.processUploadedImage(
          originalPath,
          compressedPath,
          thumbnailPath,
          true, // Delete original after compression
        );

        // Store the compressed image path
        newImages.push(`/uploads/properties/${id}/${file.filename.replace(/(\.[^.]+)$/, '_compressed$1')}`);
        
        this.logger.log(`Compressed image for property ${id}: ${file.filename}`);
      } catch (error) {
        this.logger.error(`Failed to compress image: ${error.message}`);
        // Still add the original if compression fails
        newImages.push(`/uploads/properties/${id}/${file.filename}`);
      }
    }

    // Update property with new images
    const updated = await this.prisma.properties.update({
      where: { id },
      data: {
        images: [...existingImages, ...newImages],
      },
    });

    // Log image upload to history
    await this.historyService.logChange(id, userId, 'image_uploaded', undefined, {
      count: newImages.length,
    });

    return updated;
  }

  async deleteImage(id: string, userId: string, imageUrl: string) {
    const property = await this.prisma.properties.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const images = (property.images as string[]) || [];
    const updatedImages = images.filter((img) => img !== imageUrl);

    const updated = await this.prisma.properties.update({
      where: { id },
      data: {
        images: updatedImages,
      },
    });

    // Log image deletion to history
    await this.historyService.logChange(id, userId, 'image_deleted', undefined, {
      imageUrl,
    });

    return updated;
  }

  async updateStatus(id: string, userId: string, status: string) {
    // Get old status for history
    const oldProperty = await this.prisma.properties.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!oldProperty) {
      throw new Error('Property not found');
    }

    const updated = await this.prisma.properties.update({
      where: { id },
      data: { status },
    });

    // Log status change
    await this.historyService.logStatusChange(id, userId, oldProperty.status, status);

    // Invalidate cache
    await this.invalidateCache();

    return updated;
  }

  async search(userId: string, criteria: PropertyFiltersDto & { limit?: number }) {
    const where: any = { userId, deletedAt: null };

    if (criteria.type) where.type = criteria.type;
    if (criteria.category) where.category = criteria.category;
    if (criteria.status) where.status = criteria.status;
    if (criteria.city) where.city = { contains: criteria.city, mode: 'insensitive' };
    if (criteria.minPrice || criteria.maxPrice) {
      where.price = {};
      if (criteria.minPrice) where.price.gte = Number(criteria.minPrice);
      if (criteria.maxPrice) where.price.lte = Number(criteria.maxPrice);
    }
    if (criteria.minArea || criteria.maxArea) {
      where.area = {};
      if (criteria.minArea) where.area.gte = Number(criteria.minArea);
      if (criteria.maxArea) where.area.lte = Number(criteria.maxArea);
    }
    if (criteria.bedrooms) where.bedrooms = { gte: Number(criteria.bedrooms) };
    if (criteria.bathrooms) where.bathrooms = { gte: Number(criteria.bathrooms) };

    return this.prisma.properties.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: criteria.limit || 50,
    });
  }

  async getSimilar(id: string, userId: string, limit: number) {
    const property = await this.prisma.properties.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Find similar properties based on type, category, and price range
    const priceRange = property.price * 0.2; // 20% price range

    return this.prisma.properties.findMany({
      where: {
        userId,
        deletedAt: null,
        id: { not: id },
        type: property.type,
        category: property.category,
        price: {
          gte: property.price - priceRange,
          lte: property.price + priceRange,
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find nearby properties using Haversine formula
   */
  async findNearby(userId: string, latitude: number, longitude: number, radiusKm: number) {
    // Fetch all properties with coordinates
    const properties = await this.prisma.properties.findMany({
      where: {
        userId,
        deletedAt: null,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    // Calculate distances and filter
    const propertiesWithDistance = properties
      .map((property) => {
        if (!property.latitude || !property.longitude) return null;

        const distance = this.calculateDistance(
          latitude,
          longitude,
          property.latitude,
          property.longitude,
        );

        return {
          ...property,
          distance, // Distance in km
        };
      })
      .filter((p) => p !== null && p.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)

    return propertiesWithDistance;
  }

  async getStats(userId: string) {
    // Try to get from cache first
    const cacheKey = `stats:${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      this.logger.debug(`Cache hit for stats:${userId}`);
      return cached;
    }

    // Calculate stats
    const [total, available, sold, rented, avgPrice] = await Promise.all([
      this.prisma.properties.count({ where: { userId, deletedAt: null } }),
      this.prisma.properties.count({ where: { userId, deletedAt: null, status: 'available' } }),
      this.prisma.properties.count({ where: { userId, deletedAt: null, status: 'sold' } }),
      this.prisma.properties.count({ where: { userId, deletedAt: null, status: 'rented' } }),
      this.prisma.properties.aggregate({
        where: { userId, deletedAt: null },
        _avg: { price: true },
      }),
    ]);

    const stats = {
      total,
      available,
      sold,
      rented,
      avgPrice: avgPrice._avg.price || 0,
    };

    // Cache for 5 minutes (300 seconds)
    await this.cacheManager.set(cacheKey, stats, 300);

    return stats;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async exportCSV(userId: string, filters?: PropertyFiltersDto) {
    const properties = await this.findAll(userId, filters); // Already filters deletedAt: null

    // Create CSV header
    const headers = [
      'ID',
      'Titre',
      'Type',
      'Catégorie',
      'Prix',
      'Surface',
      'Chambres',
      'Salles de bain',
      'Adresse',
      'Ville',
      'Délégation',
      'Code Postal',
      'Statut',
      'Date de création',
    ];

    // Create CSV rows
    const rows = properties.map((p) => [
      p.id,
      p.title,
      p.type,
      p.category,
      p.price,
      p.area || '',
      p.bedrooms || '',
      p.bathrooms || '',
      p.address || '',
      p.city || '',
      p.delegation || '',
      p.zipCode || '',
      p.status,
      new Date(p.createdAt).toLocaleDateString('fr-FR'),
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return {
      content: csvContent,
      filename: `properties_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
    };
  }

  async importCSV(userId: string, file: Express.Multer.File) {
    // Parse CSV file
    const content = file.buffer.toString('utf-8');
    const lines = content.split('\n');

    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    // Skip header
    const dataLines = lines.slice(1).filter((line) => line.trim());

    const imported = [];
    const errors = [];

    for (let i = 0; i < dataLines.length; i++) {
      try {
        // Simple CSV parsing (in production, use a proper CSV parser library)
        const values = dataLines[i].split(',').map((v) => v.replace(/^"|"$/g, '').trim());

        const propertyData = {
          title: values[1] || `Propriété importée ${i + 1}`,
          type: values[2] || 'apartment',
          category: values[3] || 'sale',
          price: parseFloat(values[4]) || 0,
          area: values[5] ? parseFloat(values[5]) : null,
          bedrooms: values[6] ? parseInt(values[6]) : null,
          bathrooms: values[7] ? parseInt(values[7]) : null,
          address: values[8] || '',
          city: values[9] || '',
          delegation: values[10] || null,
          zipCode: values[11] || null,
          status: values[12] || 'available',
          userId,
        };

        const created = await this.prisma.properties.create({
          data: propertyData as any,
        });

        // Log import to history
        await this.historyService.logCreate(created.id, userId, propertyData);

        imported.push(created);
      } catch (error) {
        errors.push({
          line: i + 2, // +2 because of header and 0-index
          error: error.message,
        });
      }
    }

    return {
      imported: imported.length,
      errors: errors.length,
      details: errors,
      properties: imported,
    };
  }

  async updatePriority(id: string, userId: string, priority: string) {
    // Get old priority for history
    const oldProperty = await this.prisma.properties.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!oldProperty) {
      throw new Error('Property not found');
    }

    const updated = await this.prisma.properties.update({
      where: { id },
      data: { priority },
    });

    // Log priority change
    await this.historyService.logPriorityChange(id, userId, oldProperty.priority, priority);

    return updated;
  }

  async bulkUpdatePriority(ids: string[], userId: string, priority: string) {
    const result = await this.prisma.properties.updateMany({
      where: { id: { in: ids }, userId, deletedAt: null },
      data: { priority },
    });

    // Log bulk priority change
    for (const id of ids) {
      await this.historyService.logChange(id, userId, 'priority_changed', [
        { field: 'priority', oldValue: null, newValue: priority },
      ]);
    }

    // Invalidate cache
    await this.invalidateCache();

    return result;
  }

  async bulkUpdateStatus(ids: string[], userId: string, status: string) {
    const result = await this.prisma.properties.updateMany({
      where: { id: { in: ids }, userId, deletedAt: null },
      data: { status },
    });

    // Log bulk status change
    for (const id of ids) {
      await this.historyService.logChange(id, userId, 'status_changed', [
        { field: 'status', oldValue: null, newValue: status },
      ]);
    }

    // Invalidate cache
    await this.invalidateCache();

    return result;
  }

  async bulkAssign(ids: string[], userId: string, assignedTo: string) {
    const result = await this.prisma.properties.updateMany({
      where: { id: { in: ids }, userId, deletedAt: null },
      data: { assignedTo },
    });

    // Log bulk assignment
    for (const id of ids) {
      await this.historyService.logAssignment(id, userId, null, assignedTo);
    }

    return result;
  }

  async bulkDelete(ids: string[], userId: string) {
    // Soft delete multiple properties
    const result = await this.prisma.properties.updateMany({
      where: { id: { in: ids }, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    // Log bulk deletion
    for (const id of ids) {
      await this.historyService.logDelete(id, userId);
    }

    // Invalidate cache
    await this.invalidateCache();

    return result;
  }

  async getFeatured(userId: string) {
    // Try to get from cache first
    const cacheKey = `featured:${userId}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      this.logger.debug(`Cache hit for featured:${userId}`);
      return cached;
    }

    const featured = await this.prisma.properties.findMany({
      where: { userId, isFeatured: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    // Cache for 5 minutes (300 seconds)
    await this.cacheManager.set(cacheKey, featured, 300);

    return featured;
  }

  async getAssigned(userId: string, assignedTo: string) {
    return this.prisma.properties.findMany({
      where: { userId, assignedTo, deletedAt: null },
      orderBy: { priority: 'desc' },
    });
  }

  async getWithRelations(id: string, userId: string) {
    return this.prisma.properties.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        appointments: { take: 5, orderBy: { startTime: 'desc' } },
        tasks: { take: 5, orderBy: { createdAt: 'desc' } },
        matches: { take: 5, orderBy: { score: 'desc' } },
        communications: { take: 5, orderBy: { sentAt: 'desc' } },
        documents: { take: 5, orderBy: { createdAt: 'desc' } },
        owner: true,
        assignedUser: true,
      },
    });
  }

  /**
   * Get property history
   */
  async getHistory(id: string, limit = 50) {
    return this.historyService.getPropertyHistory(id, limit);
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, limit = 50) {
    return this.historyService.getUserActivity(userId, limit);
  }

  /**
   * Invalidate all property-related caches
   */
  async invalidateCache() {
    try {
      // Clear specific cache patterns for properties
      await this.cacheManager.del('featured:*');
      await this.cacheManager.del('stats:*');
      this.logger.debug('Property caches invalidated');
    } catch (error) {
      this.logger.warn(`Failed to invalidate cache: ${error.message}`);
    }
  }
}
