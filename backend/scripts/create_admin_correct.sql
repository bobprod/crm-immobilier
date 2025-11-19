-- Script SQL corrigé pour créer un utilisateur admin de test
-- Mot de passe : admin123 (hash bcrypt)

-- Suppression des données existantes si elles existent
DELETE FROM appointments WHERE "userId" = 'admin_test_001';
DELETE FROM prospects WHERE "userId" = 'admin_test_001';
DELETE FROM properties WHERE "userId" = 'admin_test_001';
DELETE FROM settings WHERE "userId" = 'admin_test_001';
DELETE FROM users WHERE id = 'admin_test_001';
DELETE FROM agencies WHERE id = 'agency_default_001';

-- Insertion de l'agence par défaut
INSERT INTO agencies (
    id,
    name,
    address,
    phone,
    email,
    "createdAt",
    "updatedAt"
) VALUES (
    'agency_default_001',
    'Agence Immobiliere CRM',
    '123 Rue de l Immobilier, 75000 Paris',
    '+33 1 23 45 67 89',
    'contact@agence-crm.com',
    NOW(),
    NOW()
);

-- Insertion de l'utilisateur admin
INSERT INTO users (
    id,
    email,
    password,
    "firstName",
    "lastName",
    role,
    "agencyId",
    "createdAt",
    "updatedAt"
) VALUES (
    'admin_test_001',
    'admin@crm.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- admin123
    'Admin',
    'CRM',
    'admin',
    'agency_default_001',
    NOW(),
    NOW()
);

-- Insertion des paramètres par défaut (structure correcte de la table settings)
INSERT INTO settings (
    id,
    "userId",
    section,
    key,
    value,
    type,
    "createdAt",
    "updatedAt"
) VALUES
(
    'settings_admin_001',
    'admin_test_001',
    'agency',
    'name',
    'Agence Immobiliere CRM',
    'string',
    NOW(),
    NOW()
),
(
    'settings_admin_002',
    'admin_test_001',
    'agency',
    'address',
    '123 Rue de l Immobilier, 75000 Paris',
    'string',
    NOW(),
    NOW()
),
(
    'settings_admin_003',
    'admin_test_001',
    'agency',
    'phone',
    '+33 1 23 45 67 89',
    'string',
    NOW(),
    NOW()
),
(
    'settings_admin_004',
    'admin_test_001',
    'agency',
    'email',
    'contact@agence-crm.com',
    'string',
    NOW(),
    NOW()
),
(
    'settings_admin_005',
    'admin_test_001',
    'app',
    'currency',
    'EUR',
    'string',
    NOW(),
    NOW()
),
(
    'settings_admin_006',
    'admin_test_001',
    'app',
    'language',
    'fr',
    'string',
    NOW(),
    NOW()
),
(
    'settings_admin_007',
    'admin_test_001',
    'app',
    'timezone',
    'Europe/Paris',
    'string',
    NOW(),
    NOW()
),
(
    'settings_admin_008',
    'admin_test_001',
    'app',
    'dateFormat',
    'DD/MM/YYYY',
    'string',
    NOW(),
    NOW()
),
(
    'settings_admin_009',
    'admin_test_001',
    'app',
    'timeFormat',
    'HH:mm',
    'string',
    NOW(),
    NOW()
);

-- Message de confirmation
SELECT '✅ Utilisateur admin cree avec succes !' as message;
SELECT '   Email: admin@crm.com' as message;
SELECT '   Mot de passe: admin123' as message;
SELECT '   URL: http://localhost:3001' as message;
SELECT '   Connectez-vous et commencez a utiliser le CRM !' as message;
