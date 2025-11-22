const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Vérifier si l'utilisateur admin existe déjà
    const existingUser = await prisma.users.findUnique({
      where: { email: 'admin@crm.com' }
    });

    if (existingUser) {
      console.log('✅ Utilisateur admin existe déjà!');
      console.log('📧 Email: admin@crm.com');
      console.log('🔑 Mot de passe: admin123');
      console.log('\nℹ️  Si vous avez oublié le mot de passe, supprimez cet utilisateur et relancez ce script.');
      return;
    }

    // Créer un nouvel utilisateur admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const user = await prisma.users.create({
      data: {
        email: 'admin@crm.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'CRM',
        role: 'admin',
      }
    });

    console.log('✅ Utilisateur admin créé avec succès!');
    console.log('📧 Email: admin@crm.com');
    console.log('🔑 Mot de passe: admin123');
    console.log('\n⚠️  Changez ce mot de passe après la première connexion!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
