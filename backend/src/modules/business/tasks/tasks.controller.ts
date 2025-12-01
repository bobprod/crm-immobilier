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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une tâche' })
  @ApiBody({ type: CreateTaskDto })
  create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(req.user.userId, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des tâches' })
  findAll(@Request() req, @Query() filters: any) {
    return this.tasksService.findAll(req.user.userId, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des tâches' })
  getStats(@Request() req) {
    return this.tasksService.getStats(req.user.userId);
  }

  @Get('today')
  @ApiOperation({ summary: 'Tâches du jour' })
  getToday(@Request() req) {
    return this.tasksService.getToday(req.user.userId);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Tâches en retard' })
  getOverdue(@Request() req) {
    return this.tasksService.getOverdue(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une tâche" })
  findOne(@Request() req, @Param('id') id: string) {
    return this.tasksService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une tâche' })
  @ApiBody({ type: UpdateTaskDto })
  update(@Request() req, @Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, req.user.userId, updateTaskDto);
  }

  @Put(':id/complete')
  @ApiOperation({ summary: 'Marquer comme terminée' })
  complete(@Request() req, @Param('id') id: string) {
    return this.tasksService.complete(id, req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une tâche' })
  remove(@Request() req, @Param('id') id: string) {
    return this.tasksService.remove(id, req.user.userId);
  }
}
