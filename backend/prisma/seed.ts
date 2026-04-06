import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * ═════════════════════════════════════════════════════════════════════
 * SEED : UTILISATEUR ADMINISTRATEUR
 * ═════════════════════════════════════════════════════════════════════
 */
async function seedAdminUser() {
  console.log('🔧 Création utilisateur administrateur...\n');

  // Hash du mot de passe
  const password = 'Admin123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.users.findUnique({
    where: { email: 'admin@crm.com' },
  });

  if (existingUser) {
    console.log("⚠️  L'utilisateur admin@crm.com existe déjà");
    console.log('📧 Email:', existingUser.email);
    console.log('👤 Nom:', existingUser.firstName, existingUser.lastName);
    console.log('🔑 Rôle:', existingUser.role, '\n');
    return existingUser;
  }

  // Créer l'utilisateur
  const user = await prisma.users.create({
    data: {
      email: 'admin@crm.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'CRM',
      role: 'ADMIN',
    },
  });

  console.log('✅ Utilisateur administrateur créé avec succès!');
  console.log('📧 Email:', user.email);
  console.log('🔒 Mot de passe:', password);
  console.log('👤 Nom:', user.firstName, user.lastName);
  console.log('🔑 Rôle:', user.role);
  console.log('🆔 ID:', user.id, '\n');

  return user;
}

/**
 * ═════════════════════════════════════════════════════════════════════
 * SEED : SUPER ADMIN GLOBAL SETTINGS
 * ═════════════════════════════════════════════════════════════════════
 *
 * IMPORTANT : Ces valeurs sont des PLACEHOLDERS.
 * Le Super Admin doit les configurer via l'interface après le déploiement.
 */
