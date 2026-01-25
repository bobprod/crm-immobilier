import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

type MenuItemManifest = {
    label: string;
    path: string;
    icon?: string;
    order?: number;
    requiredRole?: UserRole;
    children?: MenuItemManifest[];
};

type ModuleManifestLite = {
    code: string;
    name: string;
    version: string;
    category: 'BUSINESS' | 'INTELLIGENCE' | 'INTEGRATION' | 'COMMUNICATION' | 'MARKETING';
    description?: string;
    menus: MenuItemManifest[];
    permissions?: string[];
    aiActions?: Array<{
        code: string;
        name: string;
        description?: string;
        creditsCost: number;
    }>;
};

const modulesToRegister: ModuleManifestLite[] = [
    {
        code: 'core-suite',
        name: 'Suite CRM Immobilier',
        version: '1.0.0',
        category: 'BUSINESS',
        description: 'Module par défaut regroupant les principales fonctionnalités CRM.',
        menus: [
            {
                label: 'Tableau de bord',
                path: '/dashboard',
                icon: 'LayoutDashboard',
                order: 0,
            },
            {
                label: 'Prospection IA',
                path: '/prospecting',
                icon: 'Bot',
                order: 10,
            },
            {
                label: 'Prospects',
                path: '/prospects',
                icon: 'Users',
                order: 20,
            },
            {
                label: 'Biens',
                path: '/properties',
                icon: 'Building2',
                order: 30,
            },
            {
                label: 'Matching',
                path: '/matching',
                icon: 'Target',
                order: 40,
            },
            {
                label: 'Planification',
                path: '/planification',
                icon: 'CalendarClock',
                order: 50,
                children: [
                    {
                        label: 'Rendez-vous',
                        path: '/appointments',
                        icon: 'CalendarCheck',
                        order: 51,
                    },
                    {
                        label: 'Tâches',
                        path: '/tasks',
                        icon: 'CheckSquare',
                        order: 52,
                    },
                ],
            },
            {
                label: 'Communications',
                path: '/communications',
                icon: 'MessageSquare',
                order: 60,
            },
            {
                label: 'Documents',
                path: '/documents',
                icon: 'FileText',
                order: 70,
                children: [
                    {
                        label: 'Génération IA',
                        path: '/documents/generate',
                        icon: 'Sparkles',
                        order: 71,
                    },
                ],
            },
            {
                label: 'Marketing',
                path: '/marketing-dashboard',
                icon: 'TrendingUp',
                order: 80,
            },
            {
                label: 'Transactions',
                path: '/transactions-dashboard',
                icon: 'Handshake',
                order: 90,
            },
            {
                label: 'Analytics',
                path: '/analytics',
                icon: 'BarChart3',
                order: 100,
            },
            {
                label: 'Paramètres',
                path: '/settings',
                icon: 'Settings',
                order: 999,
                requiredRole: 'ADMIN',
            },
        ],
    },
];

async function syncMenuItem(moduleId: string, menu: MenuItemManifest, seenPaths: Set<string>, parentId?: string) {
    seenPaths.add(menu.path);

    const item = await prisma.dynamicMenuItem.upsert({
        where: {
            moduleId_path: {
                moduleId,
                path: menu.path,
            },
        },
        create: {
            moduleId,
            label: menu.label,
            icon: menu.icon,
            path: menu.path,
            order: menu.order ?? 0,
            requiredRole: menu.requiredRole,
            parentId,
        },
        update: {
            label: menu.label,
            icon: menu.icon,
            order: menu.order ?? 0,
            requiredRole: menu.requiredRole,
            parentId,
        },
    });

    if (menu.children && menu.children.length > 0) {
        for (const child of menu.children) {
            await syncMenuItem(moduleId, child, seenPaths, item.id);
        }
    }
}

async function main() {
    console.log('🚀 Enregistrement des modules de base...');

    const agency = await prisma.agencies.findFirst({
        orderBy: { createdAt: 'asc' },
    });

    if (!agency) {
        throw new Error('Aucune agence trouvée. Créez une agence avant de lancer le script.');
    }

    for (const manifest of modulesToRegister) {
        console.log(`\n📦 Module: ${manifest.code}`);

        const moduleRecord = await prisma.businessModule.upsert({
            where: { code: manifest.code },
            create: {
                code: manifest.code,
                name: manifest.name,
                description: manifest.description,
                version: manifest.version,
                status: 'ACTIVE',
                category: manifest.category,
                manifest: manifest as any,
                basePrice: 0,
                creditsIncluded: 0,
            },
            update: {
                name: manifest.name,
                description: manifest.description,
                version: manifest.version,
                status: 'ACTIVE',
                category: manifest.category,
                manifest: manifest as any,
                basePrice: 0,
                creditsIncluded: 0,
            },
        });

        console.log(`   ✅ Module synchronisé (ID: ${moduleRecord.id})`);

        const seenPaths = new Set<string>();

        for (const menu of manifest.menus) {
            await syncMenuItem(moduleRecord.id, menu, seenPaths);
        }

        // Supprimer les anciens menus qui ne sont plus dans le manifest
        await prisma.dynamicMenuItem.deleteMany({
            where: {
                moduleId: moduleRecord.id,
                path: {
                    notIn: Array.from(seenPaths),
                },
            },
        });

        await prisma.moduleAgencySubscription.upsert({
            where: {
                agencyId_moduleId: {
                    agencyId: agency.id,
                    moduleId: moduleRecord.id,
                },
            },
            create: {
                agencyId: agency.id,
                moduleId: moduleRecord.id,
                isActive: true,
            },
            update: {
                isActive: true,
            },
        });

        console.log(`   🔗 Module activé pour l'agence ${agency.name}`);
    }

    console.log('\n🎉 Modules de base enregistrés avec succès.');
}

main()
    .catch((error) => {
        console.error('❌ Erreur lors de l\'enregistrement des modules:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
