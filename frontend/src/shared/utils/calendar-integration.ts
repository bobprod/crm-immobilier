// Calendar Integration Service
// Centralized service for creating and managing appointments across all modules

export interface AppointmentData {
  id?: string;
  title: string;
  type: 'viewing' | 'signing' | 'meeting' | 'call';
  date: string;
  time: string;
  duration: number;
  location: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyTitle?: string;
  propertyId?: string;
  mandatId?: string;
  prospectId?: string;
  campaignId?: string;
  notes: string;
  description?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  source?: 'prospects' | 'properties' | 'marketing' | 'prospecting';
}

class CalendarIntegrationService {
  private static STORAGE_KEY = 'crm-appointments';

  // Create a new appointment
  static createAppointment(data: AppointmentData): AppointmentData {
    const appointment: AppointmentData = {
      ...data,
      id: data.id || `apt-${Date.now()}`,
      status: data.status || 'scheduled',
    };

    const appointments = this.getAppointments();
    appointments.push(appointment);
    this.saveAppointments(appointments);

    return appointment;
  }

  // Get all appointments
  static getAppointments(): AppointmentData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading appointments:', error);
      return [];
    }
  }

  // Save appointments to localStorage
  private static saveAppointments(appointments: AppointmentData[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(appointments));

    // Trigger storage event for real-time sync
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: this.STORAGE_KEY,
        newValue: JSON.stringify(appointments),
        storageArea: localStorage,
      })
    );
  }

  // Update appointment status
  static updateAppointmentStatus(appointmentId: string, status: AppointmentData['status']): void {
    const appointments = this.getAppointments();
    const updated = appointments.map((apt) =>
      apt.id === appointmentId ? { ...apt, status } : apt
    );
    this.saveAppointments(updated);
  }

  // Delete appointment
  static deleteAppointment(appointmentId: string): void {
    const appointments = this.getAppointments();
    const filtered = appointments.filter((apt) => apt.id !== appointmentId);
    this.saveAppointments(filtered);
  }

  // Get appointments by source
  static getAppointmentsBySource(source: AppointmentData['source']): AppointmentData[] {
    return this.getAppointments().filter((apt) => apt.source === source);
  }

  // Get appointments by prospect
  static getAppointmentsByProspect(prospectId: string): AppointmentData[] {
    return this.getAppointments().filter((apt) => apt.prospectId === prospectId);
  }

  // Get appointments by property
  static getAppointmentsByProperty(propertyId: string): AppointmentData[] {
    return this.getAppointments().filter((apt) => apt.propertyId === propertyId);
  }

  // Get upcoming appointments
  static getUpcomingAppointments(days: number = 7): AppointmentData[] {
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.getAppointments().filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= now && aptDate <= future;
    });
  }

  // Quick create appointment from prospect
  static createProspectAppointment(
    prospectId: string,
    prospectName: string,
    prospectEmail: string,
    prospectPhone: string,
    date: string,
    time: string,
    notes: string
  ): AppointmentData {
    return this.createAppointment({
      title: `Rendez-vous - ${prospectName}`,
      type: 'meeting',
      date,
      time,
      duration: 60,
      location: 'À définir',
      clientName: prospectName,
      clientEmail: prospectEmail,
      clientPhone: prospectPhone,
      prospectId,
      notes,
      status: 'scheduled',
      source: 'prospects',
    });
  }

  // Quick create appointment from property viewing
  static createPropertyViewing(
    propertyId: string,
    propertyTitle: string,
    propertyLocation: string,
    mandatId: string,
    clientName: string,
    clientEmail: string,
    clientPhone: string,
    date: string,
    time: string,
    notes: string
  ): AppointmentData {
    return this.createAppointment({
      title: `Visite - ${propertyTitle}`,
      type: 'viewing',
      date,
      time,
      duration: 60,
      location: propertyLocation,
      clientName,
      clientEmail,
      clientPhone,
      propertyId,
      propertyTitle,
      mandatId,
      notes,
      status: 'scheduled',
      source: 'properties',
    });
  }

  // Quick create appointment from marketing campaign
  static createCampaignFollowUp(
    campaignId: string,
    campaignName: string,
    clientName: string,
    clientEmail: string,
    clientPhone: string,
    date: string,
    time: string,
    notes: string
  ): AppointmentData {
    return this.createAppointment({
      title: `Suivi Campagne - ${campaignName}`,
      type: 'call',
      date,
      time,
      duration: 30,
      location: 'Appel téléphonique',
      clientName,
      clientEmail,
      clientPhone,
      campaignId,
      notes,
      status: 'scheduled',
      source: 'marketing',
    });
  }
}

export default CalendarIntegrationService;