async function seedSuperAdminSettings() {
  console.log('🔧 Configuration des clés API Super Admin (placeholders)...\n');

  const settings = [
    {
      key: 'superadmin_anthropic_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API Anthropic (Claude) - Fallback Super Admin',
    },
    {
      key: 'superadmin_openai_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API OpenAI (GPT) - Fallback Super Admin',
    },
    {
      key: 'superadmin_gemini_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API Google Gemini - Fallback Super Admin',
    },
    {
      key: 'superadmin_deepseek_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API DeepSeek - Fallback Super Admin',
    },
    {
      key: 'superadmin_openrouter_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API OpenRouter - Fallback Super Admin',
    },
    {
      key: 'superadmin_serp_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API SERP (Google Search) - Fallback Super Admin',
    },
    {
      key: 'superadmin_firecrawl_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API Firecrawl - Fallback Super Admin',
    },
    {
      key: 'superadmin_pica_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API Pica - Fallback Super Admin',
    },
    {
      key: 'superadmin_jina_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API Jina Reader - Fallback Super Admin',
    },
    {
      key: 'superadmin_scrapingbee_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API ScrapingBee - Fallback Super Admin',
    },
    {
      key: 'superadmin_browserless_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API Browserless - Fallback Super Admin',
    },
    {
      key: 'superadmin_rapidapi_key',
      value: 'PLACEHOLDER_CONFIGURE_IN_ADMIN_PANEL',
      encrypted: true,
      description: 'Clé API RapidAPI - Fallback Super Admin',
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const setting of settings) {
    const existing = await prisma.globalSettings.findUnique({
      where: { key: setting.key },
    });

    if (!existing) {
      await prisma.globalSettings.create({ data: setting });
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`✅ Super Admin Settings: ${created} créés, ${skipped} existants\n`);
}

/**
 * ═════════════════════════════════════════════════════════════════════
 * SEED : AI PRICING
 * ═════════════════════════════════════════════════════════════════════
 *
 * Tarification des actions AI pour le système de crédits.
 * Ces valeurs peuvent être ajustées par le Super Admin.
 */
async function seedAiPricing() {
  console.log('🔧 Configuration du pricing AI...\n');

  const pricingData = [
    // ─────────────────────────────────────────────────────────
    // CATÉGORIE : Prospection AI
    // ─────────────────────────────────────────────────────────
    {
      actionCode: 'prospection_description_generation',
      actionName: 'Génération description bien immobilier',
      description: 'Génère une description optimisée pour un bien immobilier',
      creditsCost: 10,
      estimatedTokens: 1500,
      providerCostUsd: 0.002,
      category: 'prospection',
    },
    {
      actionCode: 'prospection_ai_search',
      actionName: 'Recherche AI avec SERP',
      description: 'Recherche de données immobilières via SERP API + LLM',
      creditsCost: 15,
      estimatedTokens: 2000,
      providerCostUsd: 0.005,
      category: 'prospection',
    },
    {
      actionCode: 'prospection_web_scraping',
      actionName: 'Web Scraping immobilier',
      description: 'Extraction de données depuis sites immobiliers',
      creditsCost: 20,
      estimatedTokens: 3000,
      providerCostUsd: 0.01,
      category: 'prospection',
    },
    {
      actionCode: 'prospection_analysis',
      actionName: 'Analyse marché immobilier',
      description: 'Analyse détaillée du marché pour une zone géographique',
      creditsCost: 25,
      estimatedTokens: 4000,
      providerCostUsd: 0.015,
      category: 'prospection',
    },

    // ─────────────────────────────────────────────────────────
    // CATÉGORIE : Smart Notifications
    // ─────────────────────────────────────────────────────────
    {
      actionCode: 'notification_ai_generation',
      actionName: 'Génération notification intelligente',
      description: 'Génère une notification personnalisée basée sur le contexte',
      creditsCost: 5,
      estimatedTokens: 800,
      providerCostUsd: 0.001,
      category: 'notifications',
    },
    {
      actionCode: 'notification_batch_generation',
      actionName: 'Génération batch de notifications',
      description: 'Génère plusieurs notifications en une fois',
      creditsCost: 20,
      estimatedTokens: 3000,
      providerCostUsd: 0.008,
      category: 'notifications',
    },

    // ─────────────────────────────────────────────────────────
    // CATÉGORIE : Génération de Documents
    // ─────────────────────────────────────────────────────────
    {
      actionCode: 'document_contract_generation',
      actionName: 'Génération contrat immobilier',
      description: 'Génère un contrat de vente ou location',
      creditsCost: 30,
      estimatedTokens: 5000,
      providerCostUsd: 0.02,
      category: 'documents',
    },
    {
      actionCode: 'document_mandate_generation',
      actionName: 'Génération mandat de vente',
      description: 'Génère un mandat de vente immobilier',
      creditsCost: 25,
      estimatedTokens: 4000,
      providerCostUsd: 0.015,
      category: 'documents',
    },

    // ─────────────────────────────────────────────────────────
    // CATÉGORIE : Analyse de Documents
    // ─────────────────────────────────────────────────────────
    {
      actionCode: 'document_analysis',
      actionName: 'Analyse document PDF/Image',
      description: "Analyse et extraction d'informations depuis un document",
      creditsCost: 15,
      estimatedTokens: 2000,
      providerCostUsd: 0.005,
      category: 'analysis',
    },
    {
      actionCode: 'document_ocr',
      actionName: 'OCR document immobilier',
      description: 'Reconnaissance optique de caractères sur documents',
      creditsCost: 10,
      estimatedTokens: 1500,
      providerCostUsd: 0.003,
      category: 'analysis',
    },

    // ─────────────────────────────────────────────────────────
    // CATÉGORIE : Assistant IA Conversationnel
    // ─────────────────────────────────────────────────────────
    {
      actionCode: 'assistant_chat_message',
      actionName: 'Message assistant IA',
      description: "Envoi d'un message à l'assistant conversationnel",
      creditsCost: 3,
      estimatedTokens: 500,
      providerCostUsd: 0.0005,
      category: 'assistant',
    },
    {
      actionCode: 'assistant_long_context',
      actionName: 'Message assistant IA (contexte long)',
      description: 'Message avec contexte étendu (>10k tokens)',
      creditsCost: 8,
      estimatedTokens: 15000,
      providerCostUsd: 0.005,
      category: 'assistant',
    },
  ];

  let created = 0;
  let updated = 0;

  for (const pricing of pricingData) {
    const existing = await prisma.aiPricing.findUnique({
      where: { actionCode: pricing.actionCode },
    });

    if (!existing) {
      await prisma.aiPricing.create({ data: pricing });
      created++;
    } else {
      // Mettre à jour si nécessaire (pour ajuster les prix)
      await prisma.aiPricing.update({
        where: { actionCode: pricing.actionCode },
        data: pricing,
      });
      updated++;
    }
  }

  console.log(`✅ AI Pricing: ${created} créés, ${updated} mis à jour\n`);
}

/**
 * ═════════════════════════════════════════════════════════════════════
 * MAIN SEED FUNCTION
 * ═════════════════════════════════════════════════════════════════════
 */
async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🌱 SEED DATABASE - CRM IMMOBILIER AI BILLING');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Créer l'utilisateur admin
  const adminUser = await seedAdminUser();

  // 2. Créer les settings Super Admin (clés API fallback)
  await seedSuperAdminSettings();

  // 3. Créer le pricing AI
  await seedAiPricing();

  // 4. Données de démonstration tunisiennes
  // Utiliser le premier admin existant (pas forcément celui créé par ce seed)
  const firstAdmin = await prisma.users.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });
  const demoUserId = (firstAdmin ?? adminUser).id;
  await seedTunisianProspects(demoUserId);
  await seedTunisianProperties(demoUserId);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 SEED TERMINÉ AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📋 Prochaines étapes :');
  console.log('1. Lancer le backend : npm run start:dev');
  console.log('2. Se connecter : http://localhost:3001/login');
  console.log('3. Email: admin@crm.com | Mot de passe: Admin123!');
  console.log('4. Configurer les clés API Super Admin dans le panneau admin');
  console.log('\n💡 Les clés API sont actuellement en mode PLACEHOLDER');
  console.log('   Configurez-les dans GlobalSettings pour activer le fallback\n');
}

