import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum ViewType {
  CALENDAR = 'calendar',
  KANBAN = 'kanban',
  LIST = 'list',
  MINDMAP = 'mindmap',
}

export enum CalendarViewMode {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

// TaskBoard DTOs
export class CreateTaskBoardDto {
  @ApiProperty({ description: 'Board name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Board description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Board color', default: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Is default board', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Layout configuration' })
  @IsOptional()
  @IsObject()
  layout?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Board settings' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdateTaskBoardDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsObject()
  layout?: Record<string, any>;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

// TaskColumn DTOs
export class CreateTaskColumnDto {
  @IsString()
  boardId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

export class UpdateTaskColumnDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

// PlanningView DTOs
export class CreatePlanningViewDto {
  @IsEnum(ViewType)
  viewType: ViewType;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  defaultView?: boolean;

  @IsOptional()
  @IsObject()
  filterOptions?: Record<string, any>;

  @IsOptional()
  @IsObject()
  layoutConfig?: Record<string, any>;
}

export class UpdatePlanningViewDto {
  @IsOptional()
  @IsEnum(ViewType)
  viewType?: ViewType;

  @IsOptional()
  @IsObject()
  preferences?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  defaultView?: boolean;

  @IsOptional()
  @IsObject()
  filterOptions?: Record<string, any>;

  @IsOptional()
  @IsObject()
  layoutConfig?: Record<string, any>;
}

// Task Movement DTO
export class MoveTaskDto {
  @IsString()
  taskId: string;

  @IsOptional()
  @IsString()
  boardId?: string;

  @IsOptional()
  @IsString()
  columnId?: string;

  @IsInt()
  @Min(0)
  position: number;
}

// Unified View Query DTO
export class UnifiedPlanningQueryDto {
  @IsOptional()
  @IsEnum(ViewType)
  viewType?: ViewType;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  boardId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

// AI Suggestion Request DTO
export class AiSuggestionRequestDto {
  @IsString()
  context: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
