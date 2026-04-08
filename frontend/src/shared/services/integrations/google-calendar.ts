export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
  scopes: string[];
}

class GoogleCalendarService {
  private static config: GoogleCalendarConfig | null = null;
  private static accessToken: string | null = null;
  private static gapi: any = null;
  private static tokenClient: any = null;

  static initialize(config: GoogleCalendarConfig) {
    this.config = config;
  }

  static async loadGoogleApi(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).gapi) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('client', async () => {
          await (window as any).gapi.client.init({});
          this.gapi = (window as any).gapi;
          resolve(true);
        });
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  static async loadGisClient(): Promise<boolean> {
    return new Promise((resolve) => {
      if ((window as any).google?.accounts?.oauth2) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/o/oauth2/jsapi';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  static async authorize(): Promise<boolean> {
    if (!this.config) {
      console.error('Google Calendar not configured');
      return false;
    }

    await this.loadGoogleApi();
    await this.loadGisClient();

    return new Promise((resolve) => {
      const client = (window as any).google?.accounts?.oauth2;
      if (!client) {
        resolve(false);
        return;
      }

      this.tokenClient = client.initTokenClient({
        client_id: this.config.clientId,
        scope: this.config.scopes.join(' '),
        callback: (response: any) => {
          if (response.access_token) {
            this.accessToken = response.access_token;
            resolve(true);
          } else {
            resolve(false);
          }
        },
      });

      try {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (error) {
        console.error('Error requesting access token:', error);
        resolve(false);
      }
    });
  }

  static isAuthorized(): boolean {
    return !!this.accessToken;
  }

  static signOut() {
    if (this.accessToken) {
      (window as any).google?.accounts?.oauth2?.revoke(this.accessToken);
      this.accessToken = null;
    }
  }

  static async createEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
    if (!this.accessToken) {
      const authorized = await this.authorize();
      if (!authorized) return null;
    }

    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (response.ok) {
        return await response.json();
      }
      console.error('Error creating calendar event:', await response.text());
      return null;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  static async updateEvent(eventId: string, event: CalendarEvent): Promise<CalendarEvent | null> {
    if (!this.accessToken) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return null;
    }
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.accessToken) return false;

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  static async listEvents(
    timeMin: Date,
    timeMax: Date
  ): Promise<CalendarEvent[]> {
    if (!this.accessToken) return [];

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
          `timeMin=${timeMin.toISOString()}&` +
          `timeMax=${timeMax.toISOString()}&` +
          `singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.items || [];
      }
      return [];
    } catch (error) {
      console.error('Error listing calendar events:', error);
      return [];
    }
  }
}

export default GoogleCalendarService;

export function formatDateToIso(date: Date, timeZone: string = 'Europe/Paris'): string {
  const offset = timeZone === 'Europe/Paris' ? '+02:00' : '+01:00';
  return date.toISOString().replace('.000', '').replace('Z', offset);
}

export function createGoogleCalendarEvent(
  title: string,
  startDate: Date,
  endDate: Date,
  description?: string,
  location?: string
): CalendarEvent {
  return {
    summary: title,
    description,
    location,
    start: {
      dateTime: formatDateToIso(startDate),
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: formatDateToIso(endDate),
      timeZone: 'Europe/Paris',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  };
}