const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔄 Création de l\'utilisateur administrateur...\n');

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.users.findUnique({
      where: { email: 'admin@crm.com' }
    });

    if (existingUser) {
      console.log('⚠️  L\'utilisateur admin@crm.com existe déjà !');
      console.log('📧 Email: admin@crm.com');
      console.log('🔑 Mot de passe: admin123\n');
      return;
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Créer l'utilisateur admin
    const user = await prisma.users.create({
      data: {
        email: 'admin@crm.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'CRM',
        role: 'ADMIN',
      }
    });

    console.log('✅ Utilisateur admin créé avec succès !\n');
    console.log('======================================================');
    console.log('🔐 IDENTIFIANTS DE CONNEXION');
    console.log('======================================================');
    console.log('📧 Email      : admin@crm.com');
    console.log('🔑 Mot de passe : admin123');
    console.log('🌐 URL        : http://localhost:3001/login');
    console.log('======================================================\n');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error.message);

    if (error.code === 'P2002') {
      console.log('\n⚠️  L\'utilisateur existe déjà !');
      console.log('📧 Email: admin@crm.com');
      console.log('🔑 Mot de passe: admin123\n');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
