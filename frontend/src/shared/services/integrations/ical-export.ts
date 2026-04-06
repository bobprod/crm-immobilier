import { AppointmentData } from '@/shared/utils/calendar-integration';

export function generateICalEvent(appointment: AppointmentData): string {
  const uid = appointment.id || `apt-${Date.now()}@immosaas`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const startDate = new Date(`${appointment.date}T${appointment.time}`);
  const endDate = new Date(startDate.getTime() + appointment.duration * 60000);
  
  const formatICalDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escapeICalText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Immo Saas//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${escapeICalText(appointment.title)}`,
  ];

  if (appointment.location) {
    lines.push(`LOCATION:${escapeICalText(appointment.location)}`);
  }

  if (appointment.description || appointment.notes) {
    lines.push(`DESCRIPTION:${escapeICalText(appointment.description || appointment.notes || '')}`);
  }

  if (appointment.clientName) {
    lines.push(`ORGANIZER;CN=${escapeICalText(appointment.clientName)}:mailto:contact@immosaas.com`);
  }

  if (appointment.clientEmail) {
    lines.push(`ATTENDEE;CN=${escapeICalText(appointment.clientName || '')}:mailto:${appointment.clientEmail}`);
  }

  const statusMap: Record<string, string> = {
    scheduled: 'CONFIRMED',
    confirmed: 'CONFIRMED',
    completed: 'CONFIRMED',
    cancelled: 'CANCELLED',
  };
  lines.push(`STATUS:${statusMap[appointment.status] || 'CONFIRMED'}`);

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

export function downloadICalFile(appointment: AppointmentData, filename?: string): void {
  const icalContent = generateICalEvent(appointment);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `rendez-vous-${appointment.id || Date.now()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateMultipleICalEvents(appointments: AppointmentData[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Immo Saas//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const apt of appointments) {
    const uid = apt.id || `apt-${Date.now()}@immosaas`;
    const startDate = new Date(`${apt.date}T${apt.time}`);
    const endDate = new Date(startDate.getTime() + apt.duration * 60000);
    
    const formatICalDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeICalText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatICalDate(startDate)}`);
    lines.push(`DTEND:${formatICalDate(endDate)}`);
    lines.push(`SUMMARY:${escapeICalText(apt.title)}`);
    if (apt.location) lines.push(`LOCATION:${escapeICalText(apt.location)}`);
    if (apt.description || apt.notes) {
      lines.push(`DESCRIPTION:${escapeICalText(apt.description || apt.notes || '')}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadMultipleICal(appointments: AppointmentData[], filename: string = 'rendez-vous.ics'): void {
  const icalContent = generateMultipleICalEvents(appointments);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(appointment: AppointmentData): string {
  const startDate = new Date(`${appointment.date}T${appointment.time}`);
  const endDate = new Date(startDate.getTime() + appointment.duration * 60000);
  
  const formatGoogleDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: appointment.title,
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
  });

  if (appointment.location) {
    params.append('location', appointment.location);
  }

  const description = [appointment.description, appointment.notes]
    .filter(Boolean)
    .join('\n');
  if (description) {
    params.append('details', description);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}