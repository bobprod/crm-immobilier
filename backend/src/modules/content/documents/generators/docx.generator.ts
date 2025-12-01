import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export class DOCXGenerator {
  /**
   * Générer un document DOCX
   */
  static async generateDOCX(data: any, options: any = {}): Promise<Buffer> {
    const sections: any[] = [];

    // Titre
    sections.push(
      new Paragraph({
        text: data.title || 'Document',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
    );

    // Date
    if (data.date) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Date: ${data.date}`,
              size: 20,
            }),
          ],
          alignment: AlignmentType.RIGHT,
          spacing: { after: 200 },
        }),
      );
    }

    // Contenu
    if (data.content) {
      sections.push(
        new Paragraph({
          text: data.content,
          spacing: { after: 200 },
        }),
      );
    }

    // Sections
    if (data.sections && Array.isArray(data.sections)) {
      data.sections.forEach((section: any) => {
        sections.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
        );

        sections.push(
          new Paragraph({
            text: section.content,
            spacing: { after: 200 },
          }),
        );
      });
    }

    // Signature
    if (options.includeSignature) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Signature:',
              break: 2,
            }),
          ],
          spacing: { before: 400 },
        }),
      );

      sections.push(
        new Paragraph({
          text: '_'.repeat(30),
        }),
      );
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Générer un contrat DOCX
   */
  static async generateContract(data: any): Promise<Buffer> {
    return this.generateDOCX(
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
            content: `Prix de vente : ${data.price || 'N/A'} ${data.currency || 'TND'}`,
          },
        ],
      },
      { includeSignature: true },
    );
  }
}
