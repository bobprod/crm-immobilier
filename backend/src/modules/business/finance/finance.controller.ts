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
import { FinanceService } from './finance.service';
import {
  CreateCommissionDto,
  UpdateCommissionDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  CreatePaymentDto,
  UpdatePaymentDto,
} from './dto/finance.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ========== COMMISSIONS ==========

  @Post('commissions')
  @ApiOperation({ summary: 'Create a new commission' })
  createCommission(@Request() req, @Body() createDto: CreateCommissionDto) {
    return this.financeService.createCommission(req.user.sub, createDto);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Get all commissions' })
  findAllCommissions(
    @Request() req,
    @Query('status') status?: string,
    @Query('agentId') agentId?: string,
    @Query('transactionId') transactionId?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (agentId) filters.agentId = agentId;
    if (transactionId) filters.transactionId = transactionId;

    return this.financeService.findAllCommissions(req.user.sub, filters);
  }

  @Get('commissions/:id')
  @ApiOperation({ summary: 'Get commission by ID' })
  findOneCommission(@Param('id') id: string, @Request() req) {
    return this.financeService.findOneCommission(id, req.user.sub);
  }

  @Put('commissions/:id')
  @ApiOperation({ summary: 'Update commission' })
  updateCommission(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateCommissionDto,
  ) {
    return this.financeService.updateCommission(id, req.user.sub, updateDto);
  }

  @Delete('commissions/:id')
  @ApiOperation({ summary: 'Delete commission' })
  deleteCommission(@Param('id') id: string, @Request() req) {
    return this.financeService.deleteCommission(id, req.user.sub);
  }

  // ========== INVOICES ==========

  @Post('invoices')
  @ApiOperation({ summary: 'Create a new invoice' })
  createInvoice(@Request() req, @Body() createDto: CreateInvoiceDto) {
    return this.financeService.createInvoice(req.user.sub, createDto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Get all invoices' })
  findAllInvoices(
    @Request() req,
    @Query('status') status?: string,
    @Query('clientType') clientType?: string,
    @Query('transactionId') transactionId?: string,
    @Query('ownerId') ownerId?: string,
    @Query('overdue') overdue?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (clientType) filters.clientType = clientType;
    if (transactionId) filters.transactionId = transactionId;
    if (ownerId) filters.ownerId = ownerId;
    if (overdue) filters.overdue = overdue === 'true';

    return this.financeService.findAllInvoices(req.user.sub, filters);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOneInvoice(@Param('id') id: string, @Request() req) {
    return this.financeService.findOneInvoice(id, req.user.sub);
  }

  @Put('invoices/:id')
  @ApiOperation({ summary: 'Update invoice' })
  updateInvoice(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateInvoiceDto,
  ) {
    return this.financeService.updateInvoice(id, req.user.sub, updateDto);
  }

  @Delete('invoices/:id')
  @ApiOperation({ summary: 'Delete invoice' })
  deleteInvoice(@Param('id') id: string, @Request() req) {
    return this.financeService.deleteInvoice(id, req.user.sub);
  }

  // ========== PAYMENTS ==========

  @Post('payments')
  @ApiOperation({ summary: 'Create a new payment' })
  createPayment(@Request() req, @Body() createDto: CreatePaymentDto) {
    return this.financeService.createPayment(req.user.sub, createDto);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  findAllPayments(
    @Request() req,
    @Query('invoiceId') invoiceId?: string,
    @Query('commissionId') commissionId?: string,
    @Query('method') method?: string,
  ) {
    const filters: any = {};
    if (invoiceId) filters.invoiceId = invoiceId;
    if (commissionId) filters.commissionId = commissionId;
    if (method) filters.method = method;

    return this.financeService.findAllPayments(req.user.sub, filters);
  }

  @Get('payments/:id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOnePayment(@Param('id') id: string, @Request() req) {
    return this.financeService.findOnePayment(id, req.user.sub);
  }

  @Put('payments/:id')
  @ApiOperation({ summary: 'Update payment' })
  updatePayment(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdatePaymentDto,
  ) {
    return this.financeService.updatePayment(id, req.user.sub, updateDto);
  }

  @Delete('payments/:id')
  @ApiOperation({ summary: 'Delete payment' })
  deletePayment(@Param('id') id: string, @Request() req) {
    return this.financeService.deletePayment(id, req.user.sub);
  }

  // ========== STATS ==========

  @Get('stats')
  @ApiOperation({ summary: 'Get financial statistics' })
  getStats(@Request() req) {
    return this.financeService.getStats(req.user.sub);
  }
}
