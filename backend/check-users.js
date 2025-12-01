const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true
            }
        });

        console.log('🔍 Utilisateurs existants dans la base de données:');
        console.log('================================================');

        if (users.length === 0) {
            console.log('❌ Aucun utilisateur trouvé dans la base de données.');
            console.log('💡 Vous pouvez créer un utilisateur avec le script seed:');
            console.log('   npx ts-node prisma/seed.ts');
        } else {
            users.forEach((user, index) => {
                console.log(`${index + 1}. 📧 Email: ${user.email}`);
                console.log(`   👤 Nom: ${user.firstName} ${user.lastName}`);
                console.log(`   🔑 Rôle: ${user.role}`);
                console.log(`   🆔 ID: ${user.id}`);
                console.log(`   📅 Créé le: ${user.createdAt.toLocaleDateString('fr-FR')}`);
                console.log('');
            });
        }
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
