import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service spécialisé pour la génération de documents immobiliers
 *
 * Templates inclus:
 * - Contrats de vente
 * - Contrats de commission
 * - Contrats de promotion
 * - Contrats de gestion
 * - Documents financiers
 */
@Injectable()
export class RealEstateDocumentGeneratorService {
  private readonly logger = new Logger(RealEstateDocumentGeneratorService.name);
  private readonly outputDir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Use configurable upload directory
    this.outputDir = this.configService.get<string>('UPLOAD_DIR') || './uploads/documents';

    // Ensure directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Générer un contrat de vente
   */
  async generateSalesContract(data: {
    propertyTitle: string;
    propertyAddress: string;
    sellerName: string;
    buyerName: string;
    price: number;
    currency?: string;
    date: Date;
    agencyName?: string;
    agencyCommission?: number;
    conditions?: string[];
  }): Promise<{ filePath: string; fileName: string }> {
    this.logger.log('Generating sales contract...');

    const fileName = `contrat_vente_${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      // Handle stream errors
      writeStream.on('error', (error) => {
        this.logger.error(`Error writing PDF file: ${error.message}`);
        throw new Error(`Failed to create PDF file: ${error.message}`);
      });

      doc.pipe(writeStream);

      // En-tête
      doc.fontSize(20).text('CONTRAT DE VENTE IMMOBILIÈRE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date: ${data.date.toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      // Parties
      doc.fontSize(14).text('ENTRE LES SOUSSIGNÉS:', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Le vendeur: ${data.sellerName}`, { indent: 20 });
      doc.text(`L'acquéreur: ${data.buyerName}`, { indent: 20 });
      doc.moveDown(2);

      // Objet du contrat
      doc.fontSize(14).text('ARTICLE 1 - OBJET DU CONTRAT', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(
        `Le présent contrat a pour objet la vente du bien immobilier suivant:`,
        { indent: 20 }
      );
      doc.text(`Titre: ${data.propertyTitle}`, { indent: 20 });
      doc.text(`Adresse: ${data.propertyAddress}`, { indent: 20 });
      doc.moveDown(2);

      // Prix
      doc.fontSize(14).text('ARTICLE 2 - PRIX', { underline: true });
      doc.moveDown();
      const currency = data.currency || 'EUR';
      doc.fontSize(12).text(
        `Le prix de vente est fixé à ${data.price.toLocaleString('fr-FR')} ${currency}`,
        { indent: 20 }
      );
      doc.moveDown(2);

      // Commission d'agence
      if (data.agencyName && data.agencyCommission) {
        doc.fontSize(14).text('ARTICLE 3 - COMMISSION D\'AGENCE', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(
          `L'agence ${data.agencyName} percevra une commission de ${data.agencyCommission}% du prix de vente.`,
          { indent: 20 }
        );
        doc.moveDown(2);
      }

      // Conditions particulières
      if (data.conditions && data.conditions.length > 0) {
        doc.fontSize(14).text('CONDITIONS PARTICULIÈRES', { underline: true });
        doc.moveDown();
        data.conditions.forEach((condition, index) => {
          doc.fontSize(12).text(`${index + 1}. ${condition}`, { indent: 20 });
        });
        doc.moveDown(2);
      }

      // Signatures
      doc.moveDown(3);
      doc.fontSize(12).text('Le vendeur', { continued: false, indent: 50 });
      doc.text('L\'acquéreur', { align: 'right', indent: 0 });
      doc.moveDown(3);
      doc.text('_____________________', { continued: false, indent: 50 });
      doc.text('_____________________', { align: 'right', indent: 0 });

      doc.end();

      // Wait for the PDF to be fully written
      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          this.logger.log(`Sales contract generated: ${fileName}`);
          resolve({ filePath, fileName });
        });
        writeStream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Error generating sales contract: ${error.message}`);
      // Clean up partial file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  /**
   * Générer un accord de commission
   */
  async generateCommissionAgreement(data: {
    agencyName: string;
    agentName: string;
    propertyTitle: string;
    commissionRate: number;
    commissionType: 'percentage' | 'fixed';
    fixedAmount?: number;
    currency?: string;
    validityPeriod: number; // en jours
    date: Date;
  }): Promise<{ filePath: string; fileName: string }> {
    this.logger.log('Generating commission agreement...');

    const fileName = `accord_commission_${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(filePath));

