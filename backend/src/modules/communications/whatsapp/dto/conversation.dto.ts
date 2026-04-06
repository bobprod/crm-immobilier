import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ConversationStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export class GetConversationsDto {
  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;

  @ApiPropertyOptional({ description: 'Phone number filter' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Lead ID filter' })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Prospect ID filter' })
  @IsString()
  @IsOptional()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'Assigned to user ID' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Tag filter', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Limit results', default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination', default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}

export class UpdateConversationDto {
  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;

  @ApiPropertyOptional({ description: 'Assign to user ID' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Contact name' })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ description: 'Link to lead ID' })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Link to prospect ID' })
  @IsString()
  @IsOptional()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

export class ConversationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiPropertyOptional()
  contactName?: string;

  @ApiProperty({ enum: ConversationStatus })
  status: ConversationStatus;

  @ApiPropertyOptional()
  leadId?: string;

  @ApiPropertyOptional()
  prospectId?: string;

  @ApiPropertyOptional()
  assignedTo?: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  messageCount: number;

  @ApiProperty()
  unreadCount: number;

  @ApiProperty()
  lastMessageAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Populated relations (optional)
  @ApiPropertyOptional()
  lastMessage?: any;

  @ApiPropertyOptional()
  lead?: any;
}

export class AssignConversationDto {
  @ApiProperty({ description: 'User ID to assign to' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class AddTagsDto {
  @ApiProperty({ description: 'Tags to add', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  tags: string[];
}

export class RemoveTagsDto {
  @ApiProperty({ description: 'Tags to remove', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  tags: string[];
}
