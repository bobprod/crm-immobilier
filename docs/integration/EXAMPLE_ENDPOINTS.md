# Example API Endpoints — CRM Immo Saas

> Working route examples for the invoice module developer

All routes are prefixed with `/api` (configured in `backend/src/main.ts`).

---

## 1. GET /api/auth/me — Current User Profile

**File:** `backend/src/modules/core/auth/auth.controller.ts`

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get current user profile' })
async getProfile(@Request() req) {
  return this.authService.validateUser(req.user.userId);
}
```

**Request:**
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
```

**Response:**
```json
{
  "id":        "clx2k9q0e0000abc12345wxyz",
  "email":     "agent@agence.com",
  "firstName": "Jean",
  "lastName":  "Dupont",
  "role":      "AGENT",
  "agencyId":  "clx9abc0e0000xyz99999aaaa",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 2. POST /api/auth/login — Login

**File:** `backend/src/modules/core/auth/auth.controller.ts`

```typescript
@Post('login')
@HttpCode(HttpStatus.OK)
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto.email, loginDto.password);
}
```

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "agent@agence.com",
  "password": "MyPassword123"
}
```

**Response:**
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

## 3. POST /api/properties — Create Property

**File:** `backend/src/modules/business/properties/properties.controller.ts`

```typescript
@Post()
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Create property' })
create(@Request() req, @Body() createPropertyDto: CreatePropertyDto) {
  return this.propertiesService.create(req.user.userId, createPropertyDto);
}
```

**Request:**
```http
POST /api/properties
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
Content-Type: application/json

{
  "title":    "Appartement 3 pièces - Paris 15ème",
  "type":     "apartment",
  "price":    350000,
  "currency": "EUR",
  "city":     "Paris",
  "address":  "12 rue de la Paix"
}
```

---

## 4. GET /api/properties — List Properties (with filters)

**File:** `backend/src/modules/business/properties/properties.controller.ts`

```typescript
@Get()
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get all properties with filters' })
findAll(@Request() req, @Query() filters: any) {
  return this.propertiesService.findAll(req.user.userId, filters);
}
```

**Request:**
```http
GET /api/properties?type=apartment&city=Paris&minPrice=100000&maxPrice=500000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
```

---

## 5. GET /api/properties/stats — Property Statistics (cached)

```typescript
@Get('stats')
@UseInterceptors(CacheInterceptor)
@UseGuards(JwtAuthGuard)
getStats(@Request() req) {
  return this.propertiesService.getStats(req.user.userId);
}
```

---

## Template: Invoice Module Endpoint Pattern

Follow this exact pattern when building invoice endpoints:

```typescript
// backend/src/modules/business/invoices/invoices.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)          // ← protects ALL routes in this controller
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create invoice' })
  create(@Request() req, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices for current user' })
  findAll(@Request() req, @Query() filters: any) {
    return this.invoicesService.findAll(req.user.userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.invoicesService.findOne(req.user.userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update invoice' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoice' })
  remove(@Request() req, @Param('id') id: string) {
    return this.invoicesService.remove(req.user.userId, id);
  }
}
```

---

## Key Patterns to Follow

| Pattern | How It's Done |
|---------|---------------|
| Auth guard | `@UseGuards(JwtAuthGuard)` on controller class or method |
| Get current user ID | `req.user.userId` |
| Get current user role | `req.user.role` |
| Swagger docs | `@ApiTags(...)`, `@ApiOperation(...)`, `@ApiBearerAuth()` |
| Input validation | Use `class-validator` DTOs with `@IsString()`, `@IsNumber()`, etc. |
| API prefix | All routes are under `/api/` (set in `main.ts`) |
