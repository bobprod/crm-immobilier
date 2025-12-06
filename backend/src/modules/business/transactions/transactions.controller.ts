import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  CreateTransactionStepDto,
} from './dto/transaction.dto';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  create(@Request() req, @Body() createDto: CreateTransactionDto) {
    return this.transactionsService.create(req.user.sub, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all transactions' })
  findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('propertyId') propertyId?: string,
    @Query('prospectId') prospectId?: string,
    @Query('mandateId') mandateId?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (propertyId) filters.propertyId = propertyId;
    if (prospectId) filters.prospectId = prospectId;
    if (mandateId) filters.mandateId = mandateId;

    return this.transactionsService.findAll(req.user.sub, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics' })
  getStats(@Request() req) {
    return this.transactionsService.getStats(req.user.sub);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get transaction pipeline view' })
  getPipeline(@Request() req) {
    return this.transactionsService.getPipeline(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.transactionsService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update transaction' })
  update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, req.user.sub, updateDto);
  }

  @Post(':id/steps')
  @ApiOperation({ summary: 'Add a transaction step' })
  addStep(
    @Param('id') id: string,
    @Request() req,
    @Body() stepDto: CreateTransactionStepDto,
  ) {
    return this.transactionsService.addStep(id, req.user.sub, stepDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete transaction' })
  remove(@Param('id') id: string, @Request() req) {
    return this.transactionsService.remove(id, req.user.sub);
  }
}
