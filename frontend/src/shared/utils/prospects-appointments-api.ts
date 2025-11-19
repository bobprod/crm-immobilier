import apiClient from './backend-api';

export const prospectsAppointmentsAPI = {
  // Créer RDV depuis prospect
  createAppointment: async (prospectId: string, data: any) => {
    const response = await apiClient.post(
      `/prospects-appointments/${prospectId}`,
      data
    );
    return response.data;
  },

  // Tous les RDV d'un prospect
  getProspectAppointments: async (prospectId: string) => {
    const response = await apiClient.get(
      `/prospects-appointments/${prospectId}`
    );
    return response.data;
  },

  // Prochain RDV
  getNextAppointment: async (prospectId: string) => {
    const response = await apiClient.get(
      `/prospects-appointments/${prospectId}/next`
    );
    return response.data;
  },

  // Prochaine action (RDV ou interaction)
  getNextAction: async (prospectId: string) => {
    const response = await apiClient.get(
      `/prospects-appointments/${prospectId}/next-action`
    );
    return response.data;
  },

  // Créer visite bien
  createPropertyVisit: async (
    prospectId: string,
    propertyId: string,
    data: any
  ) => {
    const response = await apiClient.post(
      `/prospects-appointments/${prospectId}/visit/${propertyId}`,
      data
    );
    return response.data;
  },

  // Compléter RDV
  completeAppointment: async (appointmentId: string, feedback: any) => {
    const response = await apiClient.put(
      `/prospects-appointments/appointment/${appointmentId}/complete`,
      feedback
    );
    return response.data;
  },

  // Calendrier prospect
  getProspectCalendar: async (prospectId: string) => {
    const response = await apiClient.get(
      `/prospects-appointments/${prospectId}/calendar`
    );
    return response.data;
  },

  // Stats RDV
  getAppointmentStats: async (prospectId: string) => {
    const response = await apiClient.get(
      `/prospects-appointments/${prospectId}/stats`
    );
    return response.data;
  },
};
