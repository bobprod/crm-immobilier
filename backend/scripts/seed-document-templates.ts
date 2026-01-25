/**
 * Script de seed pour créer les templates de documents immobiliers par défaut
 * 
 * Usage: npx ts-node scripts/seed-document-templates.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const REAL_ESTATE_TEMPLATES = [
  {
    name: 'Contrat de Vente Standard',
    description: 'Template standard pour un contrat de vente immobilière',
    realEstateDocType: 'sales_contract',
    category: 'contracts',
    requiresSignature: true,
    defaultValidity: 90,
    content: `
# CONTRAT DE VENTE IMMOBILIÈRE

## Date: {{contractDate}}

### ENTRE LES SOUSSIGNÉS:

**Le vendeur:**
- Nom: {{sellerName}}
- Adresse: {{sellerAddress}}
- Email: {{sellerEmail}}

**L'acquéreur:**
- Nom: {{buyerName}}
- Adresse: {{buyerAddress}}
- Email: {{buyerEmail}}

### ARTICLE 1 - OBJET DU CONTRAT

Le présent contrat a pour objet la vente du bien immobilier suivant:

- **Désignation:** {{propertyTitle}}
- **Adresse:** {{propertyAddress}}
- **Type de bien:** {{propertyType}}
- **Surface:** {{propertySurface}} m²
- **Nombre de pièces:** {{propertyRooms}}

### ARTICLE 2 - PRIX

Le prix de vente est fixé à **{{price}} {{currency}}**.

Ce prix s'entend net vendeur, hors frais d'acte et de mutation qui restent à la charge de l'acquéreur.

### ARTICLE 3 - CONDITIONS SUSPENSIVES

La vente est conclue sous les conditions suspensives suivantes:
{{#conditions}}
- {{.}}
{{/conditions}}

### ARTICLE 4 - PAIEMENT

Le prix sera payé de la manière suivante:
- Dépôt de garantie: {{deposit}} {{currency}} à la signature des présentes
- Solde: {{balance}} {{currency}} le jour de la signature de l'acte authentique

### ARTICLE 5 - FRAIS

Tous les frais, droits et honoraires de l'acte de vente seront à la charge de l'acquéreur.

{{#agencyCommission}}
### ARTICLE 6 - COMMISSION D'AGENCE

L'agence {{agencyName}} percevra une commission de {{agencyCommission}}% TTC du prix de vente.
{{/agencyCommission}}

**Fait en deux exemplaires originaux**

**Le Vendeur**                    **L'Acquéreur**

____________________              ____________________
`,
    variables: {
      contractDate: { type: 'date', required: true },
      sellerName: { type: 'string', required: true },
      sellerAddress: { type: 'string', required: true },
      sellerEmail: { type: 'email', required: true },
      buyerName: { type: 'string', required: true },
      buyerAddress: { type: 'string', required: true },
      buyerEmail: { type: 'email', required: true },
      propertyTitle: { type: 'string', required: true },
      propertyAddress: { type: 'string', required: true },
      propertyType: { type: 'string', required: true },
      propertySurface: { type: 'number', required: true },
      propertyRooms: { type: 'number', required: false },
      price: { type: 'number', required: true },
      currency: { type: 'string', default: 'EUR' },
      deposit: { type: 'number', required: true },
      balance: { type: 'number', required: true },
      conditions: { type: 'array', required: false },
      agencyName: { type: 'string', required: false },
      agencyCommission: { type: 'number', required: false },
    },
    mimeType: 'text/markdown',
  },
  {
    name: 'Accord de Commission',
    description: 'Template pour un accord de commission immobilière',
    realEstateDocType: 'commission_agreement',
    category: 'contracts',
    requiresSignature: true,
    defaultValidity: 365,
    content: `
# ACCORD DE COMMISSION

## Date: {{agreementDate}}

### ENTRE:

**L'agence immobilière:**
- Nom: {{agencyName}}
- Adresse: {{agencyAddress}}
- SIRET: {{agencySiret}}
- Représentée par: {{agentName}}

**ET**

**Le mandant:**
- Nom: {{clientName}}
- Adresse: {{clientAddress}}
- Email: {{clientEmail}}

### ARTICLE 1 - OBJET

Le présent accord définit les modalités de rémunération de l'agence pour ses services relatifs au bien suivant:

- **Bien:** {{propertyTitle}}
- **Adresse:** {{propertyAddress}}
- **Type de mandat:** {{mandateType}}

### ARTICLE 2 - MONTANT DE LA COMMISSION

{{#isPercentage}}
La commission est fixée à **{{commissionRate}}%** TTC du prix de vente final.
{{/isPercentage}}

{{^isPercentage}}
La commission est fixée à un montant forfaitaire de **{{fixedAmount}} {{currency}}** TTC.
{{/isPercentage}}

Cette commission inclut:
- La recherche d'acquéreurs
- L'organisation des visites
- La négociation du prix
- L'accompagnement jusqu'à la signature

### ARTICLE 3 - MODALITÉS DE PAIEMENT

La commission sera payable:
- À la signature de l'acte authentique de vente
- Dans un délai de {{paymentDelay}} jours suivant la signature

### ARTICLE 4 - DURÉE DE VALIDITÉ

Le présent accord est valable pour une durée de **{{validityPeriod}} jours** à compter de sa signature, soit jusqu'au {{expirationDate}}.

### ARTICLE 5 - CONDITIONS PARTICULIÈRES

{{#specialConditions}}
- {{.}}
{{/specialConditions}}

**Fait en deux exemplaires originaux**

**Pour l'agence**                    **Le mandant**

____________________                 ____________________
`,
    variables: {
      agreementDate: { type: 'date', required: true },
      agencyName: { type: 'string', required: true },
      agencyAddress: { type: 'string', required: true },
      agencySiret: { type: 'string', required: true },
      agentName: { type: 'string', required: true },
      clientName: { type: 'string', required: true },
      clientAddress: { type: 'string', required: true },
      clientEmail: { type: 'email', required: true },
      propertyTitle: { type: 'string', required: true },
      propertyAddress: { type: 'string', required: true },
      mandateType: { type: 'string', required: true },
      isPercentage: { type: 'boolean', default: true },
      commissionRate: { type: 'number', required: false },
      fixedAmount: { type: 'number', required: false },
      currency: { type: 'string', default: 'EUR' },
      paymentDelay: { type: 'number', default: 30 },
      validityPeriod: { type: 'number', required: true },
      expirationDate: { type: 'date', required: true },
      specialConditions: { type: 'array', required: false },
    },
    mimeType: 'text/markdown',
  },
  {
    name: 'Contrat de Gestion Locative',
    description: 'Template pour un contrat de gestion locative',
    realEstateDocType: 'rental_management_contract',
    category: 'contracts',
    requiresSignature: true,
    defaultValidity: 365,
    content: `
# CONTRAT DE GESTION LOCATIVE

## Date: {{contractDate}}

### ENTRE:

**L'agence de gestion:**
- Nom: {{agencyName}}
- Adresse: {{agencyAddress}}
- SIRET: {{agencySiret}}

**Le propriétaire bailleur:**
- Nom: {{ownerName}}
- Adresse: {{ownerAddress}}
- Email: {{ownerEmail}}

### ARTICLE 1 - BIEN CONCERNÉ

**Désignation du bien confié en gestion:**
- Adresse: {{propertyAddress}}
- Type: {{propertyType}}
- Surface: {{propertySurface}} m²
- Nombre de pièces: {{propertyRooms}}

### ARTICLE 2 - MISSION DE L'AGENCE

L'agence s'engage à assurer la gestion complète du bien, incluant:

{{#services}}
- {{.}}
{{/services}}

**Services standards inclus:**
- Recherche de locataires
- Rédaction du bail
- État des lieux entrée/sortie
- Encaissement des loyers
- Suivi des réparations
- Relations avec les locataires
- Déclarations fiscales

### ARTICLE 3 - HONORAIRES DE GESTION

{{#isPercentage}}
Les honoraires de gestion sont fixés à **{{managementFee}}%** TTC des loyers charges comprises.
{{/isPercentage}}

{{^isPercentage}}
Les honoraires de gestion sont fixés à **{{fixedFee}} {{currency}}** TTC par mois.
{{/isPercentage}}

**Honoraires complémentaires:**
- Mise en location: {{setupFee}} {{currency}} TTC
- Renouvellement bail: {{renewalFee}} {{currency}} TTC
- État des lieux: {{inventoryFee}} {{currency}} TTC

### ARTICLE 4 - VERSEMENT DES LOYERS

Les loyers perçus seront reversés au propriétaire:
- Périodicité: {{paymentFrequency}}
- Délai: Dans les {{paymentDelay}} jours suivant l'encaissement
- Modalité: {{paymentMethod}}

### ARTICLE 5 - DURÉE DU CONTRAT

Le présent contrat est conclu pour une durée de **{{duration}} mois** à compter du {{startDate}}.

Il se renouvellera par tacite reconduction pour des périodes successives de 12 mois, sauf résiliation par l'une des parties avec un préavis de {{noticePeriod}} mois.

### ARTICLE 6 - ASSURANCES

Le propriétaire s'engage à maintenir:
- Une assurance Propriétaire Non Occupant (PNO)
- Une assurance loyers impayés (optionnelle)

### ARTICLE 7 - OBLIGATIONS DU PROPRIÉTAIRE

Le propriétaire s'engage à:
- Fournir tous les documents nécessaires
- Informer l'agence de toute modification
- Maintenir le bien en bon état
- Régler les charges de copropriété

**Fait en deux exemplaires originaux**

**Pour l'agence**                    **Le propriétaire**

____________________                 ____________________
`,
    variables: {
      contractDate: { type: 'date', required: true },
      agencyName: { type: 'string', required: true },
      agencyAddress: { type: 'string', required: true },
      agencySiret: { type: 'string', required: true },
      ownerName: { type: 'string', required: true },
      ownerAddress: { type: 'string', required: true },
      ownerEmail: { type: 'email', required: true },
      propertyAddress: { type: 'string', required: true },
      propertyType: { type: 'string', required: true },
      propertySurface: { type: 'number', required: true },
      propertyRooms: { type: 'number', required: true },
      services: { type: 'array', required: true },
      isPercentage: { type: 'boolean', default: true },
      managementFee: { type: 'number', required: false },
      fixedFee: { type: 'number', required: false },
      currency: { type: 'string', default: 'EUR' },
      setupFee: { type: 'number', required: true },
      renewalFee: { type: 'number', required: true },
      inventoryFee: { type: 'number', required: true },
      paymentFrequency: { type: 'string', default: 'Mensuelle' },
      paymentDelay: { type: 'number', default: 5 },
      paymentMethod: { type: 'string', default: 'Virement bancaire' },
      duration: { type: 'number', required: true },
      startDate: { type: 'date', required: true },
      noticePeriod: { type: 'number', default: 3 },
    },
    mimeType: 'text/markdown',
  },
  {
    name: 'Rapport d\'Analyse d\'Investissement',
    description: 'Template pour un rapport d\'analyse d\'investissement immobilier',
    realEstateDocType: 'investment_analysis',
    category: 'financial',
    requiresSignature: false,
    content: `
# RAPPORT D'ANALYSE D'INVESTISSEMENT IMMOBILIER

**Date du rapport:** {{reportDate}}
**Réf:** {{referenceNumber}}

---

## 1. SYNTHÈSE DU PROJET

### Informations générales
- **Titre du projet:** {{projectTitle}}
- **Localisation:** {{city}}, {{country}}
- **Type de bien:** {{propertyType}}
- **Source:** {{source}}

### Données financières
- **Prix total:** {{totalPrice}} {{currency}}
- **Ticket minimum:** {{minTicket}} {{currency}}
- **Rendement cible:** {{targetYield}}%
- **Durée:** {{durationMonths}} mois
- **Avancement financement:** {{fundingProgress}}%

---

## 2. ÉVALUATION GLOBALE

**Score d'analyse:** {{analysisScore}}/100

**Recommandation:** {{recommendation}}

---

## 3. ANALYSE DÉTAILLÉE

### Points forts
{{#strengths}}
✓ {{.}}
{{/strengths}}

### Points d'attention
{{#weaknesses}}
⚠ {{.}}
{{/weaknesses}}

---

## 4. ANALYSE FINANCIÈRE

### Rentabilité prévisionnelle

{{#financialProjections}}
**Année {{year}}:**
- Revenus: {{revenue}} {{currency}}
- Dépenses: {{expenses}} {{currency}}
- Bénéfice net: {{netProfit}} {{currency}}
- ROI: {{roi}}%
{{/financialProjections}}

### Indicateurs clés
- **TRI (Taux de Rentabilité Interne):** {{irr}}%
- **VAN (Valeur Actuelle Nette):** {{npv}} {{currency}}
- **Durée de récupération:** {{paybackPeriod}} mois
- **Cash-flow annuel moyen:** {{avgCashFlow}} {{currency}}

---

## 5. ANALYSE DU MARCHÉ

### Marché local
- **Prix moyen m²:** {{avgPricePerSqm}} {{currency}}
- **Évolution des prix (5 ans):** {{priceEvolution}}%
- **Taux de vacance locative:** {{vacancyRate}}%
- **Loyer moyen:** {{avgRent}} {{currency}}/mois

### Tendances
{{#marketTrends}}
- {{.}}
{{/marketTrends}}

---

## 6. ANALYSE DES RISQUES

### Risques identifiés
{{#risks}}
**{{level}} - {{name}}**
{{description}}
**Mesures d'atténuation:** {{mitigation}}

{{/risks}}

---

## 7. ASPECTS JURIDIQUES ET FISCAUX

### Cadre juridique
- **Forme juridique:** {{legalStructure}}
- **Régulation:** {{regulation}}

### Fiscalité
- **Régime fiscal:** {{taxRegime}}
- **Taux d'imposition:** {{taxRate}}%
- **Avantages fiscaux:** {{taxBenefits}}

---

## 8. RECOMMANDATIONS

{{#recommendations}}
{{priority}}. {{text}}
{{/recommendations}}

---

## 9. CONCLUSION

{{conclusion}}

---

**Rapport généré par:** {{analystName}}
**Contact:** {{analystEmail}}
**Date:** {{reportDate}}

---

*Ce rapport est confidentiel et destiné uniquement à l'usage du destinataire. Les informations contenues dans ce document sont basées sur les données disponibles au moment de sa rédaction.*
`,
    variables: {
      reportDate: { type: 'date', required: true },
      referenceNumber: { type: 'string', required: true },
      projectTitle: { type: 'string', required: true },
      city: { type: 'string', required: true },
      country: { type: 'string', required: true },
      propertyType: { type: 'string', required: true },
      source: { type: 'string', required: true },
      totalPrice: { type: 'number', required: true },
      minTicket: { type: 'number', required: true },
      targetYield: { type: 'number', required: true },
      durationMonths: { type: 'number', required: true },
      fundingProgress: { type: 'number', required: false },
      currency: { type: 'string', default: 'EUR' },
      analysisScore: { type: 'number', required: true },
      recommendation: { type: 'string', required: true },
      strengths: { type: 'array', required: true },
      weaknesses: { type: 'array', required: true },
      financialProjections: { type: 'array', required: true },
      irr: { type: 'number', required: false },
      npv: { type: 'number', required: false },
      paybackPeriod: { type: 'number', required: false },
      avgCashFlow: { type: 'number', required: false },
      avgPricePerSqm: { type: 'number', required: false },
      priceEvolution: { type: 'number', required: false },
      vacancyRate: { type: 'number', required: false },
      avgRent: { type: 'number', required: false },
      marketTrends: { type: 'array', required: false },
      risks: { type: 'array', required: false },
      legalStructure: { type: 'string', required: false },
      regulation: { type: 'string', required: false },
      taxRegime: { type: 'string', required: false },
      taxRate: { type: 'number', required: false },
      taxBenefits: { type: 'string', required: false },
      recommendations: { type: 'array', required: true },
      conclusion: { type: 'string', required: true },
      analystName: { type: 'string', required: true },
      analystEmail: { type: 'email', required: true },
    },
    mimeType: 'text/markdown',
  },
];

async function seedDocumentTemplates() {
  console.log('🌱 Seeding document templates...');

  try {
    // Récupérer un utilisateur admin ou le premier utilisateur
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { contains: 'admin' } },
          { role: 'admin' },
        ],
      },
    });

    if (!user) {
      console.log('⚠️  No admin user found. Creating templates as public templates.');
    }

    const userId = user?.id || 'system';

    for (const template of REAL_ESTATE_TEMPLATES) {
      console.log(`Creating template: ${template.name}`);
      
      await prisma.document_templates.create({
        data: {
          userId,
          name: template.name,
          description: template.description,
          content: template.content,
          variables: template.variables,
          category: template.category,
          mimeType: template.mimeType,
          isActive: true,
          isPublic: true, // Templates disponibles pour tous
          realEstateDocType: template.realEstateDocType as any,
          defaultValidity: template.defaultValidity,
          requiresSignature: template.requiresSignature,
          templateMetadata: {
            createdBy: 'system',
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
          },
        },
      });

      console.log(`✅ Template created: ${template.name}`);
    }

    console.log(`\n✅ Successfully seeded ${REAL_ESTATE_TEMPLATES.length} document templates!`);
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedDocumentTemplates()
  .then(() => {
    console.log('\n🎉 Seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  });
