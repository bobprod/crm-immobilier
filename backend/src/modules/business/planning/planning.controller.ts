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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
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

@ApiTags('Planning')
@ApiBearerAuth()
@Controller('planning')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  // ==================== Unified Planning ====================

  @Get('unified')
  @ApiOperation({ summary: 'Get unified planning data with tasks, appointments, boards, and views' })
  @ApiResponse({ status: 200, description: 'Returns unified planning data' })
  async getUnifiedPlanningData(@Request() req, @Query() query: UnifiedPlanningQueryDto) {
    return this.planningService.getUnifiedPlanningData(req.user.id, query);
  }

  // ==================== TaskBoard Endpoints ====================

  @Post('boards')
  @ApiOperation({ summary: 'Create a new task board' })
  @ApiResponse({ status: 201, description: 'Board created successfully' })
  async createTaskBoard(@Request() req, @Body() dto: CreateTaskBoardDto) {
    return this.planningService.createTaskBoard(req.user.id, dto);
  }

  @Get('boards')
  @ApiOperation({ summary: 'Get all task boards for the current user' })
  @ApiResponse({ status: 200, description: 'Returns list of boards' })
  async getTaskBoards(@Request() req) {
    return this.planningService.getTaskBoards(req.user.id);
  }

  @Get('boards/initialize')
  @ApiOperation({ summary: 'Initialize default board with standard columns' })
  @ApiResponse({ status: 200, description: 'Returns initialized board' })
  async initializeDefaultBoard(@Request() req) {
    return this.planningService.initializeDefaultBoard(req.user.id);
  }

  @Get('boards/:boardId')
  @ApiOperation({ summary: 'Get a specific task board by ID' })
  @ApiResponse({ status: 200, description: 'Returns board details' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  async getTaskBoard(@Request() req, @Param('boardId') boardId: string) {
    return this.planningService.getTaskBoard(req.user.id, boardId);
  }

  @Put('boards/:boardId')
  @ApiOperation({ summary: 'Update a task board' })
  @ApiResponse({ status: 200, description: 'Board updated successfully' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  async updateTaskBoard(
    @Request() req,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateTaskBoardDto,
  ) {
    return this.planningService.updateTaskBoard(req.user.id, boardId, dto);
  }

  @Delete('boards/:boardId')
  @ApiOperation({ summary: 'Delete a task board' })
  @ApiResponse({ status: 200, description: 'Board deleted successfully' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  async deleteTaskBoard(@Request() req, @Param('boardId') boardId: string) {
    return this.planningService.deleteTaskBoard(req.user.id, boardId);
  }

  // ==================== TaskColumn Endpoints ====================

  @Post('columns')
  @ApiOperation({ summary: 'Create a new column in a board' })
  @ApiResponse({ status: 201, description: 'Column created successfully' })
  @ApiResponse({ status: 404, description: 'Board not found' })
  async createTaskColumn(@Request() req, @Body() dto: CreateTaskColumnDto) {
    return this.planningService.createTaskColumn(req.user.id, dto);
  }

  @Put('columns/:columnId')
  @ApiOperation({ summary: 'Update a column' })
  @ApiResponse({ status: 200, description: 'Column updated successfully' })
  @ApiResponse({ status: 404, description: 'Column not found' })
  async updateTaskColumn(
    @Request() req,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateTaskColumnDto,
  ) {
    return this.planningService.updateTaskColumn(req.user.id, columnId, dto);
  }

  @Delete('columns/:columnId')
  @ApiOperation({ summary: 'Delete a column' })
  @ApiResponse({ status: 200, description: 'Column deleted successfully' })
  @ApiResponse({ status: 404, description: 'Column not found' })
  async deleteTaskColumn(@Request() req, @Param('columnId') columnId: string) {
    return this.planningService.deleteTaskColumn(req.user.id, columnId);
  }

  // ==================== Task Movement ====================

  @Post('tasks/move')
  @ApiOperation({ summary: 'Move a task to a different column/position' })
  @ApiResponse({ status: 200, description: 'Task moved successfully' })
  @ApiResponse({ status: 404, description: 'Task, board, or column not found' })
  async moveTask(@Request() req, @Body() dto: MoveTaskDto) {
    return this.planningService.moveTask(req.user.id, dto);
  }

  // ==================== PlanningView Endpoints ====================

  @Post('views')
  @ApiOperation({ summary: 'Create a new planning view preference' })
  @ApiResponse({ status: 201, description: 'View created successfully' })
  async createPlanningView(@Request() req, @Body() dto: CreatePlanningViewDto) {
    return this.planningService.createPlanningView(req.user.id, dto);
  }

  @Get('views')
  @ApiOperation({ summary: 'Get all planning views for the current user' })
  @ApiResponse({ status: 200, description: 'Returns list of views' })
  async getPlanningViews(@Request() req) {
    return this.planningService.getPlanningViews(req.user.id);
  }

  @Get('views/:viewId')
  @ApiOperation({ summary: 'Get a specific planning view by ID' })
  @ApiResponse({ status: 200, description: 'Returns view details' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async getPlanningView(@Request() req, @Param('viewId') viewId: string) {
    return this.planningService.getPlanningView(req.user.id, viewId);
  }

  @Put('views/:viewId')
  @ApiOperation({ summary: 'Update a planning view' })
  @ApiResponse({ status: 200, description: 'View updated successfully' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async updatePlanningView(
    @Request() req,
    @Param('viewId') viewId: string,
    @Body() dto: UpdatePlanningViewDto,
  ) {
    return this.planningService.updatePlanningView(req.user.id, viewId, dto);
  }

  @Delete('views/:viewId')
  @ApiOperation({ summary: 'Delete a planning view' })
  @ApiResponse({ status: 200, description: 'View deleted successfully' })
  @ApiResponse({ status: 404, description: 'View not found' })
  async deletePlanningView(@Request() req, @Param('viewId') viewId: string) {
    return this.planningService.deletePlanningView(req.user.id, viewId);
  }
}
