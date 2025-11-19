/**
 * WordPress REST API Integration
 * Supports RealHomes theme and Fluent CRM plugin
 */

interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

interface RealHomesProperty {
  id: number;
  title: string;
  content: string;
  status: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  address: string;
  city: string;
  delegation?: string;
  commune?: string;
  state: string;
  country: string;
  zipcode: string;
  latitude?: number;
  longitude?: number;
  property_type: string;
  property_status: string;
  featured: boolean;
  images: string[];
  agent_id?: number;
}

interface FluentCRMContact {
  id?: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  tags?: string[];
  lists?: string[];
  status?: string;
  custom_fields?: Record<string, any>;
}

class WordPressAPI {
  private config: WordPressConfig;
  private baseUrl: string;

  constructor(config: WordPressConfig) {
    this.config = config;
    this.baseUrl = `${config.siteUrl}/wp-json`;
  }

  private getAuthHeaders(): HeadersInit {
    const credentials = btoa(`${this.config.username}:${this.config.applicationPassword}`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * RealHomes Properties API
   */
  async getRealHomesProperties(params?: {
    per_page?: number;
    page?: number;
    status?: string;
    property_type?: string;
  }): Promise<RealHomesProperty[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const url = `${this.baseUrl}/wp/v2/property${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.statusText}`);
    }

    return response.json();
  }

  async createRealHomesProperty(property: Partial<RealHomesProperty>): Promise<RealHomesProperty> {
    const url = `${this.baseUrl}/wp/v2/property`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        title: property.title,
        content: property.content,
        status: property.status || 'publish',
        meta: {
          REAL_HOMES_property_price: property.price,
          REAL_HOMES_property_bedrooms: property.bedrooms,
          REAL_HOMES_property_bathrooms: property.bathrooms,
          REAL_HOMES_property_size: property.area,
          REAL_HOMES_property_address: property.address,
          REAL_HOMES_property_city: property.city,
          REAL_HOMES_property_state: property.state,
          REAL_HOMES_property_country: property.country,
          REAL_HOMES_property_zip: property.zipcode,
          REAL_HOMES_property_latitude: property.latitude,
          REAL_HOMES_property_longitude: property.longitude,
          REAL_HOMES_featured: property.featured ? '1' : '0',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create property: ${response.statusText}`);
    }

    return response.json();
  }

  async updateRealHomesProperty(id: number, property: Partial<RealHomesProperty>): Promise<RealHomesProperty> {
    const url = `${this.baseUrl}/wp/v2/property/${id}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        title: property.title,
        content: property.content,
        status: property.status,
        meta: {
          REAL_HOMES_property_price: property.price,
          REAL_HOMES_property_bedrooms: property.bedrooms,
          REAL_HOMES_property_bathrooms: property.bathrooms,
          REAL_HOMES_property_size: property.area,
          REAL_HOMES_property_address: property.address,
          REAL_HOMES_property_city: property.city,
          REAL_HOMES_property_state: property.state,
          REAL_HOMES_property_country: property.country,
          REAL_HOMES_property_zip: property.zipcode,
          REAL_HOMES_property_latitude: property.latitude,
          REAL_HOMES_property_longitude: property.longitude,
          REAL_HOMES_featured: property.featured ? '1' : '0',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update property: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteRealHomesProperty(id: number): Promise<void> {
    const url = `${this.baseUrl}/wp/v2/property/${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete property: ${response.statusText}`);
    }
  }

  /**
   * Fluent CRM API
   */
  async getFluentCRMContacts(params?: {
    per_page?: number;
    page?: number;
    search?: string;
    tags?: string[];
    lists?: string[];
  }): Promise<FluentCRMContact[]> {
    const queryParams = new URLSearchParams(params as any).toString();
    const url = `${this.baseUrl}/fluent-crm/v2/contacts${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contacts: ${response.statusText}`);
    }

    const data = await response.json();
    return data.contacts || [];
  }

  async createFluentCRMContact(contact: FluentCRMContact): Promise<FluentCRMContact> {
    const url = `${this.baseUrl}/fluent-crm/v2/contacts`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      throw new Error(`Failed to create contact: ${response.statusText}`);
    }

    return response.json();
  }

  async updateFluentCRMContact(id: number, contact: Partial<FluentCRMContact>): Promise<FluentCRMContact> {
    const url = `${this.baseUrl}/fluent-crm/v2/contacts/${id}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      throw new Error(`Failed to update contact: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteFluentCRMContact(id: number): Promise<void> {
    const url = `${this.baseUrl}/fluent-crm/v2/contacts/${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete contact: ${response.statusText}`);
    }
  }

  async addTagToContact(contactId: number, tagName: string): Promise<void> {
    const url = `${this.baseUrl}/fluent-crm/v2/contacts/${contactId}/tags`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tags: [tagName] }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add tag: ${response.statusText}`);
    }
  }

  async addContactToList(contactId: number, listId: number): Promise<void> {
    const url = `${this.baseUrl}/fluent-crm/v2/contacts/${contactId}/lists`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ lists: [listId] }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add contact to list: ${response.statusText}`);
    }
  }

  /**
   * Sync functions
   */
  async syncPropertyToWordPress(property: any): Promise<RealHomesProperty> {
    // Check if property already exists in WordPress
    const existingProperties = await this.getRealHomesProperties({
      per_page: 1,
    });

    const wpProperty: Partial<RealHomesProperty> = {
      title: property.title,
      content: property.description || '',
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      address: property.location,
      city: property.city || '',
      state: property.state || '',
      country: property.country || 'Tunisia',
      zipcode: property.zipcode || '',
      property_type: property.type,
      property_status: property.status,
      featured: property.featured || false,
      status: 'publish',
    };

    // Create or update
    if (property.wordpressId) {
      return this.updateRealHomesProperty(property.wordpressId, wpProperty);
    } else {
      return this.createRealHomesProperty(wpProperty);
    }
  }

  async syncContactToFluentCRM(contact: any): Promise<FluentCRMContact> {
    const fluentContact: FluentCRMContact = {
      email: contact.email,
      first_name: contact.firstName || contact.name?.split(' ')[0] || '',
      last_name: contact.lastName || contact.name?.split(' ').slice(1).join(' ') || '',
      phone: contact.phone,
      address_line_1: contact.address,
      city: contact.city,
      state: contact.state,
      country: contact.country || 'Tunisia',
      postal_code: contact.zipcode,
      status: contact.status === 'active' ? 'subscribed' : 'pending',
      tags: contact.tags || [],
      custom_fields: {
        budget: contact.budget,
        property_type: contact.propertyType,
        source: contact.source,
      },
    };

    // Create or update
    if (contact.fluentCrmId) {
      return this.updateFluentCRMContact(contact.fluentCrmId, fluentContact);
    } else {
      return this.createFluentCRMContact(fluentContact);
    }
  }
}

export default WordPressAPI;
export type { WordPressConfig, RealHomesProperty, FluentCRMContact };
