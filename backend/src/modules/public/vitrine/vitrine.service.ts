import { Injectable } from '@nestjs/common';
import { VitrineConfigService } from './services/vitrine-config.service';
import { VitrinePublicService } from './services/vitrine-public.service';
import { VitrineLeadService } from './services/vitrine-lead.service';
import { VitrineAgentService } from './services/vitrine-agent.service';
import { UpdateVitrineConfigDto, UpdatePublishedPropertyDto, SubmitLeadDto } from './dto';

/**
 * Façade qui maintient la compatibilité avec le contrôleur existant
 * tout en déléguant aux services spécialisés.
 */
@Injectable()
export class VitrineService {
  constructor(
    private configService: VitrineConfigService,
    private publicService: VitrinePublicService,
    private leadService: VitrineLeadService,
    private agentService: VitrineAgentService,
  ) {}

  // Config
  getConfig(userId: string) {
    return this.configService.getConfig(userId);
  }
  updateConfig(userId: string, dto: UpdateVitrineConfigDto) {
    return this.configService.updateConfig(userId, dto);
  }
  toggleVitrine(userId: string, isActive: boolean) {
    return this.configService.toggleVitrine(userId, isActive);
  }
  getPublishedProperties(userId: string) {
    return this.configService.getPublishedProperties(userId);
  }
  publishProperty(userId: string, propertyId: string, dto: UpdatePublishedPropertyDto) {
    return this.configService.publishProperty(userId, propertyId, dto);
  }
  unpublishProperty(userId: string, propertyId: string) {
    return this.configService.unpublishProperty(userId, propertyId);
  }
  getAnalytics(userId: string, period?: string) {
    return this.configService.getAnalytics(userId, period);
  }

  // Public
  getPublicVitrine(userId: string) {
    return this.publicService.getPublicVitrine(userId);
  }
  getPublicVitrineBySlug(slug: string) {
    return this.publicService.getPublicVitrineBySlug(slug);
  }
  getPublicPropertiesBySlug(slug: string, filters?: any) {
    return this.publicService.getPublicPropertiesBySlug(slug, filters);
  }
  getPublicPropertyDetail(slug: string, propertyRef: string) {
    return this.publicService.getPublicPropertyDetail(slug, propertyRef);
  }
  getPublicSitemap(slug: string) {
    return this.publicService.getPublicSitemap(slug);
  }

  // Leads
  submitPublicLead(slug: string, data: SubmitLeadDto, ipAddress?: string) {
    return this.leadService.submitPublicLead(slug, data, ipAddress);
  }
  getPublicLeads(userId: string) {
    return this.leadService.getPublicLeads(userId);
  }

  // Agents
  getPublicAgents(slug: string) {
    return this.agentService.getPublicAgents(slug);
  }
  getPublicAgent(slug: string, agentId: string) {
    return this.agentService.getPublicAgent(slug, agentId);
  }
  getAgentProfiles(userId: string) {
    return this.agentService.getAgentProfiles(userId);
  }
  upsertAgentProfile(userId: string, data: any) {
    return this.agentService.upsertAgentProfile(userId, data);
  }
  deleteAgentProfile(userId: string, agentId: string) {
    return this.agentService.deleteAgentProfile(userId, agentId);
  }
}
