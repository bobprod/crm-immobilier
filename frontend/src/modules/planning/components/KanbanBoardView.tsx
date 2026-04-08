'use client';

import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Plus, MoreVertical, Calendar, User } from 'lucide-react';
import { TaskBoard, TaskColumn, Task } from '../services/planning-api';

interface KanbanBoardViewProps {
  board: TaskBoard;
  onMoveTask: (taskId: string, columnId: string, position: number) => Promise<void>;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-2">
      <div
        className="cursor-pointer hover:shadow-md transition-shadow rounded-lg border bg-card text-card-foreground shadow-sm"
        onClick={onClick}
      >
        <div className="p-3">
          <div className="space-y-2">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}
            <div className="flex items-center justify-between">
              <Badge className={`text-xs ${priorityColors[task.priority] || 'bg-gray-100'}`}>
                {task.priority}
              </Badge>
              {task.dueDate && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ColumnProps {
  column: TaskColumn;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: () => void;
}

const Column = ({ column, tasks, onTaskClick, onAddTask }: ColumnProps) => {
  const { setNodeRef } = useSortable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-80 bg-muted/50 rounded-lg p-4"
      style={{ borderTop: `4px solid ${column.color || '#6B7280'}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
            {column.limit && `/${column.limit}`}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>

      <Button variant="ghost" className="w-full mt-4 justify-start text-sm" onClick={onAddTask}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter une tâche
      </Button>
    </div>
  );
};

export const KanbanBoardView: React.FC<KanbanBoardViewProps> = ({
  board,
  onMoveTask,
  onTaskClick,
  onAddTask,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(
    board.columns?.flatMap((c) => c.tasks || []) || []
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns = useMemo(() => {
    return board.columns?.sort((a, b) => a.position - b.position) || [];
  }, [board.columns]);

  const getColumnTasks = (columnId: string) => {
    return localTasks.filter((task) => task.columnId === columnId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const activeColumnId = activeTask.columnId;
    const overColumnId =
      columns.find((c) => c.id === overId)?.id || localTasks.find((t) => t.id === overId)?.columnId;

    if (!overColumnId || activeColumnId === overColumnId) return;

    setLocalTasks((tasks) => {
      const activeTasks = tasks.filter((t) => t.columnId === activeColumnId);
      const overTasks = tasks.filter((t) => t.columnId === overColumnId);

      const activeIndex = activeTasks.findIndex((t) => t.id === activeId);
      const overIndex = overTasks.findIndex((t) => t.id === overId);

      const newIndex = overIndex >= 0 ? overIndex : overTasks.length;

      return tasks.map((task) => {
        if (task.id === activeId) {
          return { ...task, columnId: overColumnId, position: newIndex };
        }
        return task;
      });
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = localTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const overColumnId =
      columns.find((c) => c.id === overId)?.id || localTasks.find((t) => t.id === overId)?.columnId;

    if (!overColumnId) return;

    const columnTasks = localTasks.filter((t) => t.columnId === overColumnId);
    const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
    const newIndex = columnTasks.findIndex((t) => t.id === overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);

      setLocalTasks((tasks) => {
        return tasks.map((task) => {
          const newTask = reorderedTasks.find((t) => t.id === task.id);
          if (newTask) {
            return { ...task, position: reorderedTasks.indexOf(newTask) };
          }
          return task;
        });
      });
    }

    // Call API to persist the change
    try {
      await onMoveTask(activeId, overColumnId, newIndex >= 0 ? newIndex : columnTasks.length);
    } catch (error) {
      console.error('Error moving task:', error);
      // Revert on error
      setLocalTasks(board.columns?.flatMap((c) => c.tasks || []) || []);
    }
  };

  const activeTask = activeId ? localTasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        <SortableContext items={columns.map((c) => c.id)}>
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={getColumnTasks(column.id)}
              onTaskClick={onTaskClick}
              onAddTask={() => onAddTask(column.id)}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeTask ? (
          <Card className="w-80 opacity-90">
            <CardContent className="p-3">
              <h4 className="font-medium text-sm">{activeTask.title}</h4>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
