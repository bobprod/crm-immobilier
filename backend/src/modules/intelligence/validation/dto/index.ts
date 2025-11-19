import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour valider un email
 */
export class ValidateEmailDto {
  @ApiProperty({ example: 'contact@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;
}

/**
 * DTO pour valider plusieurs emails
 */
export class ValidateEmailsDto {
  @ApiProperty({ type: [String], example: ['email1@test.com', 'email2@test.com'] })
  @IsArray()
  @IsEmail({}, { each: true })
  emails: string[];
}

/**
 * DTO pour valider un téléphone
 */
export class ValidatePhoneDto {
  @ApiProperty({ example: '+21655123456' })
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;
}

/**
 * DTO pour ajouter à la blacklist
 */
export class AddToBlacklistDto {
  @ApiProperty({ enum: ['email', 'phone', 'domain'] })
  @IsEnum(['email', 'phone', 'domain'])
  type: string;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO pour ajouter à la whitelist
 */
export class AddToWhitelistDto {
  @ApiProperty({ enum: ['email', 'phone', 'domain'] })
  @IsEnum(['email', 'phone', 'domain'])
  type: string;

  @ApiProperty()
  @IsString()
  value: string;
}

/**
 * DTO pour validation AI email
 */
export class ValidateEmailAIDto {
  @ApiProperty({ example: 'contact@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  context?: string;
}

/**
 * DTO pour détection spam AI
 */
export class DetectSpamAIDto {
  @ApiProperty({ example: 'contact@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  message?: string;
}

/**
 * DTO pour enrichissement contact AI
 */
export class EnrichContactAIDto {
  @ApiProperty({ example: 'contact@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * DTO pour filtres historique
 */
export class ValidationHistoryFiltersDto {
  @ApiPropertyOptional({ enum: ['email', 'phone'] })
  @IsOptional()
  @IsEnum(['email', 'phone'])
  contactType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isValid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isSpam?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  limit?: string;
}
