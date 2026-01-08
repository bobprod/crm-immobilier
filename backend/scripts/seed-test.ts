import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test database seeding...');

  // Nettoyer la base de données
  console.log('🗑️  Cleaning database...');
  await prisma.appointments.deleteMany({});
  await prisma.prospects.deleteMany({});
  await prisma.properties.deleteMany({});
  await prisma.users.deleteMany({});

  // Créer un utilisateur de test
  console.log('👤 Creating test user...');
  const hashedPassword = await bcrypt.hash('test123', 10);

  const testUser = await prisma.users.create({
    data: {
      email: 'test@crm-immobilier.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'agent',
      agencyName: 'Test Agency',
      phone: '+33612345678',
      isEmailVerified: true,
    },
  });

  console.log(`✅ Test user created: ${testUser.email}`);

  // Créer des prospects de test
  console.log('👥 Creating test prospects...');

  const prospect1 = await prisma.prospects.create({
    data: {
      userId: testUser.id,
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '+33612345601',
      type: 'buyer',
      status: 'active',
      score: 75,
      source: 'website',
      city: 'Paris',
      budget: 350000,
      propertyTypes: ['apartment'],
    },
  });

  const prospect2 = await prisma.prospects.create({
    data: {
      userId: testUser.id,
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      phone: '+33612345602',
      type: 'seller',
      status: 'new',
      score: 60,
      source: 'referral',
      city: 'Lyon',
      propertyTypes: ['house'],
    },
  });

  const prospect3 = await prisma.prospects.create({
    data: {
      userId: testUser.id,
      firstName: 'Pierre',
      lastName: 'Dubois',
      email: 'pierre.dubois@example.com',
      phone: '+33612345603',
      type: 'buyer',
      status: 'contacted',
      score: 85,
      source: 'phone',
      city: 'Marseille',
      budget: 500000,
      propertyTypes: ['villa', 'house'],
    },
  });

  console.log(`✅ Created ${3} test prospects`);

  // Créer des propriétés de test
  console.log('🏠 Creating test properties...');

  const property1 = await prisma.properties.create({
    data: {
      userId: testUser.id,
      title: 'Appartement T3 Paris 15ème',
      type: 'apartment',
      category: 'sale',
      price: 450000,
      currency: 'EUR',
      area: 75,
      bedrooms: 2,
      bathrooms: 1,
      address: '123 Rue de Vaugirard',
      city: 'Paris',
      postalCode: '75015',
      country: 'France',
      status: 'available',
      description: 'Bel appartement rénové en plein cœur du 15ème arrondissement',
    },
  });

  const property2 = await prisma.properties.create({
    data: {
      userId: testUser.id,
      title: 'Maison avec jardin Lyon',
      type: 'house',
      category: 'sale',
      price: 650000,
      currency: 'EUR',
      area: 150,
      bedrooms: 4,
      bathrooms: 2,
      address: '45 Avenue Jean Jaurès',
      city: 'Lyon',
      postalCode: '69007',
      country: 'France',
      status: 'available',
      description: 'Maison familiale avec grand jardin',
    },
  });

  console.log(`✅ Created ${2} test properties`);

  // Créer des rendez-vous de test
  console.log('📅 Creating test appointments...');

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const appointment1 = await prisma.appointments.create({
    data: {
      userId: testUser.id,
      prospectId: prospect1.id,
      propertyId: property1.id,
      title: 'Visite appartement Paris 15ème',
      type: 'visit',
      status: 'scheduled',
      priority: 'high',
      startTime: new Date(tomorrow.setHours(14, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(15, 0, 0, 0)),
      location: '123 Rue de Vaugirard, 75015 Paris',
      description: 'Première visite avec M. Dupont',
      reminder: true,
      reminderTime: 60,
      attendees: [
        {
          name: 'Jean Dupont',
          email: 'jean.dupont@example.com',
          phone: '+33612345601',
          type: 'prospect',
          status: 'pending',
        },
      ],
    },
  });

  const appointment2 = await prisma.appointments.create({
    data: {
      userId: testUser.id,
      prospectId: prospect2.id,
      title: 'Estimation bien Lyon',
      type: 'estimation',
      status: 'scheduled',
      priority: 'medium',
      startTime: new Date(nextWeek.setHours(10, 0, 0, 0)),
      endTime: new Date(nextWeek.setHours(11, 30, 0, 0)),
      location: '45 Avenue Jean Jaurès, 69007 Lyon',
      description: 'Estimation de la maison de Mme Martin',
      reminder: true,
      reminderTime: 120,
      attendees: [
        {
          name: 'Marie Martin',
          email: 'marie.martin@example.com',
          phone: '+33612345602',
          type: 'prospect',
          status: 'pending',
        },
      ],
    },
  });

  const appointment3 = await prisma.appointments.create({
    data: {
      userId: testUser.id,
      prospectId: prospect3.id,
      propertyId: property2.id,
      title: 'Signature compromis de vente',
      type: 'signature',
      status: 'confirmed',
      priority: 'urgent',
      startTime: new Date(tomorrow.setHours(16, 0, 0, 0)),
      endTime: new Date(tomorrow.setHours(17, 30, 0, 0)),
      location: 'Agence Test Agency',
      description: 'Signature du compromis pour M. Dubois',
      reminder: true,
      reminderTime: 180,
      attendees: [
        {
          name: 'Pierre Dubois',
          email: 'pierre.dubois@example.com',
          phone: '+33612345603',
          type: 'prospect',
          status: 'accepted',
        },
      ],
    },
  });

  // Créer un rendez-vous passé (pour les tests de complétion)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const appointment4 = await prisma.appointments.create({
    data: {
      userId: testUser.id,
      prospectId: prospect1.id,
      title: 'Rendez-vous téléphonique',
      type: 'meeting',
      status: 'scheduled',
      priority: 'low',
      startTime: new Date(yesterday.setHours(14, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(14, 30, 0, 0)),
      description: 'Point téléphonique de suivi',
      reminder: false,
      attendees: [],
    },
  });

  console.log(`✅ Created ${4} test appointments`);

  console.log('\n📊 Test data summary:');
  console.log('====================');
  console.log(`👤 Users: 1`);
  console.log(`   - Email: ${testUser.email}`);
  console.log(`   - Password: test123`);
  console.log(`👥 Prospects: 3`);
  console.log(`🏠 Properties: 2`);
  console.log(`📅 Appointments: 4`);
  console.log('====================\n');

  console.log('✅ Test database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
