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
    console.log('⚠️  L\'utilisateur admin@crm.com existe déjà');
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
      role: 'admin',
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
      description: 'Analyse et extraction d\'informations depuis un document',
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
      description: 'Envoi d\'un message à l\'assistant conversationnel',
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
  await seedAdminUser();

  // 2. Créer les settings Super Admin (clés API fallback)
  await seedSuperAdminSettings();

  // 3. Créer le pricing AI
  await seedAiPricing();

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

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
