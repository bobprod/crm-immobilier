import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class AnalyzeEmailDto {
  @ApiProperty({
    description: 'Email du sender',
    example: 'client@example.com',
  })
  @IsEmail()
  from: string;

  @ApiProperty({
    description: 'Sujet de l\'email',
    example: 'Intéressé par l\'appartement à La Marsa',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Corps de l\'email',
    example: 'Bonjour, je suis intéressé par votre appartement 3 pièces à La Marsa. Pouvez-vous me donner plus d\'informations ?',
  })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'ID du prospect si connu',
    required: false,
  })
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiProperty({
    description: 'ID de la propriété si mentionnée',
    required: false,
  })
  @IsOptional()
  @IsString()
  propertyId?: string;
}

export class GenerateDraftDto {
  @ApiProperty({
    description: 'ID de l\'analyse email',
  })
  @IsString()
  analysisId: string;

  @ApiProperty({
    description: 'Instructions supplémentaires pour la génération',
    required: false,
  })
  @IsOptional()
  @IsString()
  additionalInstructions?: string;
}

export class ApproveAndSendDto {
  @ApiProperty({
    description: 'ID du draft',
  })
  @IsString()
  draftId: string;

  @ApiProperty({
    description: 'Corps de l\'email (peut être modifié)',
  })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Sujet de l\'email (peut être modifié)',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Pièces jointes',
    required: false,
  })
  @IsOptional()
  attachments?: Array<{ filename: string; path: string }>;
}
