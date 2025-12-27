import React from 'react';
import { Task } from '../tasks.service';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { CheckCircle2, Clock, MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cn } from '@/shared/utils/utils';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onComplete: (id: string) => void;
}

export function TaskItem({ task, onEdit, onDelete, onComplete }: TaskItemProps) {
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800',
  };

  const statusLabels = {
    todo: 'À faire',
    in_progress: 'En cours',
    done: 'Terminé',
  };

  return (
    <Card
      className={cn('mb-3 transition-all hover:shadow-md', task.status === 'done' && 'opacity-75')}
    >
      <CardContent className="p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'mt-1 h-6 w-6 rounded-full',
              task.status === 'done' ? 'text-green-500' : 'text-gray-400'
            )}
            onClick={() => onComplete(task.id)}
          >
            <CheckCircle2 className="h-5 w-5" />
          </Button>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'font-medium',
                  task.status === 'done' && 'line-through text-gray-500'
                )}
              >
                {task.title}
              </h3>
              <Badge variant="secondary" className={cn('text-xs', priorityColors[task.priority])}>
                {task.priority}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', statusColors[task.status])}>
                {statusLabels[task.status]}
              </Badge>
            </div>

            {task.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
              {task.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Créé le {new Date(task.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Pencil className="mr-2 h-4 w-4" /> Modifier
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}
