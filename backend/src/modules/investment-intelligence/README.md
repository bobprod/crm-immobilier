# Investment Intelligence Module

Multi-platform investment project analysis and comparison system with AI-powered insights.

## 🎯 Overview

This module provides comprehensive investment analysis capabilities for real estate crowdfunding platforms across multiple countries and regions.

### Supported Platforms (50+)

#### France (7 platforms)
- **Bricks.co** ✅ (Dedicated adapter)
- **Homunity.com** ✅ (Dedicated adapter)
- Anaxago.com (Generic adapter)
- Fundimmo.com (Generic adapter)
- Lymo.fr (Generic adapter)
- Raizers.com (Generic adapter)
- Wiseed.com (Generic adapter)

#### Europe (8 platforms)
- Estateguru.co, Reinvest24.com, Crowdestate.eu
- PropertyPartner.co, CrowdProperty.com
- BrickOwner.com, Exporo.de, Rendity.com

#### USA (6 platforms)
- Fundrise, RealtyMogul, CrowdStreet
- PeerStreet, Roofstock, Arrived

#### Canada (3 platforms)
- Addy, Triovest, RealtyPRO

#### Latin America (5 platforms)
- Urba (Brazil), CrediHome (Brazil), Housers (Brazil)
- LaHaus (Colombia), Local platforms (Venezuela)

#### MENA (12 platforms)
- Tunisia, Morocco, Algeria, Egypt, UAE, Saudi Arabia, Qatar

#### Sub-Saharan Africa (4 platforms)
- Cameroon, Ivory Coast, Nigeria

### Features

✅ **Multi-Source Import** - Import projects from 50+ platforms
✅ **AI Analysis** - Automated SWOT analysis and scoring
✅ **Smart Comparison** - Compare up to 10 projects side-by-side
✅ **Intelligent Alerts** - Real-time notifications for matching opportunities
✅ **Unified Data Format** - Platform-agnostic storage
✅ **Extensible Architecture** - Easy to add new platforms

## 📂 Architecture

```
investment-intelligence/
├── adapters/                  # Platform-specific adapters
│   ├── base-source.adapter.ts    # Base adapter interface
│   ├── bricks.adapter.ts          # Bricks.co (France)
│   ├── homunity.adapter.ts        # Homunity (France)
│   └── generic.adapter.ts         # Fallback for all platforms
│
├── services/                  # Business logic
│   ├── adapter-registry.service.ts    # Adapter routing
│   ├── investment-import.service.ts   # Import management
│   ├── investment-analysis.service.ts # AI analysis
│   ├── investment-comparison.service.ts # Project comparison
│   └── investment-alert.service.ts    # Alert management
│
├── types/                     # TypeScript types
│   └── investment-project.types.ts
│
├── dto/                       # Data Transfer Objects
│   └── import-project.dto.ts
│
├── investment-intelligence.controller.ts  # REST API
├── investment-intelligence.module.ts      # Module definition
└── README.md                  # This file
```

## 🚀 API Endpoints

### Platform Detection

```bash
# Detect platform from URL
GET /api/investment-intelligence/detect?url=https://bricks.co/projets/residence-example
```

```bash
# List supported platforms
GET /api/investment-intelligence/platforms
```

### Import Projects

```bash
# Import single project
POST /api/investment-intelligence/import
{
  "url": "https://bricks.co/projets/residence-example",
  "analyzeImmediately": true
}
```

```bash
# Batch import
POST /api/investment-intelligence/import/batch
{
  "urls": [
    "https://bricks.co/projets/project-1",
    "https://homunity.com/projet/project-2"
  ]
}
```

```bash
# Sync existing project
POST /api/investment-intelligence/sync/:projectId
```

### List & Manage Projects

```bash
# List all projects
GET /api/investment-intelligence/projects

# Filter projects
GET /api/investment-intelligence/projects?country=France&minYield=8&status=active

# Get project details
GET /api/investment-intelligence/projects/:projectId

# Delete project
DELETE /api/investment-intelligence/projects/:projectId
```

### AI Analysis

```bash
# Analyze project
POST /api/investment-intelligence/analyze
{
  "projectId": "inv_123"
}
```

```bash
# Get analysis
GET /api/investment-intelligence/analyses/:projectId

# List all analyses
GET /api/investment-intelligence/analyses
```

### Comparison

