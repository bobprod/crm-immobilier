import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactStatsDto {
  @ApiProperty({ description: 'Total messages exchanged' })
  totalMessages: number;

  @ApiProperty({ description: 'Messages sent to contact' })
  sentMessages: number;

  @ApiProperty({ description: 'Messages received from contact' })
  receivedMessages: number;

  @ApiProperty({ description: 'Total conversations' })
  totalConversations: number;

  @ApiProperty({ description: 'Active conversations' })
  activeConversations: number;

  @ApiProperty({ description: 'Average response time in minutes' })
  avgResponseTime: number;

  @ApiPropertyOptional({ description: 'Last interaction timestamp' })
  lastInteraction?: Date;
}

export class ContactResponseDto {
  @ApiProperty({ description: 'Contact unique ID' })
  id: string;

  @ApiProperty({ description: 'WhatsApp config ID' })
  configId: string;

  @ApiProperty({ description: 'Phone number in E.164 format' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Contact name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  profilePicture?: string;

  @ApiProperty({ description: 'Array of tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Array of groups', type: [String] })
  groups: string[];

  @ApiPropertyOptional({ description: 'Notes about the contact' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Custom fields', type: 'object' })
  customFields?: Record<string, any>;

  @ApiProperty({ description: 'Is contact blocked' })
  isBlocked: boolean;

  @ApiProperty({ description: 'Contact statistics' })
  stats: ContactStatsDto;

  @ApiPropertyOptional({ description: 'Last message timestamp' })
  lastMessageAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class ContactsListResponseDto {
  @ApiProperty({ description: 'Array of contacts', type: [ContactResponseDto] })
  contacts: ContactResponseDto[];

  @ApiProperty({ description: 'Total count of contacts' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  pageSize: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class ImportResultDto {
  @ApiProperty({ description: 'Number of successfully imported contacts' })
  imported: number;

  @ApiProperty({ description: 'Number of failed imports' })
  failed: number;

  @ApiProperty({ description: 'Array of error messages', type: [String] })
  errors: string[];
}

export class ExportResultDto {
  @ApiProperty({ description: 'CSV file content as base64' })
  data: string;

  @ApiProperty({ description: 'Filename for download' })
  filename: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;
}