    // En-tête
    doc.fontSize(20).text('ACCORD DE COMMISSION', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${data.date.toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown(2);

    // Parties
    doc.fontSize(14).text('ENTRE:', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`L'agence: ${data.agencyName}`, { indent: 20 });
    doc.text(`Représentée par: ${data.agentName}`, { indent: 20 });
    doc.moveDown(2);

    // Objet
    doc.fontSize(14).text('ARTICLE 1 - OBJET', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(
      `Le présent accord définit les modalités de commission pour la vente du bien: ${data.propertyTitle}`,
      { indent: 20 }
    );
    doc.moveDown(2);

    // Commission
    doc.fontSize(14).text('ARTICLE 2 - MONTANT DE LA COMMISSION', { underline: true });
    doc.moveDown();
    const currency = data.currency || 'EUR';
    if (data.commissionType === 'percentage') {
      doc.fontSize(12).text(
        `La commission est fixée à ${data.commissionRate}% du prix de vente final.`,
        { indent: 20 }
      );
    } else {
      doc.fontSize(12).text(
        `La commission est fixée à un montant forfaitaire de ${data.fixedAmount} ${currency}.`,
        { indent: 20 }
      );
    }
    doc.moveDown(2);

    // Durée de validité
    doc.fontSize(14).text('ARTICLE 3 - DURÉE DE VALIDITÉ', { underline: true });
    doc.moveDown();
    const expirationDate = new Date(data.date);
    expirationDate.setDate(expirationDate.getDate() + data.validityPeriod);
    doc.fontSize(12).text(
      `Cet accord est valable pour une période de ${data.validityPeriod} jours, soit jusqu'au ${expirationDate.toLocaleDateString('fr-FR')}.`,
      { indent: 20 }
    );
    doc.moveDown(2);

    // Modalités de paiement
    doc.fontSize(14).text('ARTICLE 4 - MODALITÉS DE PAIEMENT', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(
      'La commission sera versée dans les 30 jours suivant la signature de l\'acte de vente définitif.',
      { indent: 20 }
    );
    doc.moveDown(3);

    // Signatures
    doc.fontSize(12).text('Pour l\'agence', { continued: false, indent: 50 });
    doc.text('Pour le client', { align: 'right', indent: 0 });
    doc.moveDown(3);
    doc.text('_____________________', { continued: false, indent: 50 });
    doc.text('_____________________', { align: 'right', indent: 0 });

    doc.end();

    return { filePath, fileName };
  }

  /**
   * Générer un contrat de gestion
   */
  async generatePropertyManagementContract(data: {
    agencyName: string;
    ownerName: string;
    propertyAddress: string;
    managementFee: number;
    feeType: 'percentage' | 'fixed';
    services: string[];
    duration: number; // en mois
    date: Date;
  }): Promise<{ filePath: string; fileName: string }> {
    this.logger.log('Generating property management contract...');

    const fileName = `contrat_gestion_${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(filePath));

    // En-tête
    doc.fontSize(20).text('CONTRAT DE GESTION IMMOBILIÈRE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${data.date.toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown(2);

    // Parties
    doc.fontSize(14).text('ENTRE LES SOUSSIGNÉS:', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`L'agence de gestion: ${data.agencyName}`, { indent: 20 });
    doc.text(`Le propriétaire: ${data.ownerName}`, { indent: 20 });
    doc.moveDown(2);

    // Bien concerné
    doc.fontSize(14).text('ARTICLE 1 - BIEN CONCERNÉ', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Adresse du bien: ${data.propertyAddress}`, { indent: 20 });
    doc.moveDown(2);

    // Services
    doc.fontSize(14).text('ARTICLE 2 - SERVICES INCLUS', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text('L\'agence s\'engage à fournir les services suivants:', { indent: 20 });
    data.services.forEach((service, index) => {
      doc.text(`${index + 1}. ${service}`, { indent: 40 });
    });
    doc.moveDown(2);

    // Honoraires
    doc.fontSize(14).text('ARTICLE 3 - HONORAIRES DE GESTION', { underline: true });
    doc.moveDown();
    if (data.feeType === 'percentage') {
      doc.fontSize(12).text(
        `Les honoraires de gestion sont fixés à ${data.managementFee}% des loyers perçus HT.`,
        { indent: 20 }
      );
    } else {
      doc.fontSize(12).text(
        `Les honoraires de gestion sont fixés à un montant forfaitaire mensuel de ${data.managementFee} EUR HT.`,
        { indent: 20 }
      );
    }
    doc.moveDown(2);

    // Durée
    doc.fontSize(14).text('ARTICLE 4 - DURÉE DU CONTRAT', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(
      `Le présent contrat est conclu pour une durée de ${data.duration} mois à compter de sa signature.`,
      { indent: 20 }
    );
    doc.text(
      'Il se renouvellera par tacite reconduction pour des périodes successives de 12 mois.',
      { indent: 20 }
    );
    doc.moveDown(3);

    // Signatures
    doc.fontSize(12).text('L\'agence', { continued: false, indent: 50 });
    doc.text('Le propriétaire', { align: 'right', indent: 0 });
    doc.moveDown(3);
    doc.text('_____________________', { continued: false, indent: 50 });
    doc.text('_____________________', { align: 'right', indent: 0 });

    doc.end();

    return { filePath, fileName };
  }

  /**
   * Générer un rapport d'analyse d'investissement
   */
  async generateInvestmentAnalysisReport(data: {
    projectTitle: string;
    location: string;
    totalPrice: number;
    targetYield: number;
    durationMonths: number;
    analysisScore: number;
    recommendation: string;
    strengths: string[];
    weaknesses: string[];
    financialProjections: {
      year: number;
      revenue: number;
      expenses: number;
      netProfit: number;
    }[];
    date: Date;
  }): Promise<{ filePath: string; fileName: string }> {
    this.logger.log('Generating investment analysis report...');

    const fileName = `analyse_investissement_${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(filePath));

    // En-tête
    doc.fontSize(20).text('RAPPORT D\'ANALYSE D\'INVESTISSEMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${data.date.toLocaleDateString('fr-FR')}`, { align: 'right' });
    doc.moveDown(2);

    // Informations du projet
    doc.fontSize(16).text('PROJET', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Titre: ${data.projectTitle}`, { indent: 20 });
    doc.text(`Localisation: ${data.location}`, { indent: 20 });
    doc.text(`Prix total: ${data.totalPrice.toLocaleString('fr-FR')} EUR`, { indent: 20 });
    doc.text(`Rendement cible: ${data.targetYield}%`, { indent: 20 });
    doc.text(`Durée: ${data.durationMonths} mois`, { indent: 20 });
    doc.moveDown(2);

    // Score d'analyse
    doc.fontSize(16).text('ÉVALUATION GLOBALE', { underline: true });
    doc.moveDown();
    doc.fontSize(14).fillColor('#2563eb').text(`Score: ${data.analysisScore}/100`, { indent: 20 });
    doc.fillColor('black');
    doc.fontSize(12).text(`Recommandation: ${data.recommendation}`, { indent: 20 });
    doc.moveDown(2);

    // Points forts
    doc.fontSize(16).text('POINTS FORTS', { underline: true });
    doc.moveDown();
    data.strengths.forEach((strength, index) => {
      doc.fontSize(12).fillColor('#16a34a').text(`✓ ${strength}`, { indent: 20 });
    });
    doc.fillColor('black');
    doc.moveDown(2);

    // Points faibles
    doc.fontSize(16).text('POINTS D\'ATTENTION', { underline: true });
    doc.moveDown();
    data.weaknesses.forEach((weakness, index) => {
      doc.fontSize(12).fillColor('#dc2626').text(`⚠ ${weakness}`, { indent: 20 });
    });
    doc.fillColor('black');
    doc.moveDown(2);

    // Projections financières
    if (data.financialProjections && data.financialProjections.length > 0) {
      doc.fontSize(16).text('PROJECTIONS FINANCIÈRES', { underline: true });
      doc.moveDown();

      data.financialProjections.forEach((projection) => {
        doc.fontSize(12).text(`Année ${projection.year}:`, { indent: 20 });
        doc.text(`  Revenus: ${projection.revenue.toLocaleString('fr-FR')} EUR`, { indent: 40 });
        doc.text(`  Dépenses: ${projection.expenses.toLocaleString('fr-FR')} EUR`, { indent: 40 });
        doc.text(`  Bénéfice net: ${projection.netProfit.toLocaleString('fr-FR')} EUR`, { indent: 40 });
        doc.moveDown();
      });
    }

    doc.end();

    return { filePath, fileName };
  }

  /**
   * Générer un contrat d'exclusivité
   */
  async generateExclusivityAgreement(data: {
    agencyName: string;
    clientName: string;
    clientAddress: string;
    propertyAddress: string;
    propertyType: string;
    exclusivityPeriod: number; // en jours
    price: number;
    currency?: string;
    commissionRate: number;
    date: Date;
  }): Promise<{ filePath: string; fileName: string }> {
    this.logger.log('Generating exclusivity agreement...');

    const fileName = `contrat_exclusivite_${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      writeStream.on('error', (error) => {
        this.logger.error(`Error writing PDF file: ${error.message}`);
        throw new Error(`Failed to create PDF file: ${error.message}`);
      });

      doc.pipe(writeStream);

      // En-tête
      doc.fontSize(20).text('MANDAT DE VENTE EXCLUSIF', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date: ${data.date.toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      // Parties
      doc.fontSize(14).text('ENTRE LES SOUSSIGNÉS:', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Le mandant (propriétaire):`, { indent: 20 });
      doc.text(`Nom: ${data.clientName}`, { indent: 40 });
      doc.text(`Adresse: ${data.clientAddress}`, { indent: 40 });
      doc.moveDown();
      doc.text(`L'agence mandataire:`, { indent: 20 });
      doc.text(`${data.agencyName}`, { indent: 40 });
      doc.moveDown(2);

      // Objet
      doc.fontSize(14).text('ARTICLE 1 - OBJET DU MANDAT', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(
        `Le mandant confie à l'agence, qui l'accepte, un mandat EXCLUSIF pour la vente du bien suivant:`,
        { indent: 20 }
      );
      doc.text(`Type: ${data.propertyType}`, { indent: 40 });
      doc.text(`Adresse: ${data.propertyAddress}`, { indent: 40 });
      doc.moveDown(2);

      // Prix
      const currency = data.currency || 'EUR';
      doc.fontSize(14).text('ARTICLE 2 - PRIX ET CONDITIONS', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(
        `Prix de vente fixé: ${data.price.toLocaleString('fr-FR')} ${currency}`,
        { indent: 20 }
      );
      doc.text(
        `Commission: ${data.commissionRate}% TTC à la charge du vendeur`,
        { indent: 20 }
      );
      doc.moveDown(2);

      // Exclusivité
      doc.fontSize(14).text('ARTICLE 3 - CLAUSE D\'EXCLUSIVITÉ', { underline: true });
      doc.moveDown();
      const expirationDate = new Date(data.date);
      expirationDate.setDate(expirationDate.getDate() + data.exclusivityPeriod);
      doc.fontSize(12).text(
        `Le présent mandat est consenti à titre EXCLUSIF pour une durée de ${data.exclusivityPeriod} jours, soit jusqu'au ${expirationDate.toLocaleDateString('fr-FR')}.`,
        { indent: 20 }
      );
      doc.text(
        `Pendant cette période, le mandant s'interdit de vendre le bien par lui-même ou de confier la vente à une autre agence.`,
        { indent: 20 }
      );
      doc.moveDown(2);

      // Obligations de l'agence
      doc.fontSize(14).text('ARTICLE 4 - OBLIGATIONS DE L\'AGENCE', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text('L\'agence s\'engage à:', { indent: 20 });
      doc.text('- Mettre en œuvre tous les moyens pour trouver un acquéreur', { indent: 40 });
      doc.text('- Diffuser des annonces sur les supports appropriés', { indent: 40 });
      doc.text('- Organiser les visites du bien', { indent: 40 });
      doc.text('- Informer régulièrement le mandant de l\'avancement', { indent: 40 });
      doc.moveDown(2);

      // Obligations du mandant
      doc.fontSize(14).text('ARTICLE 5 - OBLIGATIONS DU MANDANT', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text('Le mandant s\'engage à:', { indent: 20 });
      doc.text('- Fournir tous les documents nécessaires', { indent: 40 });
      doc.text('- Permettre l\'accès au bien pour les visites', { indent: 40 });
      doc.text('- Respecter l\'exclusivité pendant toute la durée du mandat', { indent: 40 });
      doc.moveDown(3);

      // Signatures
      doc.fontSize(12).text('Le mandant', { continued: false, indent: 50 });
      doc.text('Pour l\'agence', { align: 'right', indent: 0 });
      doc.moveDown(3);
      doc.text('_____________________', { continued: false, indent: 50 });
      doc.text('_____________________', { align: 'right', indent: 0 });

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          this.logger.log(`Exclusivity agreement generated: ${fileName}`);
          resolve({ filePath, fileName });
        });
        writeStream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Error generating exclusivity agreement: ${error.message}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  /**
   * Générer une fiche de visite de bien
   */
  async generatePropertyViewingForm(data: {
    propertyAddress: string;
    propertyType: string;
    propertyPrice: number;
    currency?: string;
    propertySize: number;
    rooms: number;
    visitDate: Date;
    visitorName: string;
    visitorContact: string;
    agentName: string;
    observations?: string[];
    interestLevel?: string;
    followUpDate?: Date;
  }): Promise<{ filePath: string; fileName: string }> {
    this.logger.log('Generating property viewing form...');

    const fileName = `fiche_visite_${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      writeStream.on('error', (error) => {
        this.logger.error(`Error writing PDF file: ${error.message}`);
        throw new Error(`Failed to create PDF file: ${error.message}`);
      });

      doc.pipe(writeStream);

      // En-tête
      doc.fontSize(20).text('FICHE DE VISITE DE BIEN', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date de visite: ${data.visitDate.toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      // Informations du bien
      doc.fontSize(16).text('INFORMATIONS DU BIEN', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Adresse: ${data.propertyAddress}`, { indent: 20 });
      doc.text(`Type de bien: ${data.propertyType}`, { indent: 20 });
      const currency = data.currency || 'EUR';
      doc.text(`Prix: ${data.propertyPrice.toLocaleString('fr-FR')} ${currency}`, { indent: 20 });
      doc.text(`Surface: ${data.propertySize} m²`, { indent: 20 });
      doc.text(`Nombre de pièces: ${data.rooms}`, { indent: 20 });
      doc.moveDown(2);

      // Informations du visiteur
      doc.fontSize(16).text('INFORMATIONS DU VISITEUR', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Nom: ${data.visitorName}`, { indent: 20 });
      doc.text(`Contact: ${data.visitorContact}`, { indent: 20 });
      doc.moveDown(2);

      // Agent accompagnateur
      doc.fontSize(16).text('AGENT ACCOMPAGNATEUR', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`${data.agentName}`, { indent: 20 });
      doc.moveDown(2);

      // Observations
      if (data.observations && data.observations.length > 0) {
        doc.fontSize(16).text('OBSERVATIONS ET COMMENTAIRES', { underline: true });
        doc.moveDown();
        data.observations.forEach((obs, index) => {
          doc.fontSize(12).text(`${index + 1}. ${obs}`, { indent: 20 });
        });
        doc.moveDown(2);
      }

      // Niveau d'intérêt
      if (data.interestLevel) {
        doc.fontSize(16).text('ÉVALUATION', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(`Niveau d'intérêt: ${data.interestLevel}`, { indent: 20 });
        doc.moveDown(2);
      }

      // Suivi
      if (data.followUpDate) {
        doc.fontSize(16).text('SUIVI', { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(
          `Date de relance prévue: ${data.followUpDate.toLocaleDateString('fr-FR')}`,
          { indent: 20 }
        );
        doc.moveDown(2);
      }

      // Espace pour notes manuscrites
      doc.moveDown(3);
      doc.fontSize(14).text('NOTES COMPLÉMENTAIRES', { underline: true });
      doc.moveDown();
      doc.rect(50, doc.y, 500, 100).stroke();

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          this.logger.log(`Property viewing form generated: ${fileName}`);
          resolve({ filePath, fileName });
        });
        writeStream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Error generating property viewing form: ${error.message}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  /**
   * Générer un contrat de location
   */
  async generateRentalContract(data: {
    landlordName: string;
    landlordAddress: string;
    tenantName: string;
    tenantAddress: string;
    propertyAddress: string;
    propertyType: string;
    propertySize: number;
    monthlyRent: number;
    charges: number;
    deposit: number;
    currency?: string;
    duration: number; // en mois
    startDate: Date;
    furnished: boolean;
  }): Promise<{ filePath: string; fileName: string }> {
    this.logger.log('Generating rental contract...');

    const fileName = `contrat_location_${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      writeStream.on('error', (error) => {
        this.logger.error(`Error writing PDF file: ${error.message}`);
        throw new Error(`Failed to create PDF file: ${error.message}`);
      });

      doc.pipe(writeStream);

      const currency = data.currency || 'EUR';

      // En-tête
      doc.fontSize(20).text('CONTRAT DE LOCATION', { align: 'center' });
      doc.fontSize(14).text(data.furnished ? '(Meublé)' : '(Vide)', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.moveDown(2);

      // Parties
      doc.fontSize(14).text('ENTRE LES SOUSSIGNÉS:', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text('Le bailleur:', { indent: 20 });
      doc.text(`Nom: ${data.landlordName}`, { indent: 40 });
      doc.text(`Adresse: ${data.landlordAddress}`, { indent: 40 });
      doc.moveDown();
      doc.text('Le locataire:', { indent: 20 });
      doc.text(`Nom: ${data.tenantName}`, { indent: 40 });
      doc.text(`Adresse: ${data.tenantAddress}`, { indent: 40 });
      doc.moveDown(2);

      // Désignation du bien
      doc.fontSize(14).text('ARTICLE 1 - DÉSIGNATION DU BIEN LOUÉ', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Le bailleur donne à bail au locataire qui l'accepte, le bien suivant:`, { indent: 20 });
      doc.text(`Adresse: ${data.propertyAddress}`, { indent: 40 });
      doc.text(`Type: ${data.propertyType}`, { indent: 40 });
      doc.text(`Surface habitable: ${data.propertySize} m²`, { indent: 40 });
      doc.moveDown(2);

      // Durée
      doc.fontSize(14).text('ARTICLE 2 - DURÉE DU BAIL', { underline: true });
      doc.moveDown();
      const endDate = new Date(data.startDate);
      endDate.setMonth(endDate.getMonth() + data.duration);
      doc.fontSize(12).text(
        `Le bail est consenti pour une durée de ${data.duration} mois, à compter du ${data.startDate.toLocaleDateString('fr-FR')}, soit jusqu'au ${endDate.toLocaleDateString('fr-FR')}.`,
        { indent: 20 }
      );
      doc.moveDown(2);

      // Loyer
      doc.fontSize(14).text('ARTICLE 3 - LOYER ET CHARGES', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Loyer mensuel: ${data.monthlyRent.toLocaleString('fr-FR')} ${currency}`, { indent: 20 });
      doc.text(`Charges mensuelles: ${data.charges.toLocaleString('fr-FR')} ${currency}`, { indent: 20 });
      doc.text(`Total mensuel: ${(data.monthlyRent + data.charges).toLocaleString('fr-FR')} ${currency}`, { indent: 20 });
      doc.moveDown();
      doc.text(`Le loyer est payable mensuellement à terme échu, le premier jour de chaque mois.`, { indent: 20 });
      doc.moveDown(2);

      // Dépôt de garantie
      doc.fontSize(14).text('ARTICLE 4 - DÉPÔT DE GARANTIE', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(
        `Le locataire verse un dépôt de garantie de ${data.deposit.toLocaleString('fr-FR')} ${currency}.`,
        { indent: 20 }
      );
      doc.text(
        'Ce dépôt sera restitué dans un délai de 2 mois après remise des clés, déduction faite des éventuelles réparations locatives.',
        { indent: 20 }
      );
      doc.moveDown(2);

      // Obligations du locataire
      doc.fontSize(14).text('ARTICLE 5 - OBLIGATIONS DU LOCATAIRE', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text('Le locataire s\'engage à:', { indent: 20 });
      doc.text('- Payer le loyer et les charges aux termes convenus', { indent: 40 });
      doc.text('- Entretenir le logement et effectuer les réparations locatives', { indent: 40 });
      doc.text('- Souscrire une assurance habitation', { indent: 40 });
      doc.text('- User paisiblement des locaux et respecter le voisinage', { indent: 40 });
      doc.moveDown(2);

      // Obligations du bailleur
      doc.fontSize(14).text('ARTICLE 6 - OBLIGATIONS DU BAILLEUR', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text('Le bailleur s\'engage à:', { indent: 20 });
      doc.text('- Délivrer un logement décent', { indent: 40 });
      doc.text('- Assurer la jouissance paisible du logement', { indent: 40 });
      doc.text('- Effectuer les réparations autres que locatives', { indent: 40 });
      doc.moveDown(3);

      // Signatures
      doc.fontSize(12).text('Le bailleur', { continued: false, indent: 50 });
      doc.text('Le locataire', { align: 'right', indent: 0 });
      doc.moveDown(3);
      doc.text('_____________________', { continued: false, indent: 50 });
      doc.text('_____________________', { align: 'right', indent: 0 });

      doc.end();

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          this.logger.log(`Rental contract generated: ${fileName}`);
          resolve({ filePath, fileName });
        });
        writeStream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Error generating rental contract: ${error.message}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }

  /**
   * Mapper les templates standards vers les générateurs spécialisés
   */
  async generateFromType(
    documentType: string,
    data: any,
  ): Promise<{ filePath: string; fileName: string }> {
    switch (documentType) {
      case 'sales_contract':
        return this.generateSalesContract(data);
      case 'commission_agreement':
        return this.generateCommissionAgreement(data);
      case 'property_management_contract':
        return this.generatePropertyManagementContract(data);
      case 'investment_analysis':
        return this.generateInvestmentAnalysisReport(data);
      case 'exclusivity_agreement':
        return this.generateExclusivityAgreement(data);
      case 'property_viewing_form':
        return this.generatePropertyViewingForm(data);
      case 'rental_contract':
      case 'lease_agreement':
        return this.generateRentalContract(data);
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
  }
}
