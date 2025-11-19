-- Script SQL pour créer un utilisateur admin de test
-- Mot de passe : admin123 (hash bcrypt)

-- Insertion de l'utilisateur admin
INSERT INTO users (
    id,
    email,
    password,
    "firstName",
    "lastName",
    role,
    "createdAt",
    "updatedAt"
) VALUES (
    'admin_test_001',
    'admin@crm.com',
    '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- admin123
    'Admin',
    'CRM',
    'admin',
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
    "currency",
    "language",
    "timezone",
    "dateFormat",
    "timeFormat",
    "createdAt",
    "updatedAt"
) VALUES (
    'settings_admin_001',
    'admin_test_001',
    'Agence Immobilière CRM',
    '123 Rue de l\'Immobilier, 75000 Paris',
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

-- Insertion d'une agence par défaut
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
    'Agence Immobilière CRM',
    '123 Rue de l\'Immobilier, 75000 Paris',
    '+33 1 23 45 67 89',
    'contact@agence-crm.com',
    NOW(),
    NOW()
);

-- Mise à jour de l'utilisateur avec l'ID de l'agence
UPDATE users
SET "agencyId" = 'agency_default_001'
WHERE id = 'admin_test_001';

-- Insertion de quelques biens de test
INSERT INTO properties (
    id,
    "userId",
    "agencyId",
    title,
    description,
    type,
    category,
    price,
    currency,
    address,
    city,
    "zipCode",
    bedrooms,
    bathrooms,
    area,
    status,
    "viewsCount",
    "createdAt",
    "updatedAt"
) VALUES
(
    'property_test_001',
    'admin_test_001',
    'agency_default_001',
    'Appartement T3 lumineux avec balcon',
    'Bel appartement de 75m² situé au 3ème étage avec ascenseur. Comprend 2 chambres, salon spacieux, cuisine équipée, salle de bain avec baignoire. Balcon de 8m² exposé sud.',
    'apartment',
    'sale',
    285000,
    'EUR',
    '123 Rue de la Paix',
    'Paris',
    '75000',
    2,
    1,
    75,
    'available',
    0,
    NOW(),
    NOW()
),
(
    'property_test_002',
    'admin_test_001',
    'agency_default_001',
    'Maison individuelle avec jardin',
    'Charmante maison de 120m² sur 500m² de terrain. 3 chambres, cuisine américaine, salon-salle à manger de 40m², 2 salles de bain. Garage et cave. Proche commodités.',
    'house',
    'sale',
    425000,
    'EUR',
    '456 Avenue des Champs',
    'Lyon',
    '69000',
    3,
    2,
    120,
    'available',
    0,
    NOW(),
    NOW()
);

-- Insertion de quelques prospects de test
INSERT INTO prospects (
    id,
    "userId",
    "agencyId",
    "firstName",
    "lastName",
    email,
    phone,
    type,
    currency,
    status,
    score,
    "createdAt",
    "updatedAt"
) VALUES
(
    'prospect_test_001',
    'admin_test_001',
    'agency_default_001',
    'Jean',
    'Dupont',
    'jean.dupont@email.com',
    '+33 6 12 34 56 78',
    'buyer',
    'EUR',
    'active',
    85,
    NOW(),
    NOW()
),
(
    'prospect_test_002',
    'admin_test_001',
    'agency_default_001',
    'Marie',
    'Martin',
    'marie.martin@email.com',
    '+33 6 98 76 54 32',
    'seller',
    'EUR',
    'active',
    75,
    NOW(),
    NOW()
);

-- Insertion de quelques rendez-vous de test
INSERT INTO appointments (
    id,
    "userId",
    "propertyId",
    "prospectId",
    title,
    description,
    "startTime",
    "endTime",
    type,
    status,
    "createdAt",
    "updatedAt"
) VALUES
(
    'appointment_test_001',
    'admin_test_001',
    'property_test_001',
    'prospect_test_001',
    'Visite appartement T3',
    'Première visite de l''appartement avec le client',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '1 hour',
    'visit',
    'scheduled',
    NOW(),
    NOW()
);

-- Message de confirmation
SELECT '✅ Utilisateur admin cree avec succes !' as message;
SELECT '   Email: admin@crm.com' as message;
SELECT '   Mot de passe: admin123' as message;
SELECT '   URL: http://localhost:3001' as message;
SELECT '   Connectez-vous et commencez a utiliser le CRM !' as message;
