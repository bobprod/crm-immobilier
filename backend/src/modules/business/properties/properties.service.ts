import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: any) {
    return this.prisma.properties.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findAll(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;
    if (filters?.city) where.city = filters.city;
    if (filters?.minPrice) where.price = { ...where.price, gte: parseFloat(filters.minPrice) };
    if (filters?.maxPrice) where.price = { ...where.price, lte: parseFloat(filters.maxPrice) };

    return this.prisma.properties.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.properties.findFirst({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, data: any) {
    return this.prisma.properties.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.properties.delete({
      where: { id },
    });
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
    // Get existing images
    const property = await this.prisma.properties.findFirst({
      where: { id, userId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, we'll just store file names
    const existingImages = (property.images as string[]) || [];
    const newImages = files.map((file) => `/uploads/properties/${id}/${file.filename}`);

    return this.prisma.properties.update({
      where: { id },
      data: {
        images: [...existingImages, ...newImages],
      },
    });
  }

  async deleteImage(id: string, userId: string, imageUrl: string) {
    const property = await this.prisma.properties.findFirst({
      where: { id, userId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const images = (property.images as string[]) || [];
    const updatedImages = images.filter((img) => img !== imageUrl);

    return this.prisma.properties.update({
      where: { id },
      data: {
        images: updatedImages,
      },
    });
  }

  async updateStatus(id: string, userId: string, status: string) {
    return this.prisma.properties.update({
      where: { id },
      data: { status },
    });
  }

  async search(userId: string, criteria: any) {
    const where: any = { userId };

    if (criteria.type) where.type = criteria.type;
    if (criteria.category) where.category = criteria.category;
    if (criteria.status) where.status = criteria.status;
    if (criteria.city) where.city = { contains: criteria.city, mode: 'insensitive' };
    if (criteria.minPrice || criteria.maxPrice) {
      where.price = {};
      if (criteria.minPrice) where.price.gte = parseFloat(criteria.minPrice);
      if (criteria.maxPrice) where.price.lte = parseFloat(criteria.maxPrice);
    }
    if (criteria.minArea || criteria.maxArea) {
      where.area = {};
      if (criteria.minArea) where.area.gte = parseFloat(criteria.minArea);
      if (criteria.maxArea) where.area.lte = parseFloat(criteria.maxArea);
    }
    if (criteria.bedrooms) where.bedrooms = { gte: parseInt(criteria.bedrooms) };
    if (criteria.bathrooms) where.bathrooms = { gte: parseInt(criteria.bathrooms) };

    return this.prisma.properties.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: criteria.limit || 50,
    });
  }

  async getSimilar(id: string, userId: string, limit: number) {
    const property = await this.prisma.properties.findFirst({
      where: { id, userId },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    // Find similar properties based on type, category, and price range
    const priceRange = property.price * 0.2; // 20% price range

    return this.prisma.properties.findMany({
      where: {
        userId,
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

  async getNearby(userId: string, latitude: number, longitude: number, radiusKm: number) {
    // Simple distance calculation using Haversine formula
    // In production, use PostGIS or similar for better performance
    const properties = await this.prisma.properties.findMany({
      where: {
        userId,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    return properties.filter((property) => {
      if (!property.latitude || !property.longitude) return false;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        property.latitude,
        property.longitude,
      );

      return distance <= radiusKm;
    });
  }

  async getStats(userId: string) {
    const [total, available, sold, rented, avgPrice] = await Promise.all([
      this.prisma.properties.count({ where: { userId } }),
      this.prisma.properties.count({ where: { userId, status: 'available' } }),
      this.prisma.properties.count({ where: { userId, status: 'sold' } }),
      this.prisma.properties.count({ where: { userId, status: 'rented' } }),
      this.prisma.properties.aggregate({
        where: { userId },
        _avg: { price: true },
      }),
    ]);

    return {
      total,
      available,
      sold,
      rented,
      avgPrice: avgPrice._avg.price || 0,
    };
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

  async exportCSV(userId: string, filters?: any) {
    const properties = await this.findAll(userId, filters);

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
    return this.prisma.properties.update({
      where: { id },
      data: { priority },
    });
  }

  async bulkUpdatePriority(ids: string[], userId: string, priority: string) {
    return this.prisma.properties.updateMany({
      where: { id: { in: ids }, userId },
      data: { priority },
    });
  }

  async bulkUpdateStatus(ids: string[], userId: string, status: string) {
    return this.prisma.properties.updateMany({
      where: { id: { in: ids }, userId },
      data: { status },
    });
  }

  async bulkAssign(ids: string[], userId: string, assignedTo: string) {
    return this.prisma.properties.updateMany({
      where: { id: { in: ids }, userId },
      data: { assignedTo },
    });
  }

  async bulkDelete(ids: string[], userId: string) {
    return this.prisma.properties.deleteMany({
      where: { id: { in: ids }, userId },
    });
  }

  async getFeatured(userId: string) {
    return this.prisma.properties.findMany({
      where: { userId, isFeatured: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAssigned(userId: string, assignedTo: string) {
    return this.prisma.properties.findMany({
      where: { userId, assignedTo },
      orderBy: { priority: 'desc' },
    });
  }

  async getWithRelations(id: string, userId: string) {
    return this.prisma.properties.findFirst({
      where: { id, userId },
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
}
