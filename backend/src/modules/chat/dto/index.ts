import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, ArrayMinSize } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({ description: 'Nom du groupe (optionnel pour les DM)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'IDs des participants', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;
}

export class SendMessageDto {
  @ApiProperty({ description: 'Contenu du message' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Type de message', default: 'text' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class MarkReadDto {
  @ApiProperty({ description: 'ID de la conversation' })
  @IsString()
  conversationId: string;
}
