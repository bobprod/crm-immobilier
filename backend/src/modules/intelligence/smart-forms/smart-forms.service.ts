import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { FormSuggestionQueryDto, FormSuggestion } from './dto/form-suggestion.dto';

@Injectable()
export class SmartFormsService {
  private readonly logger = new Logger(SmartFormsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obtenir des suggestions pour un champ de formulaire
   */
  async getFieldSuggestions(
    userId: string,
    query: FormSuggestionQueryDto,
  ): Promise<FormSuggestion[]> {
    try {
      const { fieldName, partialValue, formType, context } = query;
      this.logger.log(`Getting suggestions for field: ${fieldName}, type: ${formType}`);

      // Suggestions basées sur l'historique de l'utilisateur
      const suggestions = await this.getHistoricalSuggestions(
        userId,
        fieldName,
        formType,
        partialValue,
      );

      return suggestions;
    } catch (error) {
      this.logger.error(`Error getting field suggestions: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtenir des suggestions basées sur l'historique
   */
  private async getHistoricalSuggestions(
    userId: string,
    fieldName: string,
    formType: string,
    partialValue?: string,
  ): Promise<FormSuggestion[]> {
    const suggestions: FormSuggestion[] = [];

    try {
      switch (formType) {
        case 'prospect':
          return await this.getProspectSuggestions(userId, fieldName, partialValue);
        case 'property':
          return await this.getPropertySuggestions(userId, fieldName, partialValue);
        case 'appointment':
          return await this.getAppointmentSuggestions(userId, fieldName, partialValue);
        default:
          return suggestions;
      }
    } catch (error) {
      this.logger.error(`Error getting historical suggestions: ${error.message}`);
      return suggestions;
    }
  }

  /**
   * Suggestions pour les formulaires de prospects
   */
  private async getProspectSuggestions(
    userId: string,
    fieldName: string,
    partialValue?: string,
  ): Promise<FormSuggestion[]> {
    try {
      let where: any = { userId };

      if (partialValue) {
        where[fieldName] = {
          contains: partialValue,
          mode: 'insensitive',
        };
      }

      const prospects = await this.prisma.prospects.findMany({
        where,
        select: {
          [fieldName]: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      // Compter les occurrences et créer les suggestions
      const valueMap = new Map<string, { count: number; lastUsed: Date }>();

      prospects.forEach((prospect) => {
        const value = prospect[fieldName];
        if (value && typeof value === 'string') {
          const existing = valueMap.get(value);
          if (existing) {
            existing.count++;
            if (prospect.createdAt > existing.lastUsed) {
              existing.lastUsed = prospect.createdAt;
            }
          } else {
            valueMap.set(value, {
              count: 1,
              lastUsed: prospect.createdAt,
            });
          }
        }
      });

      // Convertir en suggestions et trier par fréquence
      return Array.from(valueMap.entries())
        .map(([value, data]) => ({
          value,
          label: value,
          frequency: data.count,
          lastUsed: data.lastUsed,
        }))
        .sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      this.logger.error(`Error getting prospect suggestions: ${error.message}`);
      return [];
    }
  }

  /**
   * Suggestions pour les formulaires de propriétés
   */
  private async getPropertySuggestions(
    userId: string,
    fieldName: string,
    partialValue?: string,
  ): Promise<FormSuggestion[]> {
    try {
      let where: any = { userId };

      if (partialValue) {
        where[fieldName] = {
          contains: partialValue,
          mode: 'insensitive',
        };
      }

      const properties = await this.prisma.properties.findMany({
        where,
        select: {
          [fieldName]: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      const valueMap = new Map<string, { count: number; lastUsed: Date }>();

      properties.forEach((property) => {
        const value = property[fieldName];
        if (value && typeof value === 'string') {
          const existing = valueMap.get(value);
          if (existing) {
            existing.count++;
            if (property.createdAt > existing.lastUsed) {
              existing.lastUsed = property.createdAt;
            }
          } else {
            valueMap.set(value, {
              count: 1,
              lastUsed: property.createdAt,
            });
          }
        }
      });

      return Array.from(valueMap.entries())
        .map(([value, data]) => ({
          value,
          label: value,
          frequency: data.count,
          lastUsed: data.lastUsed,
        }))
        .sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      this.logger.error(`Error getting property suggestions: ${error.message}`);
      return [];
    }
  }

  /**
   * Suggestions pour les formulaires de rendez-vous
   */
  private async getAppointmentSuggestions(
    userId: string,
    fieldName: string,
    partialValue?: string,
  ): Promise<FormSuggestion[]> {
    try {
      // Pour les rendez-vous, on peut suggérer des lieux, types, etc.
      if (fieldName === 'location') {
        let where: any = { userId };

        if (partialValue) {
          where.location = {
            contains: partialValue,
            mode: 'insensitive',
          };
        }

        const appointments = await this.prisma.appointments.findMany({
          where,
          select: {
            location: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        });

        const valueMap = new Map<string, { count: number; lastUsed: Date }>();

        appointments.forEach((appointment) => {
          const value = appointment.location;
          if (value) {
            const existing = valueMap.get(value);
            if (existing) {
              existing.count++;
              if (appointment.createdAt > existing.lastUsed) {
                existing.lastUsed = appointment.createdAt;
              }
            } else {
              valueMap.set(value, {
                count: 1,
                lastUsed: appointment.createdAt,
              });
            }
          }
        });

        return Array.from(valueMap.entries())
          .map(([value, data]) => ({
            value,
            label: value,
            frequency: data.count,
            lastUsed: data.lastUsed,
          }))
          .sort((a, b) => b.frequency - a.frequency);
      }

      return [];
    } catch (error) {
      this.logger.error(`Error getting appointment suggestions: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtenir des suggestions complètes pour un prospect (auto-fill)
   */
  async getProspectAutoFill(
    userId: string,
    partialName: string,
  ): Promise<any> {
    try {
      const prospects = await this.prisma.prospects.findMany({
        where: {
          userId,
          OR: [
            { firstName: { contains: partialName, mode: 'insensitive' } },
            { lastName: { contains: partialName, mode: 'insensitive' } },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      });

      return prospects.map((prospect) => ({
        id: prospect.id,
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        phone: prospect.phone,
        email: prospect.email,
        city: prospect.city,
        budget: prospect.budget,
      }));
    } catch (error) {
      this.logger.error(`Error getting prospect auto-fill: ${error.message}`);
      return [];
    }
  }
}
