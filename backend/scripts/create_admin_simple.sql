-- Script SQL simplifié pour créer un utilisateur admin de test
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

-- Insertion des paramètres par défaut
INSERT INTO settings (
    id,
    "userId",
    "agencyName",
    "agencyAddress",
    "agencyPhone",
    "agencyEmail",
    currency,
    language,
    timezone,
    "dateFormat",
    "timeFormat",
    "createdAt",
    "updatedAt"
) VALUES (
    'settings_admin_001',
    'admin_test_001',
    'Agence Immobiliere CRM',
    '123 Rue de l Immobilier, 75000 Paris',
    '+33 1 23 45 67 89',
    'contact@agence-crm.com',
    'EUR',
    'fr',
    'Europe/Paris',
    'DD/MM/YYYY',
    'HH:mm',
    NOW(),
    NOW()
);

-- Message de confirmation
SELECT '✅ Utilisateur admin cree avec succes !' as message;
SELECT '   Email: admin@crm.com' as message;
SELECT '   Mot de passe: admin123' as message;
SELECT '   URL: http://localhost:3001' as message;
SELECT '   Connectez-vous et commencez a utiliser le CRM !' as message;
