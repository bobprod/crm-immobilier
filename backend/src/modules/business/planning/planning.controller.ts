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
import { JwtAuthGuard } from '../../../auth/jwt-auth.guard';
import { PlanningService } from './services/planning.service';
import {
  CreateTaskBoardDto,
  UpdateTaskBoardDto,
  CreateTaskColumnDto,
  UpdateTaskColumnDto,
  CreatePlanningViewDto,
  UpdatePlanningViewDto,
  MoveTaskDto,
  UnifiedPlanningQueryDto,
} from './dto';

@Controller('planning')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  // ==================== Unified Planning ====================

  @Get('unified')
  async getUnifiedPlanningData(@Request() req, @Query() query: UnifiedPlanningQueryDto) {
    return this.planningService.getUnifiedPlanningData(req.user.id, query);
  }

  // ==================== TaskBoard Endpoints ====================

  @Post('boards')
  async createTaskBoard(@Request() req, @Body() dto: CreateTaskBoardDto) {
    return this.planningService.createTaskBoard(req.user.id, dto);
  }

  @Get('boards')
  async getTaskBoards(@Request() req) {
    return this.planningService.getTaskBoards(req.user.id);
  }

  @Get('boards/initialize')
  async initializeDefaultBoard(@Request() req) {
    return this.planningService.initializeDefaultBoard(req.user.id);
  }

  @Get('boards/:boardId')
  async getTaskBoard(@Request() req, @Param('boardId') boardId: string) {
    return this.planningService.getTaskBoard(req.user.id, boardId);
  }

  @Put('boards/:boardId')
  async updateTaskBoard(
    @Request() req,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateTaskBoardDto,
  ) {
    return this.planningService.updateTaskBoard(req.user.id, boardId, dto);
  }

  @Delete('boards/:boardId')
  async deleteTaskBoard(@Request() req, @Param('boardId') boardId: string) {
    return this.planningService.deleteTaskBoard(req.user.id, boardId);
  }

  // ==================== TaskColumn Endpoints ====================

  @Post('columns')
  async createTaskColumn(@Request() req, @Body() dto: CreateTaskColumnDto) {
    return this.planningService.createTaskColumn(req.user.id, dto);
  }

  @Put('columns/:columnId')
  async updateTaskColumn(
    @Request() req,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateTaskColumnDto,
  ) {
    return this.planningService.updateTaskColumn(req.user.id, columnId, dto);
  }

  @Delete('columns/:columnId')
  async deleteTaskColumn(@Request() req, @Param('columnId') columnId: string) {
    return this.planningService.deleteTaskColumn(req.user.id, columnId);
  }

  // ==================== Task Movement ====================

  @Post('tasks/move')
  async moveTask(@Request() req, @Body() dto: MoveTaskDto) {
    return this.planningService.moveTask(req.user.id, dto);
  }

  // ==================== PlanningView Endpoints ====================

  @Post('views')
  async createPlanningView(@Request() req, @Body() dto: CreatePlanningViewDto) {
    return this.planningService.createPlanningView(req.user.id, dto);
  }

  @Get('views')
  async getPlanningViews(@Request() req) {
    return this.planningService.getPlanningViews(req.user.id);
  }

  @Get('views/:viewId')
  async getPlanningView(@Request() req, @Param('viewId') viewId: string) {
    return this.planningService.getPlanningView(req.user.id, viewId);
  }

  @Put('views/:viewId')
  async updatePlanningView(
    @Request() req,
    @Param('viewId') viewId: string,
    @Body() dto: UpdatePlanningViewDto,
  ) {
    return this.planningService.updatePlanningView(req.user.id, viewId, dto);
  }

  @Delete('views/:viewId')
  async deletePlanningView(@Request() req, @Param('viewId') viewId: string) {
    return this.planningService.deletePlanningView(req.user.id, viewId);
  }
}
