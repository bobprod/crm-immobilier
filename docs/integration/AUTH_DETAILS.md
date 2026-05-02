# Authentication Details — CRM Immo Saas

> For the invoice module integration developer

---

## Auth Method

**JWT Bearer Tokens** via Passport.js (NestJS framework).

| Feature | Value |
|---------|-------|
| Framework | NestJS v10 + Passport.js |
| Strategy | `passport-jwt` (Bearer token from Authorization header) |
| Password hashing | `bcrypt` with salt rounds = 10 |
| OAuth providers | Google OAuth 2.0, Facebook Login |
| Refresh tokens | Yes — separate secret and expiry |

---

## JWT Payload Structure

```json
{
  "sub": "clx2k9q0e0000abc12345wxyz",   // user ID (CUID string)
  "email": "agent@agence.com",
  "role": "AGENT",                        // ADMIN | AGENT | MANAGER
  "iat": 1710000000,                      // issued-at (Unix timestamp)
  "exp": 1710604800                       // expiry (Unix timestamp)
}
```

**Refresh token payload:**
```json
{
  "sub": "clx2k9q0e0000abc12345wxyz",
  "type": "refresh",
  "iat": 1710000000,
  "exp": 1712592800
}
```

---

## JWT Configuration

| Variable | Location | Example |
|----------|----------|---------|
| `JWT_SECRET` | `backend/.env` | `your-super-secret-jwt-key-...` |
| `JWT_EXPIRES_IN` | `backend/.env` | `7d` |
| `JWT_REFRESH_SECRET` | `backend/.env` | `your-super-secret-refresh-key-...` |
| `JWT_REFRESH_EXPIRES_IN` | `backend/.env` | `30d` |

**Config file:** `backend/src/config/jwt.config.ts`
**Strategy file:** `backend/src/modules/core/auth/strategies/jwt.strategy.ts`

---

## Token Extraction

Tokens are extracted from the **`Authorization`** HTTP header:

```
Authorization: Bearer <access_token>
```

Source (`jwt.strategy.ts`):
```typescript
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
```

---

## Token Validation — How It Works

1. Request arrives with `Authorization: Bearer <token>`
2. `JwtAuthGuard` triggers `JwtStrategy.validate(payload)`
3. Strategy verifies signature against `JWT_SECRET`; rejects expired tokens
4. On success, NestJS injects the decoded payload into `req.user`:
   ```typescript
   req.user = {
     sub:    "clx2k9q0e0000abc12345wxyz",
     userId: "clx2k9q0e0000abc12345wxyz",  // alias of sub
     email:  "agent@agence.com",
     role:   "AGENT"
   }
   ```

**Guard file:** `backend/src/modules/core/auth/guards/jwt-auth.guard.ts`

---

## Protecting a Route (Usage Example)

```typescript
import { UseGuards, Request, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@Get('my-invoices')
@UseGuards(JwtAuthGuard)            // ← add this decorator
async getMyInvoices(@Request() req) {
  const userId = req.user.userId;   // ← read authenticated user ID
  const role   = req.user.role;
  // ...
}
```

---

## Auth Endpoints Summary

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| POST | `/api/auth/register` | No | Create new user |
| POST | `/api/auth/login` | No | Returns `accessToken` + `refreshToken` |
| POST | `/api/auth/refresh` | No | Exchange refresh token for new access token |
| GET | `/api/auth/me` | Yes | Returns current user profile |
| POST | `/api/auth/logout` | Yes | Invalidate session |
| GET | `/api/auth/google` | No | Redirect to Google OAuth |
| GET | `/api/auth/facebook` | No | Redirect to Facebook OAuth |

### Login Response Example

```json
{
  "accessToken":  "eyJhbGciOiJIUzI1NiIsInR...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id":        "clx2k9q0e0000abc12345wxyz",
    "email":     "agent@agence.com",
    "firstName": "Jean",
    "lastName":  "Dupont",
    "role":      "AGENT",
    "agencyId":  "clx9abc0e0000xyz99999aaaa"
  }
}
```

---

## For the Invoice Module

- **Always** protect invoice endpoints with `@UseGuards(JwtAuthGuard)`
- Use `req.user.userId` to scope data to the authenticated user
- Use `req.user.role` for role-based access control (ADMIN can see all; AGENT sees own)
- The `agencyId` is on the user record in the database — fetch it via `PrismaService` when needed for tenant isolation:
  ```typescript
  const user = await this.prisma.users.findUnique({ where: { id: req.user.userId } });
  const agencyId = user.agencyId;
  ```
