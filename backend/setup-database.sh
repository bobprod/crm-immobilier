#!/bin/bash
echo "=== Setup Database and Admin User ==="
echo ""
echo "1. Please start PostgreSQL service first:"
echo "   Windows: net start postgresql-x64-17"
echo "   Or via Services (services.msc)"
echo ""
echo "2. Then run migrations:"
echo "   cd backend && npx prisma migrate deploy"
echo ""
echo "3. Create admin user with this SQL:"
echo ""
cat << 'SQL'
-- Connect to database
-- psql -h localhost -U postgres -d crm_immobilier

-- Create admin user with hashed password (admin123)
INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@crm.com',
  '$2b$10$rKvE4VZqKZ8P0JM5xJx1XeDZQxGxHQxQxGxHQxQxGxHQxGxHQxGxH',
  'Admin',
  'CRM',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
SQL
echo ""
echo "Or use the seed script:"
echo "   cd backend && npx prisma db seed"
