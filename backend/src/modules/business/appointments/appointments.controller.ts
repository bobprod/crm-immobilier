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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  RescheduleAppointmentDto,
  CompleteAppointmentDto,
  CancelAppointmentDto,
} from './dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un rendez-vous' })
  async create(@Request() req, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les rendez-vous' })
  async findAll(@Request() req, @Query() filters: any) {
    return this.appointmentsService.findAll(req.user.userId, filters);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Rendez-vous à venir' })
  async getUpcoming(@Request() req, @Query('limit') limit?: number) {
    return this.appointmentsService.getUpcoming(req.user.userId, limit);
  }

  @Get('today')
  @ApiOperation({ summary: "Rendez-vous d'aujourd'hui" })
  async getToday(@Request() req) {
    return this.appointmentsService.getToday(req.user.userId);
  }

  @Get('availability')
  @ApiOperation({ summary: "Disponibilités d'un agent" })
  async getAvailability(
    @Request() req,
    @Query('date') date: string,
    @Query('duration') duration?: number,
  ) {
    return this.appointmentsService.getAvailability(req.user.userId, date, duration);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des rendez-vous' })
  async getStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.getStats(req.user.userId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rendez-vous par ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un rendez-vous' })
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rendez-vous' })
  async delete(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.delete(id, req.user.userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Marquer un rendez-vous comme terminé' })
  async complete(@Request() req, @Param('id') id: string, @Body() dto: CompleteAppointmentDto) {
    return this.appointmentsService.complete(id, req.user.userId, dto.outcome, dto.rating);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler un rendez-vous' })
  async cancel(@Request() req, @Param('id') id: string, @Body() dto: CancelAppointmentDto) {
    return this.appointmentsService.cancel(id, req.user.userId, dto.reason);
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Reprogrammer un rendez-vous' })
  async reschedule(@Request() req, @Param('id') id: string, @Body() dto: RescheduleAppointmentDto) {
    return this.appointmentsService.reschedule(
      id,
      req.user.userId,
      dto.newStartTime,
      dto.newEndTime,
    );
  }

  @Post(':id/conflicts')
  @ApiOperation({ summary: 'Vérifier les conflits' })
  async checkConflicts(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { startTime: string; endTime: string },
  ) {
    return this.appointmentsService.checkConflicts(
      req.user.userId,
      new Date(dto.startTime),
      new Date(dto.endTime),
      id,
    );
  }
}
