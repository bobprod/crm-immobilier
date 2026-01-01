import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContactsService } from './contacts.service';
import {
  CreateContactDto,
  UpdateContactDto,
  ContactFiltersDto,
  ContactResponseDto,
  ContactsListResponseDto,
  ContactStatsDto,
  ImportResultDto,
  ExportResultDto,
} from './dto';

@ApiTags('WhatsApp Contacts')
@ApiBearerAuth()
@Controller('whatsapp/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // ═══════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 contacts per minute
  @ApiOperation({
    summary: 'Create a new WhatsApp contact',
    description:
      'Creates a new contact in your WhatsApp contact list. Phone number must be unique.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contact created successfully',
    type: ContactResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid phone number format',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Contact with this phone number already exists',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async createContact(
    @Req() req: any,
    @Body() dto: CreateContactDto,
  ): Promise<ContactResponseDto> {
    return this.contactsService.createContact(req.user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all contacts',
    description:
      'Retrieves all WhatsApp contacts with optional filtering, searching, and pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contacts retrieved successfully',
    type: ContactsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async getContacts(
    @Req() req: any,
    @Query() filters: ContactFiltersDto,
  ): Promise<ContactsListResponseDto> {
    return this.contactsService.getContacts(req.user.id, filters);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get contact by ID',
    description:
      'Retrieves a single WhatsApp contact by its unique identifier.',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact unique identifier',
    example: 'clxxx123456789',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact retrieved successfully',
    type: ContactResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact not found',
  })
  async getContact(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<ContactResponseDto> {
    return this.contactsService.getContact(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update contact',
    description: 'Updates an existing WhatsApp contact information.',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact updated successfully',
    type: ContactResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact not found',
  })
  async updateContact(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    return this.contactsService.updateContact(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete contact',
    description: 'Permanently deletes a WhatsApp contact.',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Contact deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact not found',
  })
  async deleteContact(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<void> {
    return this.contactsService.deleteContact(req.user.id, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL OPERATIONS
  // ═══════════════════════════════════════════════════════════════

  @Post(':id/toggle-block')
  @ApiOperation({
    summary: 'Block/unblock contact',
    description: 'Toggles the blocked status of a contact.',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact block status toggled successfully',
    type: ContactResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact not found',
  })
  async toggleBlockContact(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<ContactResponseDto> {
    return this.contactsService.toggleBlockContact(req.user.id, id);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get contact statistics',
    description:
      'Retrieves detailed statistics for a specific contact (messages, conversations, response time).',
  })
  @ApiParam({
    name: 'id',
    description: 'Contact unique identifier',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contact statistics retrieved successfully',
    type: ContactStatsDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contact not found',
  })
  async getContactStats(
    @Req() req: any,
    @Param('id') id: string,
  ): Promise<ContactStatsDto> {
    return this.contactsService.getContactStats(req.user.id, id);
  }

  // ═══════════════════════════════════════════════════════════════
  // IMPORT / EXPORT
  // ═══════════════════════════════════════════════════════════════

  @Post('import')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 imports per minute
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Import contacts from CSV',
    description:
      'Imports multiple contacts from a CSV file. CSV format: Phone Number,Name,Email,Tags,Groups,Notes',
  })
  @ApiBody({
    description: 'CSV file containing contacts to import',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contacts imported successfully',
    type: ImportResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid CSV file or format',
  })
  async importContacts(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResultDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.includes('csv') && !file.mimetype.includes('text')) {
      throw new BadRequestException('File must be a CSV file');
    }

    // Parse CSV
    const csvContent = file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new BadRequestException('CSV file is empty or invalid');
    }

    // Skip header line
    const dataLines = lines.slice(1);

    const contacts: CreateContactDto[] = dataLines.map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));

      return {
        phoneNumber: values[0],
        name: values[1] || undefined,
        email: values[2] || undefined,
        tags: values[3] ? values[3].split(';').filter((t) => t) : undefined,
        groups: values[4] ? values[4].split(';').filter((g) => g) : undefined,
        notes: values[5] || undefined,
      };
    });

    return this.contactsService.importContacts(req.user.id, contacts);
  }

  @Get('export/csv')
  @ApiOperation({
    summary: 'Export contacts to CSV',
    description:
      'Exports all contacts (or filtered contacts) to a CSV file. Returns base64 encoded CSV data.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contacts exported successfully',
    type: ExportResultDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'WhatsApp configuration not found',
  })
  async exportContacts(
    @Req() req: any,
    @Query() filters: ContactFiltersDto,
  ): Promise<ExportResultDto> {
    return this.contactsService.exportContacts(req.user.id, filters);
  }
}
