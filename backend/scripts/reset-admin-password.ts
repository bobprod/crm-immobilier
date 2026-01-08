import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  console.log('🔧 Réinitialisation du mot de passe admin...\n');

  const email = 'admin@crm.com';
  const newPassword = 'Admin123!';

  // Vérifier si l'utilisateur existe
  const user = await prisma.users.findUnique({
    where: { email },
  });

  if (!user) {
    console.error('❌ Utilisateur admin@crm.com non trouvé!');
    process.exit(1);
  }

  console.log('✓ Utilisateur trouvé:', user.email);
  console.log('  ID:', user.id);
  console.log('  Rôle:', user.role);
  console.log('  Hash actuel:', user.password.substring(0, 20) + '...\n');

  // Hasher le nouveau mot de passe
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  console.log('✓ Nouveau hash généré:', hashedPassword.substring(0, 20) + '...\n');

  // Mettre à jour le mot de passe
  await prisma.users.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log('✅ Mot de passe mis à jour avec succès!\n');
  console.log('Identifiants de connexion:');
  console.log('Email:', email);
  console.log('Mot de passe:', newPassword);

  // Tester le hash
  const testUser = await prisma.users.findUnique({
    where: { email },
  });

  const isValid = await bcrypt.compare(newPassword, testUser.password);
  console.log('\n🧪 Test de validation:', isValid ? '✓ SUCCÈS' : '✗ ÉCHEC');

  await prisma.$disconnect();
}

resetAdminPassword()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  });
