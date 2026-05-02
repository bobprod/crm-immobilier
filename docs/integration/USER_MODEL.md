# User Model — CRM Immo Saas

**Source of truth:** `backend/prisma/schema.prisma` → `model users`

---

## Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String (CUID) | Yes | auto | Primary key |
| `email` | String | Yes | — | Unique, normalized to lowercase |
| `password` | String | Yes | — | bcrypt hash (10 rounds) |
| `firstName` | String | No | null | |
| `lastName` | String | No | null | |
| `agencyId` | String | No | null | FK → `agencies.id` (tenant ID) |
| `role` | UserRole enum | Yes | `AGENT` | ADMIN \| AGENT \| MANAGER |
| `wordpressPassword` | String | No | null | WordPress integration |
| `wordpressUrl` | String | No | null | WordPress integration |
| `wordpressUsername` | String | No | null | WordPress integration |
| `createdAt` | DateTime | Yes | now() | |
| `updatedAt` | DateTime | Yes | auto | |

---

## Role Enum

```
ADMIN    — Full access, can see all agency data
AGENT    — Standard real estate agent, sees own data
MANAGER  — Agency manager, elevated permissions
```

---

## Prisma Schema Definition

```prisma
model users {
  id                String    @id @default(cuid())
  email             String    @unique
  password          String
  firstName         String?
  lastName          String?
  agencyId          String?
  role              UserRole  @default(AGENT)
  wordpressPassword String?
  wordpressUrl      String?
  wordpressUsername String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Multi-tenant relationship
  agencies          agencies? @relation(fields: [agencyId], references: [id])

  // Finance relations (relevant to invoice module)
  invoices          Invoice[]          @relation("UserInvoices")
  payments          Payment[]          @relation("UserPayments")
  transactions      Transaction[]      @relation("UserTransactions")
  commissions       Commission[]       @relation("UserCommissions")

  // ... 40+ other relations (properties, prospects, tasks, etc.)
}

enum UserRole {
  ADMIN
  AGENT
  MANAGER
}
```

---

## Key Relationships for Invoice Module

| Relation | Type | Description |
|----------|------|-------------|
| `agencies` | Many-to-one | The agency this user belongs to (tenant) |
| `invoices` | One-to-many | Invoices created by this user |
| `payments` | One-to-many | Payments associated with this user |
| `transactions` | One-to-many | Financial transactions |
| `commissions` | One-to-many | Commission records |

---

## Querying Users

```typescript
// Get user with agency (tenant info)
const user = await prisma.users.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    agencyId: true,
    agencies: {
      select: { id: true, name: true, email: true }
    }
  }
});

// Get user's invoices
const userWithInvoices = await prisma.users.findUnique({
  where: { id: userId },
  include: { invoices: true }
});

// Find by email (for auth)
const user = await prisma.users.findUnique({
  where: { email: email.toLowerCase().trim() }
});
```

---

## Validation Notes

- Email is **always normalized** to `lowercase().trim()` before storage and lookup
- Passwords are **never returned** in API responses — strip with `const { password: _, ...safe } = user`
- The `agencyId` field is the **tenant discriminator** — always include it when scoping invoice queries
- No `phone`, `avatar`, or `status` fields exist on `users` directly — these may be on related models
