import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export enum NotificationType {
  APPOINTMENT = 'appointment',
  TASK = 'task',
  LEAD = 'lead',
  SYSTEM = 'system',
  PROPERTY = 'property',
  MESSAGE = 'message'
}

export class CreateNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  metadata?: string; // JSON string for additional data
}
