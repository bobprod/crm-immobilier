/**
 * SEED : Pré-configure les engagements Firstimmo
 * Usage : ts-node src/scripts/seed-firstimmo-provisions.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // Trouver l'agence Firstimmo
  const agency = await db.agencies.findFirst({
    where: { name: { contains: 'Firstimmo', mode: 'insensitive' } },
  });

  if (!agency) {
    console.error('❌ Agence Firstimmo non trouvée. Créer l\'agence d\'abord.');
    process.exit(1);
  }

  const creator = await db.users.findFirst({ where: { agencyId: agency.id } });
  if (!creator) {
    console.error('❌ Aucun utilisateur trouvé pour l\'agence Firstimmo.');
    process.exit(1);
  }

  const commitments = [
    {
      name: 'Provision capital investisseur',
      description: 'Mise de côté mensuelle — remboursement capital deal Dhia (80 000 TND sur 12 mois)',
      category: 'INVESTOR',
      type: 'provision_capital',
      amount: 6667,
      currency: 'TND',
      frequency: 'MONTHLY',
      customDayOfMonth: null,
      gracePeriodDays: 5,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      totalOccurrences: 12,
      alertLevel: 'CRITICAL',
      alertChannels: ['notification', 'email'],
      metadata: {
        investorName: 'Dhia',
        totalCapital: 80000,
        totalToRepay: 108000,
        dealDate: '2026-01-01',
        note: 'Provision intouchable — priorité absolue',
      },
    },
    {
      name: 'Intérêts investisseur',
      description: 'Paiement mensuel des intérêts — 28 000 TND sur 12 mois = 2 333 TND/mois',
      category: 'INVESTOR',
      type: 'loan_interest',
      amount: 2333,
      currency: 'TND',
      frequency: 'MONTHLY',
      customDayOfMonth: null,
      gracePeriodDays: 5,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      totalOccurrences: 12,
      alertLevel: 'HIGH',
      alertChannels: ['notification', 'email'],
      metadata: {
        investorName: 'Dhia',
        totalInterests: 28000,
        note: 'Payé avant toute autre dépense',
      },
    },
  ];

  console.log('🌱 Seeding Firstimmo provisions...');

  for (const data of commitments) {
    const existing = await db.financialCommitment.findFirst({
      where: { agencyId: agency.id, type: data.type },
    });

    if (existing) {
      console.log(`⚠️  Déjà existant : ${data.name}`);
      continue;
    }

    const commitment = await db.financialCommitment.create({
      data: { 
        ...data, 
        agencyId: agency.id, 
        createdBy: creator.id,
        isActive: true,
      },
    });

    // Générer les 12 occurrences
    const months = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const occurrences = Array.from({ length: 12 }, (_, i) => ({
      commitmentId: commitment.id,
      agencyId: agency.id,
      periodLabel: `${months[i]} 2026`,
      periodYear: 2026,
      periodMonth: i + 1,
      dueDate: new Date(2026, i, 1),
      expectedAmount: data.amount,
      currency: data.currency,
      status: 'PENDING' as const,
    }));

    await db.provisionOccurrence.createMany({ data: occurrences });
    console.log(`✅ Créé : ${data.name} + 12 occurrences`);
  }

  console.log('🎉 Seed terminé !');
  console.log(`📊 Total engagements Firstimmo : 9 000 TND/mois (6 667 + 2 333)`);
  console.log(`📊 Cumul M12 attendu : 108 000 TND (capital + intérêts)`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
