'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  color?: string;
}

interface CalendarViewProps {
  appointments: Appointment[];
  tasks: any[];
  onDateClick: (date: Date) => void;
  onAppointmentClick: (appointment: Appointment) => void;
}

type ViewMode = 'day' | 'week' | 'month';

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  tasks,
  onDateClick,
  onAppointmentClick,
}) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<ViewMode>('week');

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      if (viewMode === 'day') setCurrentDate(subDays(newDate, 1));
      else if (viewMode === 'week') setCurrentDate(subWeeks(newDate, 1));
      else setCurrentDate(subMonths(newDate, 1));
    } else {
      if (viewMode === 'day') setCurrentDate(addDays(newDate, 1));
      else if (viewMode === 'week') setCurrentDate(addWeeks(newDate, 1));
      else setCurrentDate(addMonths(newDate, 1));
    }
  };

  const getDateRange = () => {
    if (viewMode === 'day') {
      return [currentDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      return eachDayOfInterval({ start, end });
    }
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return isSameDay(aptDate, date);
    });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  const dateRange = getDateRange();

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(currentDate);
    const dayTasks = getTasksForDate(currentDate);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-2">
          {dayAppointments.length === 0 && dayTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rendez-vous ou tâche pour cette date
            </div>
          ) : (
            <>
              {dayAppointments.map(apt => (
                <Card
                  key={apt.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onAppointmentClick(apt)}
                  style={{ borderLeft: `4px solid ${apt.color || '#3B82F6'}` }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{apt.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(apt.startTime), 'HH:mm', { locale: fr })} - {format(new Date(apt.endTime), 'HH:mm', { locale: fr })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {apt.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {dayTasks.map(task => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge className="text-xs mt-1">{task.priority}</Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Tâche
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-7 gap-2">
        {dateRange.map(date => {
          const dayAppointments = getAppointmentsForDate(date);
          const dayTasks = getTasksForDate(date);
          const isToday = isSameDay(date, new Date());

          return (
            <div
              key={date.toISOString()}
              className={`border rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors min-h-[120px] ${
                isToday ? 'bg-primary/5 border-primary' : ''
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className="text-center mb-2">
                <div className="text-xs text-muted-foreground">
                  {format(date, 'EEE', { locale: fr })}
                </div>
                <div className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>
                  {format(date, 'd')}
                </div>
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 2).map(apt => (
                  <div
                    key={apt.id}
                    className="text-xs p-1 rounded truncate"
                    style={{ backgroundColor: apt.color || '#3B82F6', color: 'white' }}
                  >
                    {format(new Date(apt.startTime), 'HH:mm')} {apt.title}
                  </div>
                ))}
                {dayTasks.slice(0, 1).map(task => (
                  <div key={task.id} className="text-xs p-1 bg-muted rounded truncate">
                    {task.title}
                  </div>
                ))}
                {dayAppointments.length + dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayAppointments.length + dayTasks.length - 3} plus
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    // Get first day of month and pad with previous month days
    const firstDay = startOfMonth(currentDate);
    const firstDayOfWeek = startOfWeek(firstDay, { weekStartsOn: 1 });
    
    let day = firstDayOfWeek;
    const lastDay = endOfMonth(currentDate);
    const lastDayOfWeek = endOfWeek(lastDay, { weekStartsOn: 1 });

    while (day <= lastDayOfWeek) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      day = addDays(day, 1);
    }

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map(date => {
              const dayAppointments = getAppointmentsForDate(date);
              const dayTasks = getTasksForDate(date);
              const isToday = isSameDay(date, new Date());
              const isCurrentMonth = isSameMonth(date, currentDate);

              return (
                <div
                  key={date.toISOString()}
                  className={`border rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors min-h-[80px] ${
                    isToday ? 'bg-primary/5 border-primary' : ''
                  } ${!isCurrentMonth ? 'opacity-40' : ''}`}
                  onClick={() => onDateClick(date)}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-primary' : ''}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="space-y-1">
                    {(dayAppointments.length > 0 || dayTasks.length > 0) && (
                      <div className="flex gap-1">
                        {dayAppointments.length > 0 && (
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        )}
                        {dayTasks.length > 0 && (
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
            Aujourd'hui
          </Button>
          <h2 className="text-lg font-semibold ml-4">
            {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : 'dd MMMM yyyy', { locale: fr })}
          </h2>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="day">Jour</TabsTrigger>
            <TabsTrigger value="week">Semaine</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
    </div>
  );
};
