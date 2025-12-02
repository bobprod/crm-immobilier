import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { PrismaService } from '../../../shared/database/prisma.service';

@ApiTags('prospects-appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospects-appointments')
export class ProspectsAppointmentsController {
  constructor(
    private appointmentsService: AppointmentsService,
    private prisma: PrismaService,
  ) {}

  @Post(':prospectId')
  @ApiOperation({ summary: 'Create appointment for prospect' })
  async createAppointment(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() data: any,
  ) {
    return this.appointmentsService.create(req.user.userId, {
      ...data,
      prospectId,
    });
  }

  @Get(':prospectId')
  @ApiOperation({ summary: 'Get all appointments for a prospect' })
  async getProspectAppointments(
    @Request() req,
    @Param('prospectId') prospectId: string,
  ) {
    return this.appointmentsService.findAll(req.user.userId, { prospectId });
  }

  @Get(':prospectId/next')
  @ApiOperation({ summary: 'Get next appointment for prospect' })
  async getNextAppointment(
    @Request() req,
    @Param('prospectId') prospectId: string,
  ) {
    const appointments = await this.prisma.appointments.findFirst({
      where: {
        userId: req.user.userId,
        prospectId,
        startTime: { gte: new Date() },
        status: { in: ['scheduled', 'confirmed'] },
      },
      include: {
        prospects: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        properties: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments || null;
  }

  @Get(':prospectId/next-action')
  @ApiOperation({ summary: 'Get next action (appointment or interaction) for prospect' })
  async getNextAction(
    @Request() req,
    @Param('prospectId') prospectId: string,
  ) {
    // Get next appointment
    const nextAppointment = await this.prisma.appointments.findFirst({
      where: {
        userId: req.user.userId,
        prospectId,
        startTime: { gte: new Date() },
        status: { in: ['scheduled', 'confirmed'] },
      },
      orderBy: { startTime: 'asc' },
    });

    // Get last interaction and calculate next follow-up
    const prospect = await this.prisma.prospects.findFirst({
      where: {
        id: prospectId,
        userId: req.user.userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        lastContactDate: true,
        nextAction: true,
        nextActionDate: true,
      },
    });

    if (!prospect) {
      return null;
    }

    // Determine which action is next
    const appointmentDate = nextAppointment?.startTime;
    const actionDate = prospect.nextActionDate ? new Date(prospect.nextActionDate) : null;

    if (appointmentDate && actionDate) {
      if (appointmentDate < actionDate) {
        return {
          type: 'appointment',
          date: appointmentDate,
          title: nextAppointment?.title,
          details: nextAppointment,
        };
      } else {
        return {
          type: 'action',
          date: actionDate,
          title: prospect.nextAction,
          details: prospect,
        };
      }
    } else if (appointmentDate) {
      return {
        type: 'appointment',
        date: appointmentDate,
        title: nextAppointment?.title,
        details: nextAppointment,
      };
    } else if (actionDate) {
      return {
        type: 'action',
        date: actionDate,
        title: prospect.nextAction,
        details: prospect,
      };
    }

    return null;
  }

  @Post(':prospectId/visit/:propertyId')
  @ApiOperation({ summary: 'Create property visit appointment' })
  async createPropertyVisit(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Param('propertyId') propertyId: string,
    @Body() data: any,
  ) {
    return this.appointmentsService.create(req.user.userId, {
      ...data,
      prospectId,
      propertyId,
      type: 'visit',
    });
  }

  @Put('appointment/:appointmentId/complete')
  @ApiOperation({ summary: 'Complete an appointment with feedback' })
  async completeAppointment(
    @Request() req,
    @Param('appointmentId') appointmentId: string,
    @Body() feedback: any,
  ) {
    return this.appointmentsService.complete(
      appointmentId,
      req.user.userId,
      feedback.outcome,
      feedback.rating,
    );
  }

  @Get(':prospectId/calendar')
  @ApiOperation({ summary: 'Get prospect calendar view' })
  async getProspectCalendar(
    @Request() req,
    @Param('prospectId') prospectId: string,
  ) {
    const appointments = await this.prisma.appointments.findMany({
      where: {
        userId: req.user.userId,
        prospectId,
      },
      include: {
        properties: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Group by month for calendar view
    const calendar: Record<string, any[]> = {};

    appointments.forEach((apt) => {
      const monthKey = apt.startTime.toISOString().slice(0, 7); // YYYY-MM
      if (!calendar[monthKey]) {
        calendar[monthKey] = [];
      }
      calendar[monthKey].push(apt);
    });

    return calendar;
  }

  @Get(':prospectId/stats')
  @ApiOperation({ summary: 'Get appointment stats for prospect' })
  async getAppointmentStats(
    @Request() req,
    @Param('prospectId') prospectId: string,
  ) {
    const [total, completed, cancelled, noShow, upcoming] = await Promise.all([
      this.prisma.appointments.count({
        where: { userId: req.user.userId, prospectId },
      }),
      this.prisma.appointments.count({
        where: { userId: req.user.userId, prospectId, status: 'completed' },
      }),
      this.prisma.appointments.count({
        where: { userId: req.user.userId, prospectId, status: 'cancelled' },
      }),
      this.prisma.appointments.count({
        where: { userId: req.user.userId, prospectId, status: 'no_show' },
      }),
      this.prisma.appointments.count({
        where: {
          userId: req.user.userId,
          prospectId,
          startTime: { gte: new Date() },
          status: { in: ['scheduled', 'confirmed'] },
        },
      }),
    ]);

    // Average rating
    const ratings = await this.prisma.appointments.aggregate({
      where: {
        userId: req.user.userId,
        prospectId,
        rating: { not: null },
      },
      _avg: { rating: true },
    });

    // Attendance rate
    const attendanceRate = completed + noShow > 0
      ? Math.round((completed / (completed + noShow)) * 100)
      : 0;

    return {
      total,
      completed,
      cancelled,
      noShow,
      upcoming,
      averageRating: ratings._avg.rating || 0,
      attendanceRate,
    };
  }
}
