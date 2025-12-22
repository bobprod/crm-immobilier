import { IsString, IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from './create-notification.dto';

export class UpdateNotificationDto {
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  actionUrl?: string;

  @IsString()
  @IsOptional()
  metadata?: string; // JSON string for additional data
}
