# Project Structure — CRM Immo Saas

```
Immo Saas/                          ← monorepo root
├── backend/                        ← NestJS API (Node.js)
│   ├── prisma/
│   │   ├── schema.prisma           ← 112 DB models (source of truth)
│   │   └── migrations/             ← auto-generated SQL migrations
│   ├── src/
│   │   ├── main.ts                 ← entry point, sets global prefix /api
│   │   ├── app.controller.ts
│   │   ├── config/
│   │   │   ├── database.config.ts  ← Prisma/Neon connection settings
│   │   │   └── jwt.config.ts       ← JWT secret & expiry registration
│   │   ├── shared/
│   │   │   └── database/
│   │   │       └── prisma.service.ts   ← global PrismaClient instance
│   │   └── modules/
│   │       ├── core/
│   │       │   └── auth/
│   │       │       ├── auth.controller.ts      ← /api/auth/*
│   │       │       ├── auth.service.ts
│   │       │       ├── auth.module.ts
│   │       │       ├── dto/                    ← LoginDto, RegisterDto, RefreshTokenDto
│   │       │       ├── guards/
│   │       │       │   ├── jwt-auth.guard.ts   ← USE THIS to protect routes
│   │       │       │   ├── google-auth.guard.ts
│   │       │       │   └── facebook-auth.guard.ts
│   │       │       └── strategies/
│   │       │           ├── jwt.strategy.ts     ← token validation logic
│   │       │           ├── google.strategy.ts
│   │       │           └── facebook.strategy.ts
│   │       ├── ai-billing/
│   │       │   ├── ai-credits.controller.ts
│   │       │   ├── ai-usage.controller.ts
│   │       │   └── api-keys.controller.ts
│   │       ├── business/
│   │       │   ├── appointments/
│   │       │   │   └── appointments.controller.ts
│   │       │   ├── finance/
│   │       │   │   ├── finance.controller.ts   ← commissions, invoices, payments
│   │       │   │   └── provision.controller.ts
│   │       │   ├── mandates/
│   │       │   │   └── mandates.controller.ts
│   │       │   ├── owners/
│   │       │   │   └── owners.controller.ts
│   │       │   ├── personnel/
│   │       │   │   └── personnel.controller.ts
│   │       │   ├── planning/
│   │       │   │   └── planning.controller.ts
│   │       │   ├── properties/
│   │       │   │   ├── properties.controller.ts
│   │       │   │   ├── properties.service.ts
│   │       │   │   └── dto/
│   │       │   ├── prospects/
│   │       │   │   ├── prospects.controller.ts
│   │       │   │   ├── prospects-enhanced.controller.ts
│   │       │   │   ├── prospect-enrichment.controller.ts
│   │       │   │   └── prospects-conversion-tracker.controller.ts
│   │       │   └── tasks/
│   │       │       └── tasks.controller.ts
│   │       ├── chat/
│   │       ├── communications/
│   │       │   ├── communications.controller.ts
│   │       │   ├── whatsapp/
│   │       │   ├── email-ai-response/
│   │       │   ├── analytics/
│   │       │   ├── campaigns/
│   │       │   └── contacts/
│   │       ├── content/
│   │       ├── dashboard/
│   │       ├── integrations/
│   │       ├── intelligence/
│   │       ├── investment-intelligence/
│   │       ├── marketing/
│   │       ├── notifications/
│   │       ├── prospecting/
│   │       ├── prospecting-ai/
│   │       ├── public/             ← Vitrine / public-facing routes
│   │       └── scraping/
│   ├── test/
│   ├── dist/                       ← compiled output (git-ignored)
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                        ← real secrets (git-ignored)
│   └── .env.example                ← template (committed to git)
│
├── frontend/                       ← Next.js 16 / React 19
│   ├── src/
│   │   ├── pages/                  ← Next.js Pages Router
│   │   │   ├── dashboard/
│   │   │   ├── analytics/
│   │   │   ├── intelligence/
│   │   │   └── personnel/
│   │   ├── modules/                ← feature-level components
│   │   ├── components/             ← shared UI components
│   │   ├── lib/                    ← utilities, API client, helpers
│   │   ├── shared/                 ← layout, providers
│   │   └── locales/                ← i18n (fr, ar, en)
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── docs/
│   └── integration/                ← ← THIS FOLDER (invoice module docs)
├── scripts/
├── docker-compose.test.yml
├── package.json                    ← root (minimal, monorepo tooling)
└── launcher.mjs                    ← dev launcher (starts both servers)
```

---

## Where to Add the Invoice Module

The invoice module should be placed at:

```
backend/src/modules/business/invoices/
├── invoices.module.ts
├── invoices.controller.ts    ← /api/invoices/*
├── invoices.service.ts
└── dto/
    ├── create-invoice.dto.ts
    └── update-invoice.dto.ts
```

Then register it in `backend/src/app.module.ts` under the `imports` array.

---

## Key File Locations

| What | Where |
|------|-------|
| JWT Guard (import this) | `src/modules/core/auth/guards/jwt-auth.guard.ts` |
| Prisma Service (import this) | `src/shared/database/prisma.service.ts` |
| Global API prefix | `src/main.ts` → `app.setGlobalPrefix('api')` |
| Database schema | `prisma/schema.prisma` |
| Run migrations | `npm run prisma:migrate:dev` |
| Swagger UI | `http://localhost:3000/api/docs` (dev) |
