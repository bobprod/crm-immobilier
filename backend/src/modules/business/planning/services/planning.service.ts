import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  CreateTaskBoardDto,
  UpdateTaskBoardDto,
  CreateTaskColumnDto,
  UpdateTaskColumnDto,
  CreatePlanningViewDto,
  UpdatePlanningViewDto,
  MoveTaskDto,
  UnifiedPlanningQueryDto,
  ViewType,
} from '../dto';

@Injectable()
export class PlanningService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== TaskBoard Operations ====================

  async createTaskBoard(userId: string, dto: CreateTaskBoardDto) {
    return this.prisma.taskBoard.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        color: dto.color || '#3B82F6',
        isDefault: dto.isDefault || false,
        layout: dto.layout || {},
        settings: dto.settings || {},
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async getTaskBoards(userId: string) {
    return this.prisma.taskBoard.findMany({
      where: { userId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                appointments: true,
                prospects: true,
                properties: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getTaskBoard(userId: string, boardId: string) {
    const board = await this.prisma.taskBoard.findFirst({
      where: { id: boardId, userId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                appointments: true,
                prospects: true,
                properties: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Task board not found');
    }

    return board;
  }

  async updateTaskBoard(userId: string, boardId: string, dto: UpdateTaskBoardDto) {
    const board = await this.prisma.taskBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new NotFoundException('Task board not found');
    }

    return this.prisma.taskBoard.update({
      where: { id: boardId },
      data: dto,
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async deleteTaskBoard(userId: string, boardId: string) {
    const board = await this.prisma.taskBoard.findFirst({
      where: { id: boardId, userId },
    });

    if (!board) {
      throw new NotFoundException('Task board not found');
    }

    return this.prisma.taskBoard.delete({
      where: { id: boardId },
    });
  }

  // ==================== TaskColumn Operations ====================

  async createTaskColumn(userId: string, dto: CreateTaskColumnDto) {
    // Verify board ownership
    const board = await this.prisma.taskBoard.findFirst({
      where: { id: dto.boardId, userId },
    });

    if (!board) {
      throw new NotFoundException('Task board not found');
    }

    // Get next position if not provided
    let position = dto.position;
    if (position === undefined) {
      const maxPosition = await this.prisma.taskColumn.findFirst({
        where: { boardId: dto.boardId },
        orderBy: { position: 'desc' },
      });
      position = maxPosition ? maxPosition.position + 1 : 0;
    }

    return this.prisma.taskColumn.create({
      data: {
        boardId: dto.boardId,
        name: dto.name,
        color: dto.color || '#6B7280',
        position,
        limit: dto.limit,
        settings: dto.settings || {},
      },
    });
  }

  async updateTaskColumn(userId: string, columnId: string, dto: UpdateTaskColumnDto) {
    // Verify column ownership through board
    const column = await this.prisma.taskColumn.findFirst({
      where: {
        id: columnId,
        board: { userId },
      },
    });

    if (!column) {
      throw new NotFoundException('Task column not found');
    }

    return this.prisma.taskColumn.update({
      where: { id: columnId },
      data: dto,
    });
  }

  async deleteTaskColumn(userId: string, columnId: string) {
    const column = await this.prisma.taskColumn.findFirst({
      where: {
        id: columnId,
        board: { userId },
      },
    });

    if (!column) {
      throw new NotFoundException('Task column not found');
    }

    return this.prisma.taskColumn.delete({
      where: { id: columnId },
    });
  }

  // ==================== Task Movement ====================

  async moveTask(userId: string, dto: MoveTaskDto) {
    const task = await this.prisma.tasks.findFirst({
      where: { id: dto.taskId, userId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Verify board/column ownership if provided
    if (dto.boardId) {
      const board = await this.prisma.taskBoard.findFirst({
        where: { id: dto.boardId, userId },
      });
      if (!board) {
        throw new NotFoundException('Task board not found');
      }
    }

    if (dto.columnId) {
      const column = await this.prisma.taskColumn.findFirst({
        where: {
          id: dto.columnId,
          board: { userId },
        },
      });
      if (!column) {
        throw new NotFoundException('Task column not found');
      }
    }

    // Update task position
    return this.prisma.tasks.update({
      where: { id: dto.taskId },
      data: {
        boardId: dto.boardId,
        columnId: dto.columnId,
        position: dto.position,
      },
      include: {
        appointments: true,
        prospects: true,
        properties: true,
      },
    });
  }

  // ==================== PlanningView Operations ====================

  async createPlanningView(userId: string, dto: CreatePlanningViewDto) {
    // If setting as default, unset other defaults
    if (dto.defaultView) {
      await this.prisma.planningView.updateMany({
        where: { userId, defaultView: true },
        data: { defaultView: false },
      });
    }

    return this.prisma.planningView.create({
      data: {
        userId,
        viewType: dto.viewType,
        preferences: dto.preferences || {},
        defaultView: dto.defaultView || false,
        filterOptions: dto.filterOptions || {},
        layoutConfig: dto.layoutConfig || {},
      },
    });
  }

  async getPlanningViews(userId: string) {
    return this.prisma.planningView.findMany({
      where: { userId },
      orderBy: [
        { defaultView: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getPlanningView(userId: string, viewId: string) {
    const view = await this.prisma.planningView.findFirst({
      where: { id: viewId, userId },
    });

    if (!view) {
      throw new NotFoundException('Planning view not found');
    }

    return view;
  }

  async updatePlanningView(userId: string, viewId: string, dto: UpdatePlanningViewDto) {
    const view = await this.prisma.planningView.findFirst({
      where: { id: viewId, userId },
    });

    if (!view) {
      throw new NotFoundException('Planning view not found');
    }

    // If setting as default, unset other defaults
    if (dto.defaultView) {
      await this.prisma.planningView.updateMany({
        where: { userId, defaultView: true, id: { not: viewId } },
        data: { defaultView: false },
      });
    }

    return this.prisma.planningView.update({
      where: { id: viewId },
      data: dto,
    });
  }

  async deletePlanningView(userId: string, viewId: string) {
    const view = await this.prisma.planningView.findFirst({
      where: { id: viewId, userId },
    });

    if (!view) {
      throw new NotFoundException('Planning view not found');
    }

    return this.prisma.planningView.delete({
      where: { id: viewId },
    });
  }

  // ==================== Unified Planning Data ====================

  async getUnifiedPlanningData(userId: string, query: UnifiedPlanningQueryDto) {
    const { viewType, startDate, endDate, boardId, status, priority, search } = query;

    // Build filters
    const taskFilter: any = { userId };
    const appointmentFilter: any = { userId };

    if (status) {
      taskFilter.status = status;
      appointmentFilter.status = status;
    }

    if (priority) {
      taskFilter.priority = priority;
      appointmentFilter.priority = priority;
    }

    if (search) {
      taskFilter.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
      appointmentFilter.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (boardId) {
      taskFilter.boardId = boardId;
    }

    // Date range filters for appointments
    if (startDate || endDate) {
      appointmentFilter.AND = [];
      if (startDate) {
        appointmentFilter.AND.push({
          startTime: { gte: new Date(startDate) },
        });
      }
      if (endDate) {
        appointmentFilter.AND.push({
          endTime: { lte: new Date(endDate) },
        });
      }
    }

    // Fetch data based on view type
    const [tasks, appointments, boards, views] = await Promise.all([
      this.prisma.tasks.findMany({
        where: taskFilter,
        include: {
          appointments: true,
          prospects: true,
          properties: true,
          column: true,
          board: true,
        },
        orderBy: [
          { position: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.appointments.findMany({
        where: appointmentFilter,
        include: {
          prospects: true,
          properties: true,
          tasks: true,
        },
        orderBy: { startTime: 'asc' },
      }),
      viewType === ViewType.KANBAN ? this.getTaskBoards(userId) : Promise.resolve([]),
      this.getPlanningViews(userId),
    ]);

    return {
      tasks,
      appointments,
      boards,
      views,
      metadata: {
        viewType: viewType || ViewType.LIST,
        totalTasks: tasks.length,
        totalAppointments: appointments.length,
        filters: { status, priority, search, startDate, endDate },
      },
    };
  }

  // ==================== Initialize Default Board ====================

  async initializeDefaultBoard(userId: string) {
    // Check if user has any boards
    const existingBoards = await this.prisma.taskBoard.findMany({
      where: { userId },
    });

    if (existingBoards.length > 0) {
      return existingBoards;
    }

    // Create default board with standard columns
    const board = await this.createTaskBoard(userId, {
      name: 'Mon Tableau Principal',
      description: 'Tableau par défaut',
      isDefault: true,
      color: '#3B82F6',
    });

    // Create default columns
    const defaultColumns = [
      { name: 'À faire', color: '#EF4444', position: 0 },
      { name: 'En cours', color: '#F59E0B', position: 1 },
      { name: 'En révision', color: '#3B82F6', position: 2 },
      { name: 'Terminé', color: '#10B981', position: 3 },
    ];

    for (const col of defaultColumns) {
      await this.createTaskColumn(userId, {
        boardId: board.id,
        ...col,
      });
    }

    return this.getTaskBoard(userId, board.id);
  }
}
