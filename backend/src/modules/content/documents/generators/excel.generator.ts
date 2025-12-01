import * as ExcelJS from 'exceljs';

export class ExcelGenerator {
  /**
   * Générer un fichier Excel simple
   */
  static async generateExcel(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(data.sheetName || 'Feuille1');

    // Titre
    if (data.title) {
      worksheet.mergeCells('A1:E1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = data.title;
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    }

    // En-têtes
    if (data.headers && Array.isArray(data.headers)) {
      const headerRow = worksheet.addRow(data.headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };
    }

    // Données
    if (data.rows && Array.isArray(data.rows)) {
      data.rows.forEach((row: any[]) => {
        worksheet.addRow(row);
      });
    }

    // Autosize columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  /**
   * Générer un rapport de prospects
   */
  static async generateProspectsReport(prospects: any[]): Promise<Buffer> {
    return this.generateExcel({
      title: 'RAPPORT PROSPECTS',
      sheetName: 'Prospects',
      headers: ['ID', 'Nom', 'Email', 'Téléphone', 'Type', 'Budget', 'Statut', 'Date création'],
      rows: prospects.map((p) => [
        p.id,
        `${p.firstName} ${p.lastName}`,
        p.email,
        p.phone,
        p.type,
        p.budget,
        p.status,
        new Date(p.createdAt).toLocaleDateString('fr-FR'),
      ]),
    });
  }

  /**
   * Générer un rapport de propriétés
   */
  static async generatePropertiesReport(properties: any[]): Promise<Buffer> {
    return this.generateExcel({
      title: 'RAPPORT PROPRIÉTÉS',
      sheetName: 'Propriétés',
      headers: ['ID', 'Titre', 'Type', 'Catégorie', 'Prix', 'Ville', 'Surface', 'Statut'],
      rows: properties.map((p) => [
        p.id,
        p.title,
        p.type,
        p.category,
        p.price,
        p.city,
        p.area,
        p.status,
      ]),
    });
  }
}
