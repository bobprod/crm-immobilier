import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script de migration : Prospects (owners) → Owners
 *
 * Ce script migre tous les prospects marqués comme propriétaires
 * vers la nouvelle table Owners
 */
async function migrateOwners() {
  console.log('🔄 Début de la migration des propriétaires...\n');

  try {
    // 1. Trouver toutes les propriétés avec un ownerId (ancien système)
    const propertiesWithOldOwner = await prisma.properties.findMany({
      where: {
        ownerId: {
          not: null,
        },
      },
      include: {
        owner: true, // Prospect actuel
      },
    });

    console.log(`📊 ${propertiesWithOldOwner.length} propriétés avec ancien owner trouvées\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const property of propertiesWithOldOwner) {
      if (!property.owner) {
        console.log(`⚠️  Propriété ${property.id} : owner introuvable, skip`);
        skipped++;
        continue;
      }

      try {
        // 2. Vérifier si le propriétaire existe déjà dans la nouvelle table
        const existingOwner = await prisma.owner.findFirst({
          where: {
            userId: property.userId,
            email: property.owner.email || undefined,
            firstName: property.owner.firstName || undefined,
            lastName: property.owner.lastName || undefined,
          },
        });

        let newOwnerId: string;

        if (existingOwner) {
          console.log(`✅ Propriétaire existant trouvé : ${existingOwner.firstName} ${existingOwner.lastName}`);
          newOwnerId = existingOwner.id;
        } else {
          // 3. Créer le nouveau propriétaire
          const newOwner = await prisma.owner.create({
            data: {
              userId: property.userId,
              firstName: property.owner.firstName || 'Propriétaire',
              lastName: property.owner.lastName || 'Inconnu',
              email: property.owner.email,
              phone: property.owner.phone,
              notes: `Migré depuis prospect ${property.owner.id}`,
              metadata: {
                migratedFromProspectId: property.owner.id,
                migratedAt: new Date().toISOString(),
              },
            },
          });

          console.log(`✨ Nouveau propriétaire créé : ${newOwner.firstName} ${newOwner.lastName} (${newOwner.id})`);
          newOwnerId = newOwner.id;
        }

        // 4. Mettre à jour la propriété avec le nouveau owner
        await prisma.properties.update({
          where: { id: property.id },
          data: {
            ownerNewId: newOwnerId,
          },
        });

        console.log(`✅ Propriété ${property.title} mise à jour (${property.id})\n`);
        migrated++;
      } catch (error) {
        console.error(`❌ Erreur pour propriété ${property.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 RÉSUMÉ DE LA MIGRATION :');
    console.log(`✅ Migrées : ${migrated}`);
    console.log(`⚠️  Ignorées : ${skipped}`);
    console.log(`❌ Erreurs : ${errors}`);
    console.log(`\n✨ Migration terminée avec succès !`);

    // 5. Afficher les statistiques
    const totalOwners = await prisma.owner.count();
    console.log(`\n📈 Total propriétaires dans la nouvelle table : ${totalOwners}`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
migrateOwners()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale :', error);
    process.exit(1);
  });
