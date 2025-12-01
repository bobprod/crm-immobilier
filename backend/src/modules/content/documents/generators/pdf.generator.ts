import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export class PDFGenerator {
  /**
   * Générer un PDF simple
   */
  static async generatePDF(data: any, options: any = {}): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // En-tête
        doc.fontSize(20).text(data.title || 'Document', { align: 'center' });
        doc.moveDown();

        // Date
        if (data.date) {
          doc.fontSize(10).text(`Date: ${data.date}`, { align: 'right' });
          doc.moveDown();
        }

        // Contenu
        if (data.content) {
          doc.fontSize(12).text(data.content, { align: 'justify' });
        }

        // Sections
        if (data.sections && Array.isArray(data.sections)) {
          data.sections.forEach((section: any) => {
            doc.moveDown();
            doc.fontSize(14).font('Helvetica-Bold').text(section.title);
            doc.moveDown(0.5);
            doc.fontSize(11).font('Helvetica').text(section.content);
          });
        }

        // Signature
        if (options.includeSignature) {
          doc.moveDown(2);
          doc.fontSize(10).text('Signature:', { continued: false });
          doc.moveDown();
          doc.text('_'.repeat(30));
        }

        // Pied de page
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(8)
            .text(`Page ${i + 1} / ${pages.count}`, 50, doc.page.height - 30, { align: 'center' });
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Générer un contrat de vente
   */
  static async generateContract(data: any): Promise<Buffer> {
    return this.generatePDF(
      {
        title: 'CONTRAT DE VENTE IMMOBILIÈRE',
        date: data.date || new Date().toLocaleDateString('fr-FR'),
        sections: [
          {
            title: 'ENTRE LES SOUSSIGNÉS',
            content: `Le vendeur : ${data.sellerName || 'N/A'}\nL'acheteur : ${data.buyerName || 'N/A'}`,
          },
          {
            title: 'OBJET DU CONTRAT',
            content: `Vente du bien situé : ${data.propertyAddress || 'N/A'}\nType : ${data.propertyType || 'N/A'}`,
          },
          {
            title: 'PRIX',
            content: `Prix de vente : ${data.price || 'N/A'} ${data.currency || 'TND'}\nModalités de paiement : ${data.paymentTerms || 'À convenir'}`,
          },
          {
            title: 'CONDITIONS GÉNÉRALES',
            content:
              data.terms ||
              "Les conditions générales s'appliquent conformément à la législation en vigueur.",
          },
        ],
      },
      { includeSignature: true },
    );
  }

  /**
   * Générer un mandat
   */
  static async generateMandate(data: any): Promise<Buffer> {
    return this.generatePDF(
      {
        title: 'MANDAT DE VENTE EXCLUSIF',
        date: data.date || new Date().toLocaleDateString('fr-FR'),
        sections: [
          {
            title: 'MANDANT',
            content: `Nom : ${data.ownerName || 'N/A'}\nAdresse : ${data.ownerAddress || 'N/A'}`,
          },
          {
            title: 'MANDATAIRE',
            content: `Agence : ${data.agencyName || 'N/A'}\nAdresse : ${data.agencyAddress || 'N/A'}`,
          },
          {
            title: 'BIEN CONCERNÉ',
            content: `Adresse : ${data.propertyAddress || 'N/A'}\nType : ${data.propertyType || 'N/A'}\nPrix demandé : ${data.price || 'N/A'} TND`,
          },
          {
            title: 'DURÉE DU MANDAT',
            content: `Début : ${data.startDate || 'N/A'}\nFin : ${data.endDate || 'N/A'}\nCommission : ${data.commission || 'N/A'}%`,
          },
        ],
      },
      { includeSignature: true },
    );
  }

  /**
   * Générer une estimation
   */
  static async generateEstimate(data: any): Promise<Buffer> {
    return this.generatePDF({
      title: 'ESTIMATION IMMOBILIÈRE',
      date: data.date || new Date().toLocaleDateString('fr-FR'),
      sections: [
        {
          title: 'BIEN ESTIMÉ',
          content: `Adresse : ${data.propertyAddress || 'N/A'}\nType : ${data.propertyType || 'N/A'}\nSurface : ${data.area || 'N/A'} m²`,
        },
        {
          title: 'ESTIMATION',
          content: `Prix estimé : ${data.estimatedPrice || 'N/A'} TND\nFourchette : ${data.minPrice || 'N/A'} - ${data.maxPrice || 'N/A'} TND`,
        },
        {
          title: 'MÉTHODOLOGIE',
          content:
            data.methodology ||
            "Estimation basée sur l'analyse du marché local et des biens comparables.",
        },
      ],
    });
  }
}
