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
    // ════════════════════════════════════════════════════════════════
    // MODULE 1 : Suite CRM Immobilier (cœur métier)
    // ════════════════════════════════════════════════════════════════
    {
        code: 'core-suite',
        name: 'Suite CRM Immobilier',
        version: '1.1.0',
        category: 'BUSINESS',
        description: 'Module principal regroupant le portefeuille immobilier et les transactions.',
        menus: [
            {
                label: 'Tableau de bord',
                path: '/dashboard',
                icon: 'LayoutDashboard',
                order: 0,
            },
            // Portefeuille immobilier
            {
                label: 'Propriétés',
                path: '/properties',
                icon: 'Building2',
                order: 2,
            },
            {
                label: 'Propriétaires',
                path: '/owners',
                icon: 'UserCheck',
                order: 3,
            },
            {
                label: 'Mandats',
                path: '/mandates',
                icon: 'FileSignature',
                order: 4,
            },
            {
                label: 'Transactions',
                path: '/transactions-dashboard',
                icon: 'ArrowLeftRight',
                order: 5,
            },
            {
                label: 'Finance',
                path: '/finance',
                icon: 'DollarSign',
                order: 6,
            },
        ],
        permissions: ['properties:read', 'owners:read', 'mandates:read', 'transactions:read', 'finance:read'],
    },

    // ════════════════════════════════════════════════════════════════
    // MODULE 2 : Prospection & Vente
    // ════════════════════════════════════════════════════════════════
    {
        code: 'sales-suite',
        name: 'Prospection & Vente',
        version: '1.0.0',
        category: 'BUSINESS',
        description: 'Prospection IA, gestion des prospects et matching automatique.',
        menus: [
            {
                label: 'Prospection IA',
                path: '/prospection',
                icon: 'Bot',
                order: 10,
            },
            {
                label: 'Prospects',
                path: '/prospects',
                icon: 'Users',
                order: 11,
            },
            {
                label: 'Matching',
                path: '/matching',
                icon: 'Target',
                order: 12,
            },
        ],
        permissions: ['prospects:read', 'matching:read'],
    },

    // ════════════════════════════════════════════════════════════════
    // MODULE 3 : Planning & Tâches
    // ════════════════════════════════════════════════════════════════
    {
        code: 'planning-suite',
        name: 'Planning & Tâches',
        version: '1.0.0',
        category: 'BUSINESS',
        description: 'Gestion des rendez-vous, tâches et planification.',
        menus: [
            {
                label: 'Rendez-vous',
                path: '/appointments',
                icon: 'Calendar',
                order: 20,
            },
            {
                label: 'Tâches',
                path: '/tasks',
                icon: 'CheckSquare',
                order: 21,
            },
            {
                label: 'Planification',
                path: '/planification',
                icon: 'CalendarDays',
                order: 22,
            },
        ],
        permissions: ['appointments:read', 'tasks:read', 'planification:read'],
    },

    // ════════════════════════════════════════════════════════════════
    // MODULE 4 : Communications
    // ════════════════════════════════════════════════════════════════
    {
        code: 'communications-suite',
        name: 'Communications',
        version: '1.0.0',
        category: 'COMMUNICATION',
        description: 'Centre de communications multi-canaux et notifications.',
        menus: [
            {
                label: 'Communications',
                path: '/communications-dashboard',
                icon: 'MessageSquare',
                order: 30,
            },
            {
                label: 'Notifications',
                path: '/notifications',
                icon: 'Bell',
                order: 31,
            },
        ],
        permissions: ['communications:read', 'notifications:read'],
    },

    // ════════════════════════════════════════════════════════════════
    // MODULE 5 : Marketing & Analytiques
    // ════════════════════════════════════════════════════════════════
    {
        code: 'marketing-suite',
        name: 'Marketing & Analytiques',
        version: '1.0.0',
        category: 'MARKETING',
        description: 'Campagnes marketing, tracking, analytiques et outils IA.',
        menus: [
            {
                label: 'Marketing',
                path: '/marketing-dashboard',
                icon: 'TrendingUp',
                order: 40,
            },
            {
                label: 'Analytiques',
                path: '/analytics',
                icon: 'BarChart3',
                order: 41,
            },
            {
                label: 'Assistant IA',
                path: '/ai-assistant',
                icon: 'Bot',
                order: 42,
            },
            {
                label: 'SEO & IA',
                path: '/seo-ai',
                icon: 'Sparkles',
                order: 43,
            },
            {
                label: 'Investissement',
                path: '/investment',
                icon: 'LineChart',
                order: 44,
            },
        ],
        permissions: ['marketing:read', 'analytics:read', 'ai:read'],
    },

    // ════════════════════════════════════════════════════════════════
    // MODULE 6 : Opérations
    // ════════════════════════════════════════════════════════════════
    {
        code: 'operations-suite',
        name: 'Opérations',
        version: '1.0.0',
        category: 'BUSINESS',
        description: 'Documents, validation, scraping de données et intégrations.',
        menus: [
            {
                label: 'Documents',
                path: '/documents',
                icon: 'FileText',
                order: 50,
                children: [
                    {
                        label: 'Génération IA',
                        path: '/documents/generate',
                        icon: 'Sparkles',
                        order: 51,
                    },
                ],
            },
            {
                label: 'Validation',
                path: '/validation',
                icon: 'ShieldCheck',
                order: 52,
            },
            {
                label: 'Scraping',
                path: '/scraping',
                icon: 'Download',
                order: 53,
            },
            {
                label: 'Intégrations',
                path: '/integrations',
                icon: 'Puzzle',
                order: 54,
            },
        ],
        permissions: ['documents:read', 'validation:read', 'scraping:read', 'integrations:read'],
    },

    // ════════════════════════════════════════════════════════════════
    // MODULE 7 : Vitrine publique
    // ════════════════════════════════════════════════════════════════
    {
        code: 'public-vitrine',
        name: 'Vitrine Publique',
        version: '1.0.0',
        category: 'INTEGRATION',
        description: 'Site vitrine public, éditeur de pages et référencement.',
        menus: [
            {
                label: 'Vitrine',
                path: '/vitrine',
                icon: 'Globe',
                order: 60,
            },
        ],
        permissions: ['vitrine:read'],
    },

    // ════════════════════════════════════════════════════════════════
    // MODULE 8 : Administration
    // ════════════════════════════════════════════════════════════════
    {
        code: 'admin-suite',
        name: 'Administration',
        version: '1.0.0',
        category: 'BUSINESS',
        description: 'Gestion du personnel et des paramètres de l\'agence.',
        menus: [
            {
                label: 'Personnel',
                path: '/personnel',
                icon: 'Users',
                order: 80,
            },
            {
                label: 'Paramètres',
                path: '/settings',
                icon: 'Settings',
                order: 999,
                requiredRole: 'ADMIN',
            },
        ],
        permissions: ['personnel:read', 'settings:read'],
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