```bash
# Compare projects
POST /api/investment-intelligence/compare
{
  "projectIds": ["inv_123", "inv_456", "inv_789"],
  "weights": {
    "yield": 0.3,
    "risk": 0.2,
    "location": 0.2,
    "liquidity": 0.15,
    "ticket": 0.1,
    "duration": 0.05
  },
  "name": "Paris vs Lyon comparison"
}
```

```bash
# Get comparison
GET /api/investment-intelligence/comparisons/:comparisonId

# List comparisons
GET /api/investment-intelligence/comparisons

# Delete comparison
DELETE /api/investment-intelligence/comparisons/:comparisonId
```

### Alerts

```bash
# Create alert
POST /api/investment-intelligence/alerts
{
  "name": "High yield France",
  "criteria": {
    "countries": ["France"],
    "minYield": 8,
    "maxTicket": 5000,
    "propertyTypes": ["residential"]
  },
  "notificationChannels": [
    {
      "type": "email",
      "config": { "email": "user@example.com" }
    }
  ],
  "frequency": "immediate"
}
```

```bash
# Update alert
PUT /api/investment-intelligence/alerts/:alertId
{
  "isActive": false
}

# List alerts
GET /api/investment-intelligence/alerts

# Delete alert
DELETE /api/investment-intelligence/alerts/:alertId
```

## 🔧 Adding a New Platform Adapter

### 1. Create Adapter File

```typescript
// adapters/anaxago.adapter.ts
import { Injectable } from '@nestjs/common';
import { BaseInvestmentSourceAdapter } from './base-source.adapter';

@Injectable()
export class AnaxagoAdapter extends BaseInvestmentSourceAdapter {
  readonly metadata = {
    name: 'AnaxagoAdapter',
    source: InvestmentProjectSource.anaxago,
    supportedCountries: ['France'],
    baseUrl: 'https://anaxago.com',
    // ...
  };

  canHandle(url: string): boolean {
    return url.includes('anaxago.com');
  }

  extractProjectId(url: string): string | null {
    // Implementation
  }

  async importFromUrl(url: string, context: ImportContext) {
    // Implementation
  }

  mapToUnifiedFormat(rawData: any): UnifiedProjectData {
    // Implementation
  }
}
```

### 2. Register in Module

```typescript
// investment-intelligence.module.ts
import { AnaxagoAdapter } from './adapters/anaxago.adapter';

@Module({
  providers: [
    // ...
    AnaxagoAdapter, // Add here
  ],
})
```

### 3. Register in AdapterRegistry

```typescript
// services/adapter-registry.service.ts
constructor(
  // ...
  private readonly anaxagoAdapter: AnaxagoAdapter,
) {
  this.adapters.push(this.anaxagoAdapter);
}
```

## 📊 Database Schema

### Tables Created

1. **investment_projects** - Project data
2. **investment_analyses** - AI analysis results
3. **investment_comparisons** - Comparison results
4. **investment_alerts** - User-defined alerts
5. **_InvestmentAlertMatches** - Junction table

### Apply Migration

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## 🧪 Testing

### Manual Testing

```bash
# 1. Import a project
curl -X POST http://localhost:3001/api/investment-intelligence/import \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://bricks.co/projets/example"}'

# 2. Analyze it
curl -X POST http://localhost:3001/api/investment-intelligence/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "inv_123"}'

# 3. Compare multiple projects
curl -X POST http://localhost:3001/api/investment-intelligence/compare \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectIds": ["inv_123", "inv_456"],
    "weights": {"yield": 0.4, "risk": 0.3, "location": 0.3}
  }'
```

## 🔐 Security

- JWT authentication required for all endpoints
- Tenant isolation enforced
- Rate limiting: 60 requests/minute
- Input validation with class-validator

## 📝 TODO

### Near-term
- [ ] Add more dedicated adapters (Anaxago, Fundimmo, Fundrise, etc.)
- [ ] Implement geocoding for addresses
- [ ] Add real-time scraping scheduler
- [ ] Implement email notifications
- [ ] Add webhook support for alerts

### Long-term
- [ ] Machine learning for yield prediction
- [ ] Sentiment analysis from project descriptions
- [ ] Risk scoring model
- [ ] Portfolio optimization recommendations
- [ ] Export to Excel/PDF reports

## 📚 Dependencies

- **NestJS** - Framework
- **Prisma** - ORM
- **Axios** - HTTP client
- **Cheerio** - HTML parsing
- **class-validator** - DTO validation
- **AI Orchestrator Module** - AI analysis

## 📄 License

Internal CRM module - Proprietary
