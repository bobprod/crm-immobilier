# Prospects Module - API Documentation

## New Endpoints Added

### 1. Soft Delete & Trash Management

#### GET /prospects/trashed
Get all soft-deleted prospects for the authenticated user.

**Response:**
```json
[
  {
    "id": "clxxx",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "deletedAt": "2024-12-22T10:00:00Z",
    ...
  }
]
```

#### PATCH /prospects/:id/restore
Restore a soft-deleted prospect.

**Response:**
```json
{
  "id": "clxxx",
  "firstName": "John",
  "lastName": "Doe",
  "deletedAt": null,
  ...
}
```

#### DELETE /prospects/:id/permanent
Permanently delete a prospect (hard delete). This action is irreversible.

**Response:**
```json
{
  "id": "clxxx",
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

### 2. Pagination

#### GET /prospects/paginated
Get prospects with cursor-based pagination.

**Query Parameters:**
- `cursor` (optional): Cursor for pagination
- `limit` (optional): Number of items per page (default: 20, max: 100)
- `type` (optional): Filter by prospect type
- `status` (optional): Filter by status
- `minBudget` (optional): Minimum budget filter
- `maxBudget` (optional): Maximum budget filter

**Response:**
```json
{
  "items": [...],
  "nextCursor": "clyyy",
  "hasNextPage": true,
  "total": 150
}
```

### 3. Search

#### GET /prospects/search
Full-text search across prospects.

**Query Parameters:**
- `q` (required): Search query

**Response:**
```json
[
  {
    "id": "clxxx",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    ...
  }
]
```

Searches in:
- First name
- Last name
- Email
- Phone
- Notes

### 4. Statistics

#### GET /prospects/stats
Get advanced statistics about prospects.

**Response:**
```json
{
  "total": 150,
  "active": 80,
  "converted": 20,
  "qualified": 30,
  "rejected": 20,
  "avgScore": 65.5,
  "conversionRate": 13.33,
  "byType": {
    "buyer": 80,
    "seller": 40,
    "tenant": 20,
    "owner": 10
  },
  "bySource": {
    "website": 60,
    "referral": 40,
    "social": 30,
    "other": 20
  }
}
```

### 5. Export

#### GET /prospects/export/csv
Export prospects to CSV file.

**Query Parameters:**
- `type` (optional): Filter by prospect type
- `status` (optional): Filter by status
- `minBudget` (optional): Minimum budget filter
- `maxBudget` (optional): Maximum budget filter

**Response:**
CSV file download with headers:
- ID
- Prénom
- Nom
- Email
- Téléphone
- Type
- Statut
- Score
- Source
- Budget
- Créé le
- Mis à jour le

### 6. Enhanced GET Endpoint

#### GET /prospects/:id
Get a single prospect with optional includes.

**Query Parameters:**
- `include` (optional): Comma-separated list of relations to include
  - `matches`: Include property matches
  - `appointments`: Include appointments
  - `interactions`: Include interactions
  - `timeline`: Include timeline stages
  - `preferences`: Include preferences details
  - `documents`: Include documents
  - `tasks`: Include tasks
  - `communications`: Include communications

**Example:**
```
GET /prospects/clxxx?include=matches,appointments,interactions
```

**Response:**
```json
{
  "id": "clxxx",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "matches": [...],
  "appointments": [...],
  "interactions": [...],
  ...
}
```

## Features Implemented

### 1. ✅ Soft Delete
- Prospects are now soft-deleted by default (deletedAt timestamp)
- All queries filter out deleted prospects automatically
- Can restore or permanently delete prospects

### 2. ✅ History Tracking
- All changes to prospects are logged in prospect_history table
- Tracks: created, updated, deleted, restored actions
- Includes old and new values for audit trail

### 3. ✅ Automatic Scoring
- Prospects receive an automatic score (0-100) on creation/update
- Scoring criteria:
  - Email: 20 points
  - Phone: 20 points
  - Budget: 30 points
  - Preferences: 10 points
  - Name (first + last): 10 points
  - Source: 5 points
  - Notes: 5 points

### 4. ✅ Cursor-Based Pagination
- Efficient pagination for large datasets
- Returns items, nextCursor, hasNextPage, and total count
- Default limit: 20 items per page (max: 100)

### 5. ✅ Full-Text Search
- Search across multiple fields simultaneously
- Case-insensitive search
- Returns all matching prospects

### 6. ✅ Advanced Statistics
- Comprehensive stats including conversion rates
- Breakdown by type and source
- Average score calculation

### 7. ✅ CSV Export
- Export filtered prospects to CSV
- Includes all main prospect fields
- Formatted for Excel/Google Sheets

## Frontend Integration

### Hooks

#### useInfiniteProspects
Custom React hook for infinite scroll pagination.

```typescript
import { useInfiniteProspects } from '@/shared/hooks/useInfiniteProspects';

function ProspectList() {
  const { prospects, loadMore, hasMore, loading, error } = useInfiniteProspects();
  
  return (
    <div>
      {prospects.map(p => <ProspectCard key={p.id} prospect={p} />)}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

### API Methods

All new methods added to `prospectsAPI`:
- `getPaginated(cursor, limit, filters)`
- `getTrashed()`
- `restore(id)`
- `permanentDelete(id)`
- `search(query)`
- `getStats()`
- `exportCSV(filters)`

## E2E Tests

### prospect-crud.spec.ts
Tests for:
- Creating a prospect
- Updating a prospect
- Deleting a prospect (with confirmation)

### prospect-interactions.spec.ts
Tests for:
- Adding an interaction to a prospect

## Database Schema Changes

### prospects table
- Added `deletedAt` column (nullable DateTime)
- Added index on `deletedAt`

### prospect_history table (new)
- `id`: Primary key
- `prospectId`: Foreign key to prospects
- `userId`: Foreign key to users
- `action`: Type of action (created, updated, deleted, etc.)
- `changes`: JSON with old/new values
- `metadata`: Optional additional info
- `createdAt`: Timestamp

Indexes on: prospectId, userId, action, createdAt

## Migration

To apply the database changes:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

Or manually run the migration SQL:
`backend/prisma/migrations/20251222212308_add_soft_delete_and_history_to_prospects/migration.sql`
