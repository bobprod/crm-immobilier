'use client';

import React from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Calendar, User, MoreVertical, CheckCircle } from 'lucide-react';
import { Task } from '../services/planning-api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
}) => {
  const priorityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    done: 'bg-green-100 text-green-800',
  };

  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, Task[]> = {
      overdue: [],
      today: [],
      upcoming: [],
      no_date: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    tasks.forEach((task) => {
      if (!task.dueDate) {
        groups.no_date.push(task);
      } else {
        const dueDate = new Date(task.dueDate);
        if (dueDate < today && task.status !== 'done') {
          groups.overdue.push(task);
        } else if (dueDate >= today && dueDate < tomorrow) {
          groups.today.push(task);
        } else {
          groups.upcoming.push(task);
        }
      }
    });

    return groups;
  }, [tasks]);

  const renderTaskGroup = (title: string, tasks: Task[], color: string) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color }}>
            {title}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="cursor-pointer hover:shadow-md transition-shadow rounded-lg border bg-card text-card-foreground shadow-sm"
              onClick={() => onTaskClick(task)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.status === 'done'}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (task.status !== 'done') {
                        onTaskComplete(task.id);
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4
                          className={`font-medium text-sm mb-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}
                        >
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskClick(task);
                            }}
                          >
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskComplete(task.id);
                            }}
                            disabled={task.status === 'done'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marquer comme terminé
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskDelete(task.id);
                            }}
                            className="text-red-600"
                          >
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        className={`text-xs ${priorityColors[task.priority] || 'bg-gray-100'}`}
                      >
                        {task.priority}
                      </Badge>
                      <Badge className={`text-xs ${statusColors[task.status] || 'bg-gray-100'}`}>
                        {task.status.replace('_', ' ')}
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
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderTaskGroup('En retard', groupedTasks.overdue, '#EF4444')}
      {renderTaskGroup("Aujourd'hui", groupedTasks.today, '#3B82F6')}
      {renderTaskGroup('À venir', groupedTasks.upcoming, '#10B981')}
      {renderTaskGroup('Sans date', groupedTasks.no_date, '#6B7280')}
    </div>
  );
};
