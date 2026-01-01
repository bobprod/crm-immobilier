/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Script d'enregistrement du module Tasks dans le Module Registry
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ce script enregistre le module "business-tasks" dans le Module Registry
 * pour qu'il apparaisse dans le menu de navigation dynamique.
 *
 * UTILISATION:
 * ------------
 * 1. Via API (Recommandé - SUPER_ADMIN uniquement):
 *    POST http://localhost:3000/core/modules/register
 *    Content-Type: application/json
 *    Authorization: Bearer <super_admin_token>
 *
 *    Body: (contenu de tasks.manifest.json)
 *
 * 2. Via script direct (développement):
 *    ts-node backend/src/modules/business/tasks/register-tasks-module.ts
 *
 * 3. Via Prisma Studio:
 *    - Ouvrir table BusinessModule
 *    - Créer manuellement l'entrée avec le manifest
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function registerTasksModule() {
  console.log('🔧 Enregistrement du module Tasks dans le Module Registry...\n');

  try {
    // Lire le manifest
    const manifestPath = path.join(__dirname, 'tasks.manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    console.log('📄 Manifest chargé:', manifest.code);
    console.log('📦 Version:', manifest.version);
    console.log('📁 Catégorie:', manifest.category);

    // Vérifier si le module existe déjà
    const existingModule = await prisma.businessModule.findUnique({
      where: { code: manifest.code },
    });

    if (existingModule) {
      console.log('\n⚠️  Module déjà enregistré!');
      console.log('🆔 ID:', existingModule.id);
      console.log('📝 Nom:', existingModule.name);
      console.log('✅ Statut:', existingModule.status);

      // Mettre à jour le module existant
      const updated = await prisma.businessModule.update({
        where: { code: manifest.code },
        data: {
          name: manifest.name,
          description: manifest.description,
          version: manifest.version,
          status: 'ACTIVE',
          category: manifest.category,
          manifest: manifest,
          basePrice: manifest.basePrice || 0,
          creditsIncluded: manifest.creditsIncluded || 0,
          updatedAt: new Date(),
        },
      });

      console.log('\n✅ Module mis à jour avec succès!');
      console.log('🔄 Version:', updated.version);
      return updated;
    }

    // Créer le nouveau module
    const module = await prisma.businessModule.create({
      data: {
        code: manifest.code,
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        status: 'ACTIVE',
        category: manifest.category,
        manifest: manifest,
        basePrice: manifest.basePrice || 0,
        creditsIncluded: manifest.creditsIncluded || 0,
      },
    });

    console.log('\n✅ Module Tasks enregistré avec succès!');
    console.log('🆔 ID:', module.id);
    console.log('📝 Nom:', module.name);
    console.log('🔗 Code:', module.code);
    console.log('📊 Statut:', module.status);

    // Afficher les menus créés
    console.log('\n📋 Menus créés:');
    manifest.menus.forEach((menu: any, index: number) => {
      console.log(`  ${index + 1}. ${menu.label} (${menu.icon}) → ${menu.path}`);
      console.log(`     Ordre: ${menu.order}, Rôle min: ${menu.requiredRole || 'USER'}`);
    });

    console.log('\n🎯 Prochaines étapes:');
    console.log('  1. Activer le module pour une agence:');
    console.log(`     POST /core/modules/activate/{agencyId}/${manifest.code}`);
    console.log('  2. Le menu "Tâches" apparaîtra automatiquement');
    console.log('  3. Supprimer l\'entrée du menu par défaut dans useMenu.ts\n');

    return module;

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'enregistrement du module:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution si appelé directement
if (require.main === module) {
  registerTasksModule()
    .then(() => {
      console.log('✨ Script terminé avec succès!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

export { registerTasksModule };
