import { BaseAPIClient } from './base-api-client';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * Types
 * ────────────────────────────────────────────────────────────────────────────
 */

export type UserRole = 'USER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN';

export type ModuleStatus = 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';

export type ModuleCategory =
  | 'BUSINESS'
  | 'INTELLIGENCE'
  | 'INTEGRATION'
  | 'COMMUNICATION'
  | 'MARKETING';

export interface DynamicMenuItem {
  id: string;
  moduleId: string;
  label: string;
  icon?: string;
  path: string;
  requiredRole?: UserRole;
  order: number;
  children?: DynamicMenuItem[];
}

export interface ModuleAiAction {
  id: string;
  moduleId: string;
  actionCode: string;
  actionName: string;
  pricingId?: string;
  systemPrompt?: string;
  userPromptTpl?: string;
  provider?: string;
  model?: string;
}

export interface BusinessModule {
  id: string;
  code: string;
  name: string;
  description?: string;
  version: string;
  status: ModuleStatus;
  category: ModuleCategory;
  manifest: any; // JSON
  basePrice?: number;
  creditsIncluded?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleAgencySubscription {
  id: string;
  agencyId: string;
  moduleId: string;
  isActive: boolean;
  config?: any; // JSON
  activatedAt: string;
  deactivatedAt?: string;
}

export interface GetMenuResponse {
  items: DynamicMenuItem[];
}

export interface GetModulesResponse {
  modules: BusinessModule[];
}

export interface GetAiActionsResponse {
  actions: ModuleAiAction[];
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * Module Registry API Client
 * ────────────────────────────────────────────────────────────────────────────
 */

class ModuleRegistryAPIClient extends BaseAPIClient<any> {
  constructor() {
    super('/core/modules');
  }

  /**
   * Get dynamic menu for current user's agency and role
   * @returns Menu items filtered by active modules and user role
   */
  async getMyMenu(): Promise<DynamicMenuItem[]> {
    const response = await this.get('my-menu');
    return response.items || response || [];
  }

  /**
   * Get active modules for current user's agency
   * @returns List of active business modules
   */
  async getMyModules(): Promise<BusinessModule[]> {
    const response = await this.get('my-modules');
    return response.modules || response || [];
  }

  /**
   * Get available AI actions from active modules
   * @returns List of AI actions available to current user
   */
  async getMyAiActions(): Promise<ModuleAiAction[]> {
    const response = await this.get('my-ai-actions');
    return response.actions || response || [];
  }

  /**
   * Get module config for current agency (ADMIN only)
   * @param moduleCode Module code (e.g., "real-estate")
   * @returns Module configuration for current agency
   */
  async getAgencyModuleConfig(moduleCode: string): Promise<any> {
    return this.get(`agency-config/${moduleCode}`);
  }

  /**
   * Update module config for current agency (ADMIN only)
   * @param moduleCode Module code
   * @param config New configuration
   * @returns Updated configuration
   */
  async updateAgencyModuleConfig(moduleCode: string, config: any): Promise<any> {
    return this.put(`agency-config/${moduleCode}`, { config });
  }

  /**
   * Get all modules (SUPER_ADMIN only)
   * @param includeInactive Include inactive modules
   * @returns All business modules
   */
  async getAllModules(includeInactive = false): Promise<BusinessModule[]> {
    const response = await this.get('all', { includeInactive });
    return response.modules || response || [];
  }

  /**
   * Get module details by code (SUPER_ADMIN only)
   * @param code Module code
   * @returns Module details
   */
  async getModuleByCode(code: string): Promise<BusinessModule> {
    return this.get(`details/${code}`);
  }

  /**
   * Register a new business module (SUPER_ADMIN only)
   * @param manifest Module manifest (code, name, version, menus, aiActions, etc.)
   * @returns Created module
   */
  async registerModule(manifest: any): Promise<BusinessModule> {
    return this.post('register', manifest);
  }

  /**
   * Activate module for an agency (SUPER_ADMIN only)
   * @param agencyId Agency ID
   * @param moduleCode Module code
   * @param config Optional agency-specific config
   * @returns Subscription details
   */
  async activateModuleForAgency(
    agencyId: string,
    moduleCode: string,
    config?: any
  ): Promise<ModuleAgencySubscription> {
    return this.post(`activate/${agencyId}/${moduleCode}`, { config });
  }

  /**
   * Deactivate module for an agency (SUPER_ADMIN only)
   * @param agencyId Agency ID
   * @param moduleCode Module code
   */
  async deactivateModuleForAgency(agencyId: string, moduleCode: string): Promise<void> {
    await this.delete(`deactivate/${agencyId}/${moduleCode}`);
  }
}

// Export singleton instance
export const moduleRegistryApi = new ModuleRegistryAPIClient();
export default moduleRegistryApi;
