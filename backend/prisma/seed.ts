import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
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
    console.log('\n📧 Email:', existingUser.email);
    console.log('👤 Nom:', existingUser.firstName, existingUser.lastName);
    console.log('🔑 Rôle:', existingUser.role);
    console.log('\n💡 Utilisez le mot de passe existant pour vous connecter');
    return;
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

  console.log('✅ Utilisateur administrateur créé avec succès!\n');
  console.log('📧 Email:', user.email);
  console.log('🔒 Mot de passe:', password);
  console.log('👤 Nom:', user.firstName, user.lastName);
  console.log('🔑 Rôle:', user.role);
  console.log('🆔 ID:', user.id);
  console.log('\n🎉 Vous pouvez maintenant vous connecter avec ces identifiants');
  console.log('🌐 URL Frontend: http://localhost:3001/login');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
