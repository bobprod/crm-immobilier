import { Injectable, Logger } from '@nestjs/common';
import { ProspectionResult, ProspectionLead } from '../dto';

/**
 * Formats d'export supportés
 */
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'excel',
}

/**
 * Service d'export des résultats de prospection
 */
@Injectable()
export class ProspectionExportService {
  private readonly logger = new Logger(ProspectionExportService.name);

  /**
   * Exporter un résultat de prospection
   */
  async export(
    result: ProspectionResult,
    format: ExportFormat = ExportFormat.JSON,
  ): Promise<{ data: any; contentType: string; filename: string }> {
    this.logger.log(`Exporting prospection ${result.id} to ${format}`);

    switch (format) {
      case ExportFormat.JSON:
        return this.exportToJson(result);

      case ExportFormat.CSV:
        return this.exportToCsv(result);

      case ExportFormat.EXCEL:
        // TODO: Implémenter l'export Excel (nécessite une lib comme xlsx)
        this.logger.warn('Excel export not implemented yet, falling back to CSV');
        return this.exportToCsv(result);

      default:
        return this.exportToJson(result);
    }
  }

  /**
   * Export en JSON
   */
  private exportToJson(result: ProspectionResult) {
    const data = {
      prospectionId: result.id,
      status: result.status,
      summary: {
        totalLeads: result.stats.totalLeads,
        withEmail: result.stats.withEmail,
        withPhone: result.stats.withPhone,
        avgConfidence: result.stats.avgConfidence,
        executionTimeMs: result.metadata.executionTimeMs,
        cost: result.metadata.cost,
      },
      metadata: result.metadata,
      leads: result.leads,
      errors: result.errors,
      createdAt: result.createdAt,
      completedAt: result.completedAt,
    };

    return {
      data: JSON.stringify(data, null, 2),
      contentType: 'application/json',
      filename: `prospection-${result.id}.json`,
    };
  }

  /**
   * Export en CSV
   */
  private exportToCsv(result: ProspectionResult) {
    const headers = [
      'Nom',
      'Email',
      'Téléphone',
      'Entreprise',
      'Rôle',
      'Contexte',
      'Source',
      'Confiance',
    ];

    const rows = result.leads.map((lead) => [
      this.escapeCsv(lead.name),
      this.escapeCsv(lead.email || ''),
      this.escapeCsv(lead.phone || ''),
      this.escapeCsv(lead.company || ''),
      this.escapeCsv(lead.role || ''),
      this.escapeCsv(lead.context),
      this.escapeCsv(lead.source),
      lead.confidence?.toFixed(2) || '0.00',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return {
      data: csvContent,
      contentType: 'text/csv',
      filename: `prospection-${result.id}.csv`,
    };
  }

  /**
   * Échapper une valeur pour CSV
   */
  private escapeCsv(value: string): string {
    if (!value) return '';

    // Si la valeur contient une virgule, un retour à la ligne ou des guillemets, on l'entoure de guillemets
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Convertir les leads en format CRM (pour import dans Prospects)
   */
  convertToCrmFormat(leads: ProspectionLead[]): any[] {
    return leads.map((lead) => ({
      firstName: this.extractFirstName(lead.name),
      lastName: this.extractLastName(lead.name),
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      position: lead.role,
      notes: lead.context,
      source: 'prospection_ai',
      sourceUrl: lead.source,
      metadata: {
        confidence: lead.confidence,
        prospectionEngine: 'internal',
      },
    }));
  }

  /**
   * Extraire le prénom d'un nom complet
   */
  private extractFirstName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts[0] || fullName;
  }

  /**
   * Extraire le nom de famille d'un nom complet
   */
  private extractLastName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
    return '';
  }
}