/**
 * ═════════════════════════════════════════════════════════════════════
 * SEED : PROSPECTS TUNISIENS (démonstration)
 * ═════════════════════════════════════════════════════════════════════
 */
async function seedTunisianProspects(userId: string) {
  console.log('🏠 Création des prospects de démonstration (Tunisie)...\n');

  const existing = await prisma.prospects.count({ where: { userId } });
  if (existing > 0) {
    console.log(`⚠️  ${existing} prospect(s) existent déjà pour cet utilisateur. Skipped.\n`);
    return;
  }

  const prospects = [
    {
      firstName: 'Mohamed',
      lastName: 'Ben Salah',
      email: 'mohamed.bensalah@gmail.com',
      phone: '+216 20 123 456',
      type: 'buyer',
      source: 'website',
      status: 'qualified',
      score: 82,
      notes:
        'Cherche un appartement S+3 à La Marsa ou Gammarth. Budget flexible. Préfère le dernier étage avec vue mer.',
      budget: { min: 300000, max: 450000, currency: 'TND' },
      searchCriteria: { type: 'apartment', city: 'La Marsa', minBedrooms: 3, maxBedrooms: 4 },
      profiling: { avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    },
    {
      firstName: 'Leila',
      lastName: 'Karoui',
      email: 'leila.karoui@topnet.tn',
      phone: '+216 55 987 321',
      type: 'seller',
      source: 'referral',
      status: 'active',
      score: 75,
      notes: 'Souhaite vendre villa familiale héritée à Ennasr. Très motivée, délai de 3 mois max.',
      budget: { asking: 680000, currency: 'TND' },
      mandatInfo: { type: 'vente', reference: 'M-2026-001', signedAt: '2026-03-10' },
      profiling: { avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    },
    {
      firstName: 'Khaled',
      lastName: 'Trabelsi',
      email: 'k.trabelsi@businessmail.tn',
      phone: '+216 98 456 789',
      type: 'investor',
      source: 'phone',
      status: 'qualified',
      score: 91,
      notes:
        'Investisseur actif. Cherche immeuble de rapport ou locaux commerciaux à Tunis Centre ou Lac 2.',
      budget: { min: 500000, max: 1200000, currency: 'TND' },
      searchCriteria: { type: 'commercial', city: 'Tunis', category: 'rent' },
      profiling: { avatar: 'https://randomuser.me/api/portraits/men/67.jpg' },
    },
    {
      firstName: 'Amira',
      lastName: 'Mansouri',
      email: 'amira.mansouri@outlook.com',
      phone: '+216 22 654 987',
      type: 'tenant',
      source: 'social',
      status: 'active',
      score: 58,
      notes: 'Cherche appartement S+2 à louer pour famille de 4 personnes. Zone: Ariana ou Menzah.',
      budget: { min: 600, max: 1000, currency: 'TND', period: 'monthly' },
      searchCriteria: { type: 'apartment', city: 'Ariana', minBedrooms: 2 },
      profiling: { avatar: 'https://randomuser.me/api/portraits/women/55.jpg' },
    },
    {
      firstName: 'Sami',
      lastName: 'Gargouri',
      email: 'sami.gargouri@sfaxconsult.tn',
      phone: '+216 74 321 456',
      type: 'buyer',
      source: 'prospecting',
      status: 'lead',
      score: 44,
      notes:
        'Entrepreneur basé à Sfax. Intéressé par terrain industriel ou entrepôt. Premier contact par email.',
      budget: { min: 200000, max: 350000, currency: 'TND' },
      searchCriteria: { type: 'land', city: 'Sfax' },
      profiling: { avatar: 'https://randomuser.me/api/portraits/men/21.jpg' },
    },
    {
      firstName: 'Fatima',
      lastName: 'Zahra Ben Amor',
      email: 'fatima.benamor@yahoo.fr',
      phone: '+216 51 741 852',
      type: 'buyer',
      source: 'referral',
      status: 'qualified',
      score: 78,
      notes:
        'Médecin retraitée cherche villa plain-pied à Hammamet ou Nabeul. Jardin indispensable, piscine souhaitée.',
      budget: { min: 400000, max: 600000, currency: 'TND' },
      searchCriteria: { type: 'villa', city: 'Hammamet', features: ['garden', 'pool'] },
      profiling: { avatar: 'https://randomuser.me/api/portraits/women/62.jpg' },
    },
    {
      firstName: 'Yassine',
      lastName: 'Bouzid',
      email: 'ybouzid@gmail.com',
      phone: '+216 27 369 258',
      type: 'landlord',
      source: 'website',
      status: 'active',
      score: 67,
      notes: 'Propriétaire de 3 appartements à Sousse. Souhaite mandater la gestion locative.',
      budget: null,
      mandatInfo: { type: 'gestion_locative', nbBiens: 3, ville: 'Sousse' },
      profiling: { avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
    },
    {
      firstName: 'Ines',
      lastName: 'Hammami',
      email: 'ines.hammami@icloud.com',
      phone: '+216 93 852 147',
      type: 'buyer',
      source: 'social',
      status: 'active',
      score: 35,
      notes:
        'Jeune cadre bancaire. Premier achat immobilier. Cherche S+2 à Lac 1 ou Les Berges du Lac.',
      budget: { min: 180000, max: 260000, currency: 'TND' },
      searchCriteria: { type: 'apartment', city: 'Les Berges du Lac', minBedrooms: 2 },
      profiling: { avatar: 'https://randomuser.me/api/portraits/women/29.jpg' },
    },
  ];

  for (const p of prospects) {
    await prisma.prospects.create({
      data: {
        userId,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        type: p.type,
        source: p.source,
        status: p.status,
        score: p.score,
        notes: p.notes,
        budget: p.budget as any,
        searchCriteria: p.searchCriteria as any,
        mandatInfo: p.mandatInfo as any,
        profiling: (p as any).profiling as any,
        currency: 'TND',
      },
    });
    console.log(`  ✅ Prospect créé : ${p.firstName} ${p.lastName} (${p.type})`);
  }
  console.log(`\n✅ ${prospects.length} prospects tunisiens créés.\n`);
}

/**
 * ═════════════════════════════════════════════════════════════════════
 * SEED : PROPRIÉTÉS TUNISIENNES avec mandats (démonstration)
 * ═════════════════════════════════════════════════════════════════════
 */
async function seedTunisianProperties(userId: string) {
  console.log('🏰 Création des propriétés de démonstration (Tunisie)...\n');

  const existing = await prisma.properties.count({ where: { userId } });
  if (existing > 0) {
    console.log(`⚠️  ${existing} propriété(s) existent déjà pour cet utilisateur. Skipped.\n`);
    return;
  }

  const properties = [
    {
      reference: 'PROP-2026-001',
      title: 'Appartement S+3 vue mer - La Marsa',
      description:
        "Magnifique appartement au dernier étage d'une résidence sécurisée à La Marsa. Vue panoramique sur la mer. Salon spacieux, 3 chambres, 2 salles de bain, cuisine américaine équipée. Parking 2 voitures.",
      type: 'apartment',
      category: 'sale',
      price: 420000,
      area: 145,
      bedrooms: 3,
      bathrooms: 2,
      address: 'Résidence Les Pins, Rue Habib Thameur',
      city: 'La Marsa',
      delegation: 'La Marsa',
      zipCode: '2070',
      status: 'available',
      priority: 'high',
      tags: ['vue mer', 'terrasse', 'parking', 'gardien'],
      features: ['parking', 'terrace', 'sea_view', 'security'],
      notes: 'Bien en excellent état. Disponible dès signature. Propriétaire expatrié en France.',
      mandatInfo: {
        type: 'vente_exclusive',
        reference: 'MV-2026-001',
        mandataire: 'Mohamed Ben Youssef',
        phone: '+216 20 111 222',
        signedAt: '2026-02-15',
        expiresAt: '2026-08-15',
        commission: 3,
        commissionPayer: 'acheteur',
      },
      isFeatured: true,
    },
    {
      reference: 'PROP-2026-002',
      title: 'Villa S+4 avec piscine - Hammamet Nord',
      description:
        'Superbe villa contemporaine sur terrain de 650 m² à Hammamet Nord, quartier résidentiel calme. Grand jardin paysager, piscine chauffée 10x5m, 4 chambres suite, garage 2 voitures. À 800m de la plage.',
      type: 'villa',
      category: 'sale',
      price: 850000,
      area: 310,
      bedrooms: 4,
      bathrooms: 4,
      address: 'Zone Touristique Hammamet Nord',
      city: 'Hammamet',
      delegation: 'Hammamet',
      zipCode: '8050',
      status: 'available',
      priority: 'urgent',
      tags: ['piscine', 'jardin', 'garage', 'luxe'],
      features: ['pool', 'garden', 'garage', 'alarm', 'air_conditioning'],
      notes: 'Coup de cœur garanti. Photos professionnelles disponibles. Visites 7j/7.',
      mandatInfo: {
        type: 'vente_exclusive',
        reference: 'MV-2026-002',
        mandataire: 'Sonia Chaabane',
        phone: '+216 72 456 789',
        signedAt: '2026-01-20',
        expiresAt: '2026-07-20',
        commission: 3.5,
        commissionPayer: 'vendeur',
      },
      isFeatured: true,
    },
    {
      reference: 'PROP-2026-003',
      title: 'Appartement S+2 meublé à louer - Lac 1',
      description:
        'Appartement entièrement meublé et équipé au 4ème étage avec ascenseur aux Berges du Lac 1. Climatisation, cuisine équipée, internet fibre inclus. Idéal pour cadre ou famille. Charges comprises.',
      type: 'apartment',
      category: 'rent',
      price: 1800,
      area: 95,
      bedrooms: 2,
      bathrooms: 1,
      address: "Immeuble Jasmin, Avenue de l'Environnement",
      city: 'Les Berges du Lac',
      delegation: 'Tunis',
      zipCode: '1053',
      status: 'available',
      priority: 'high',
      tags: ['meublé', 'ascenseur', 'clim', 'parking'],
      features: ['furnished', 'elevator', 'air_conditioning', 'parking', 'fiber_internet'],
      notes: 'Loyer mensuel 1800 TND charges comprises. Caution 2 mois. Bail 1 an renouvelable.',
      mandatInfo: {
        type: 'location_exclusive',
        reference: 'ML-2026-003',
        mandataire: 'Karim Belhadj',
        phone: '+216 96 333 444',
        signedAt: '2026-03-01',
        expiresAt: '2026-09-01',
        commission: 1,
        commissionBase: 'premier_mois',
      },
      isFeatured: false,
    },
    {
      reference: 'PROP-2026-004',
      title: 'Terrain constructible 500 m² - Ennasr 2',
      description:
        "Terrain plat de 500 m² viabilisé (eau, gaz, électricité, tout-à-l'égout) dans lotissement résidentiel à Ennasr 2. Zone R+2 autorisée. Plan masse disponible. Accès direct sur voie principale.",
      type: 'land',
      category: 'sale',
      price: 280000,
      area: 500,
      bedrooms: 0,
      bathrooms: 0,
      address: 'Lotissement El Menzah 9B',
      city: 'Ariana',
      delegation: 'Ennasr',
      zipCode: '2037',
      status: 'available',
      priority: 'medium',
      tags: ['viabilisé', 'plat', 'R+2', 'lotissement'],
      features: ['utilities', 'flat', 'road_access'],
      notes: 'Titre foncier propre. Documents urbanisme disponibles à la demande.',
      mandatInfo: {
        type: 'vente_simple',
        reference: 'MV-2026-004',
        mandataire: 'Hichem Dhouibi',
        phone: '+216 25 666 777',
        signedAt: '2026-02-28',
        expiresAt: '2026-08-28',
        commission: 2.5,
        commissionPayer: 'acheteur',
      },
      isFeatured: false,
    },
    {
      reference: 'PROP-2026-005',
      title: 'Local commercial 120 m² - Sousse Centre',
      description:
        'Local commercial en rez-de-chaussée dans rue passante du centre-ville de Sousse. Vitrine sur rue de 8 ml, hauteur sous plafond 3,5m, climatisation, WC, réserve. Idéal boutique, banque, pharmacie.',
      type: 'commercial',
      category: 'rent',
      price: 2500,
      area: 120,
      bedrooms: 0,
      bathrooms: 1,
      address: 'Avenue Habib Bourguiba, Sousse',
      city: 'Sousse',
      delegation: 'Sousse Médina',
      zipCode: '4000',
      status: 'available',
      priority: 'high',
      tags: ['rez-de-chaussée', 'vitrine', 'centre-ville', 'parking visiteurs'],
      features: ['storefront', 'air_conditioning', 'storage', 'toilet'],
      notes: 'Loyer: 2500 TND/mois HT. Pas-de-porte: 15 000 TND. Bail commercial 3-6-9.',
      mandatInfo: {
        type: 'location_exclusive',
        reference: 'ML-2026-005',
        mandataire: 'Nadia Ayari',
        phone: '+216 73 888 999',
        signedAt: '2026-03-15',
        expiresAt: '2026-09-15',
        commission: 1,
        commissionBase: 'premier_mois',
      },
      isFeatured: true,
    },
    {
      reference: 'PROP-2026-006',
      title: 'Studio meublé neuf - Sidi Bou Saïd',
      description:
        'Studio de charme entièrement rénové dans le village de Sidi Bou Saïd. Décoration traditionnelle tunisienne, terrasse privée avec vue sur la baie de Tunis, kitchenette équipée, wifi. Calme absolu.',
      type: 'studio',
      category: 'rent',
      price: 900,
      area: 38,
      bedrooms: 1,
      bathrooms: 1,
      address: 'Rue Sidi Bouali, Sidi Bou Saïd',
      city: 'Sidi Bou Saïd',
      delegation: 'La Marsa',
      zipCode: '2026',
      status: 'available',
      priority: 'medium',
      tags: ['vue mer', 'terrasse', 'rénové', 'charme'],
      features: ['furnished', 'terrace', 'sea_view', 'wifi'],
      notes: "Location annuelle préférée. Pas de location saisonnière. Calme, pas d'animaux.",
      mandatInfo: {
        type: 'location_simple',
        reference: 'ML-2026-006',
        mandataire: 'Rania Slama',
        phone: '+216 23 444 555',
        signedAt: '2026-03-20',
        expiresAt: '2026-09-20',
        commission: 0.5,
        commissionBase: 'premier_mois',
      },
      isFeatured: false,
    },
    {
      reference: 'PROP-2026-007',
      title: 'Villa duplex S+5 - Carthage Salammbô',
      description:
        'Majestueuse villa de prestige sur deux niveaux dans le quartier historique de Carthage. Vue imprenable sur la mer et le site archéologique. 5 suites, salle de réception 80m², cave à vin, jacuzzi extérieur, domotique intégrée.',
      type: 'villa',
      category: 'sale',
      price: 2200000,
      area: 520,
      bedrooms: 5,
      bathrooms: 5,
      address: 'Rue Hannibal, Carthage Salammbô',
      city: 'Carthage',
      delegation: 'Carthage',
      zipCode: '2016',
      status: 'reserved',
      priority: 'urgent',
      tags: ['prestige', 'vue mer', 'domotique', 'jacuzzi', 'cave à vin'],
      features: ['pool', 'jacuzzi', 'smart_home', 'wine_cellar', 'sea_view', 'garden'],
      notes:
        "Bien d'exception. Discrétion assurée. Visite sur RDV uniquement avec justificatif de financement.",
      mandatInfo: {
        type: 'vente_exclusive',
        reference: 'MV-2026-007',
        mandataire: 'Directeur Agence Prestige',
        phone: '+216 71 100 200',
        signedAt: '2026-01-05',
        expiresAt: '2026-07-05',
        commission: 3,
        commissionPayer: 'vendeur',
        notes: 'Mandat exclusif. Toute visite doit être déclarée.',
      },
      isFeatured: true,
    },
    {
      reference: 'PROP-2026-008',
      title: 'Appartement neuf S+3 - Sfax Cité Erriadh',
      description:
        'Appartement neuf dans résidence fermée sécurisée à Sfax. Standing moderne, dalle haute performance, menuiseries aluminium double vitrage, BMS, 2 places parking. Livraison immédiate, jamais habité.',
      type: 'apartment',
      category: 'sale',
      price: 195000,
      area: 110,
      bedrooms: 3,
      bathrooms: 2,
      address: 'Cité Erriadh, Route El Ain',
      city: 'Sfax',
      delegation: 'Sfax Sud',
      zipCode: '3002',
      status: 'available',
      priority: 'medium',
      tags: ['neuf', 'parking', 'résidence fermée', 'jamais habité'],
      features: ['parking', 'security', 'double_glazing', 'new_build'],
      notes:
        'Premier propriétaire. Garantie décennale constructeur fournie. Financement bancaire possible.',
      mandatInfo: {
        type: 'vente_simple',
        reference: 'MV-2026-008',
        mandataire: 'Promoteur ImmoBuild Sfax',
        phone: '+216 74 200 300',
        signedAt: '2026-02-01',
        expiresAt: '2026-08-01',
        commission: 2,
        commissionPayer: 'promoteur',
      },
      isFeatured: false,
    },
    {
      reference: 'PROP-2026-009',
      title: 'Bureau 80 m² avec terrasse - Tunis Centre',
      description:
        'Beau bureau au 6ème étage avec ascenseur, terrasse privée 25m², climatisation réversible, câblage réseau structuré, 2 parkings couverts. Immeuble de bureaux sécurisé avec accueil. Vue dégagée.',
      type: 'office',
      category: 'rent',
      price: 2800,
      area: 80,
      bedrooms: 0,
      bathrooms: 1,
      address: 'Avenue Mohamed V, Tour Crystale',
      city: 'Tunis',
      delegation: 'Tunis Centre',
      zipCode: '1001',
      status: 'available',
      priority: 'high',
      tags: ['terrasse', 'ascenseur', 'parking', 'sécurisé'],
      features: [
        'elevator',
        'parking',
        'air_conditioning',
        'security',
        'terrace',
        'structured_cabling',
      ],
      notes:
        'Loyer 2800 TND/mois HT. Charges: 350 TND/mois. Bail professionnel. Disponible le 01/05/2026.',
      mandatInfo: {
        type: 'location_exclusive',
        reference: 'ML-2026-009',
        mandataire: 'Omar Chiboub',
        phone: '+216 71 500 600',
        signedAt: '2026-03-25',
        expiresAt: '2026-09-25',
        commission: 1,
        commissionBase: 'premier_mois',
      },
      isFeatured: false,
    },
    {
      reference: 'PROP-2026-010',
      title: 'Maison arabe rénovée - Médina de Tunis',
      description:
        'Authentique maison arabe (dar) entièrement rénovée dans la Médina de Tunis classée Patrimoine UNESCO. Cour centrale avec fontaine, plafonds à caissons, zelliges, 3 chambres, terrasse panoramique sur la médina. Unique.',
      type: 'house',
      category: 'sale',
      price: 390000,
      area: 195,
      bedrooms: 3,
      bathrooms: 2,
      address: 'Impasse Sidi Ben Arous, Médina',
      city: 'Tunis',
      delegation: 'Médina',
      zipCode: '1008',
      status: 'available',
      priority: 'high',
      tags: ['médina', 'patrimoine UNESCO', 'rénovée', 'authentique', 'terrasse'],
      features: ['terrace', 'courtyard', 'renovated', 'historic'],
      notes:
        "Bien d'exception. Seul dans son genre. Autorisations patrimoniales en règle. Idéal résidence principale ou maison d'hôtes.",
      mandatInfo: {
        type: 'vente_exclusive',
        reference: 'MV-2026-010',
        mandataire: 'Amel Bourguiba',
        phone: '+216 71 700 800',
        signedAt: '2026-02-10',
        expiresAt: '2026-08-10',
        commission: 4,
        commissionPayer: 'acheteur',
        notes: 'Exclusivité totale. Prix ferme. Vendeur non pressé.',
      },
      isFeatured: true,
    },
  ];

  const propertyImages: Record<string, string[]> = {
    'PROP-2026-001': [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    ],
    'PROP-2026-002': [
      'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=800&q=80',
      'https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    ],
    'PROP-2026-003': [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80',
    ],
    'PROP-2026-004': [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    ],
    'PROP-2026-005': [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80',
    ],
    'PROP-2026-006': [
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    ],
    'PROP-2026-007': [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    ],
    'PROP-2026-008': [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80',
    ],
    'PROP-2026-009': [
      'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=800&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
    ],
    'PROP-2026-010': [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
      'https://images.unsplash.com/photo-1595599565597-12e0fcc7a2a9?w=800&q=80',
    ],
  };

  for (const p of properties) {
    await prisma.properties.create({
      data: {
        userId,
        reference: p.reference,
        title: p.title,
        description: p.description,
        type: p.type,
        category: p.category as any,
        price: p.price,
        currency: 'TND',
        area: p.area,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        address: p.address,
        city: p.city,
        delegation: p.delegation,
        zipCode: p.zipCode,
        status: p.status as any,
        priority: p.priority as any,
        tags: p.tags,
        features: p.features,
        notes: p.notes,
        mandatInfo: p.mandatInfo as any,
        isFeatured: p.isFeatured,
        images: propertyImages[p.reference] ?? [],
      },
    });
    console.log(`  ✅ Propriété créée : ${p.reference} — ${p.title}`);
  }
  console.log(`\n✅ ${properties.length} propriétés tunisiennes créées.\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
