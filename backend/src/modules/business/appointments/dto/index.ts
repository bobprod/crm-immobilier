import { IsString, IsOptional, IsDateString, IsBoolean, IsInt, Min, Max, IsEnum, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum AppointmentType {
  VISIT = 'visit',
  SIGNATURE = 'signature',
  EXPERTISE = 'expertise',
  ESTIMATION = 'estimation',
  MEETING = 'meeting',
  OTHER = 'other',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
  NO_SHOW = 'no_show',
}

export enum AppointmentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// DTO: Créer un rendez-vous
export class CreateAppointmentDto {
  @ApiProperty({ description: 'Titre du rendez-vous' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Date/heure de début (ISO 8601)', example: '2025-11-02T14:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Date/heure de fin (ISO 8601)', example: '2025-11-02T15:00:00Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Lieu du rendez-vous' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ enum: AppointmentType, default: AppointmentType.VISIT })
  @IsEnum(AppointmentType)
  @IsOptional()
  type?: AppointmentType;

  @ApiPropertyOptional({ enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: AppointmentPriority, default: AppointmentPriority.MEDIUM })
  @IsEnum(AppointmentPriority)
  @IsOptional()
  priority?: AppointmentPriority;

  @ApiPropertyOptional({ description: 'ID du prospect' })
  @IsString()
  @IsOptional()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'ID de la propriété' })
  @IsString()
  @IsOptional()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Toute la journée', default: false })
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiPropertyOptional({ description: 'Activer les rappels', default: true })
  @IsBoolean()
  @IsOptional()
  reminder?: boolean;

  @ApiPropertyOptional({ description: 'Temps de rappel en minutes avant', default: 60 })
  @IsInt()
  @Min(0)
  @IsOptional()
  reminderTime?: number;

  @ApiPropertyOptional({ description: 'Liste des participants (JSON)' })
  @IsArray()
  @IsOptional()
  attendees?: any[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Couleur (hex)', default: '#3B82F6' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Règles de récurrence (JSON)' })
  @IsObject()
  @IsOptional()
  recurrence?: any;
}

// DTO: Mettre à jour un rendez-vous
export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Titre du rendez-vous' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Date/heure de début' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Date/heure de fin' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Lieu' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ enum: AppointmentType })
  @IsEnum(AppointmentType)
  @IsOptional()
  type?: AppointmentType;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ enum: AppointmentPriority })
  @IsEnum(AppointmentPriority)
  @IsOptional()
  priority?: AppointmentPriority;

  @ApiPropertyOptional({ description: 'ID du prospect' })
  @IsString()
  @IsOptional()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'ID de la propriété' })
  @IsString()
  @IsOptional()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Couleur' })
  @IsString()
  @IsOptional()
  color?: string;
}

// DTO: Reprogrammer un rendez-vous
export class RescheduleAppointmentDto {
  @ApiProperty({ description: 'Nouvelle date/heure de début' })
  @IsDateString()
  newStartTime: string;

  @ApiProperty({ description: 'Nouvelle date/heure de fin' })
  @IsDateString()
  newEndTime: string;
}

// DTO: Marquer comme terminé
export class CompleteAppointmentDto {
  @ApiPropertyOptional({ description: 'Résultat du rendez-vous' })
  @IsString()
  @IsOptional()
  outcome?: string;

  @ApiPropertyOptional({ description: 'Note de satisfaction (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;
}

// DTO: Annuler un rendez-vous
export class CancelAppointmentDto {
  @ApiPropertyOptional({ description: 'Raison de l\'annulation' })
  @IsString()
  @IsOptional()
  reason?: string;
}
