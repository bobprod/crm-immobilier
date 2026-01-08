# 🧪 GUIDE DE TEST - MULTI-PROVIDER

## Quick Start Test (2 minutes)

### Prérequis
- Backend running: `http://localhost:3001`
- Frontend running: `http://localhost:3000`
- User logged in
- SerpAPI ou Firecrawl key configurée (optionnel)

### Test 1: Frontend Page (Manual)

```
1. Ouvrir: http://localhost:3000/settings
2. Voir: "Stratégie des Providers" card
3. Cliquer: Sur la card
4. Atterrir: http://localhost:3000/settings/provider-strategy
5. Voir: Liste des providers avec ✅/❌
6. Sélectionner: Un provider pour recherche
7. Sélectionner: Un provider pour scraping
8. Cliquer: "Sauvegarder les préférences"
9. Voir: Message "Préférences de providers sauvegardées !"
10. ✅ TEST RÉUSSI
```

### Test 2: Backend API (Automated)

```bash
# Depuis la racine du projet
node test-provider-endpoints.js
```

**Outputs attendus:**
```
✅ Test 1: GET /providers/available - 200 OK
📦 Available Providers: 4
  ✅ serpapi (search)
  ✅ firecrawl (scraping)
  ✅ puppeteer (scraping)
  ✅ cheerio (scraping)

🎯 Current Strategy:
  Search: [providers available]
  Scrape: [providers available]

✅ Test 2: POST /providers/preferences - 201 Created
```

---

## Full Integration Test (10 minutes)

### Étape 1: Préparer les données

**Vérifier les APIs configurées:**
```bash
curl -X GET http://localhost:3001/api/ai-billing/api-keys/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: cmi57ycue0000w3vunopeduv6" \
  -H "X-Agency-Id: cmk5fdg2f0000v5qcmie0wjpn"
```

**Réponse attendue:**
```json
{
  "byok_keys": {
    "serpapi": { "configured": true, "value": "..." },
    "firecrawl": { "configured": true, "value": "..." }
  },
  "available_providers": {
    "serpapi": true,
    "firecrawl": true,
    "puppeteer": true,
    "cheerio": true
  }
}
```

### Étape 2: Tester GET /providers/available

```bash
curl -X GET http://localhost:3001/api/ai/orchestrate/providers/available \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: cmi57ycue0000w3vunopeduv6" \
  -H "X-Agency-Id: cmk5fdg2f0000v5qcmie0wjpn" \
  -H "Content-Type: application/json" | jq .
```

**Réponse attendue (200 OK):**
```json
{
  "available": [
    {
      "provider": "serpapi",
      "available": true,
      "requiresApiKey": true,
      "priority": 1,
      "description": "Google Search API for finding prospects",
      "tier": "search"
    },
    {
      "provider": "firecrawl",
      "available": true,
      "requiresApiKey": true,
      "priority": 2,
      "description": "Web scraping with AI",
      "tier": "scraping"
    },
    {
      "provider": "puppeteer",
      "available": true,
      "requiresApiKey": false,
      "priority": 3,
      "description": "Browser automation",
      "tier": "scraping"
    },
    {
      "provider": "cheerio",
      "available": true,
      "requiresApiKey": false,
      "priority": 4,
      "description": "HTML parser",
      "tier": "scraping"
    }
  ],
  "strategy": {
    "search": ["serpapi", "firecrawl"],
    "scrape": ["firecrawl", "puppeteer", "cheerio"]
  }
}
```

### Étape 3: Tester POST /providers/preferences

```bash
curl -X POST http://localhost:3001/api/ai/orchestrate/providers/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: cmi57ycue0000w3vunopeduv6" \
  -H "X-Agency-Id: cmk5fdg2f0000v5qcmie0wjpn" \
  -H "Content-Type: application/json" \
  -d '{
    "searchProviders": ["serpapi"],
    "scrapingProviders": ["firecrawl"],
    "autoFallback": true
  }' | jq .
```

**Réponse attendue (201 Created ou 200 OK):**
```json
{
  "success": true,
  "message": "Provider preferences saved successfully"
}
```

### Étape 4: Vérifier la sauvegarde

```bash
curl -X GET http://localhost:3001/api/ai/orchestrate/providers/available \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-User-Id: cmi57ycue0000w3vunopeduv6" \
  -H "X-Agency-Id: cmk5fdg2f0000v5qcmie0wjpn" | jq '.strategy'
```

**Réponse attendue:**
```json
{
  "search": ["serpapi"],
  "scrape": ["firecrawl"]
}
```

---

## Scenario-Based Testing

### Scenario 1: User with All APIs

**Setup:**
- SerpAPI key: Configured ✅
- Firecrawl key: Configured ✅
- Puppeteer: Built-in ✅
- Cheerio: Built-in ✅

**Expected Behavior:**
1. GET /providers/available returns all 4 providers as available
2. User can select any combination
3. POST preferences saves selection
4. Future prospecting uses selected providers

**Test:**
```bash
# Should show all 4 as available
curl -X GET http://localhost:3001/api/ai/orchestrate/providers/available ... | jq '.available | length'
# Expected: 4
```

### Scenario 2: User with No External APIs

**Setup:**
- SerpAPI key: NOT configured ❌
- Firecrawl key: NOT configured ❌
- Puppeteer: Built-in ✅
- Cheerio: Built-in ✅

**Expected Behavior:**
1. GET /providers/available returns only 2 providers (Puppeteer, Cheerio)
2. User cannot select SerpAPI or Firecrawl
3. System uses Puppeteer + Cheerio automatically

**Test:**
```bash
# Should show only 2 as available
curl -X GET http://localhost:3001/api/ai/orchestrate/providers/available ... | jq '.available | map(select(.available == true)) | length'
# Expected: 2
```

### Scenario 3: Partial Configuration

**Setup:**
- SerpAPI key: Configured ✅
- Firecrawl key: NOT configured ❌
- Puppeteer: Built-in ✅
- Cheerio: Built-in ✅

**Expected Behavior:**
1. GET /providers/available returns 3 available providers
2. User can select SerpAPI for search
3. Must choose Puppeteer or Cheerio for scraping (Firecrawl unavailable)
4. Fallback chain: SerpAPI for search, Puppeteer → Cheerio for scraping

**Test:**
```bash
# Setup: Remove Firecrawl key from database
# Then test:
curl -X GET http://localhost:3001/api/ai/orchestrate/providers/available ... | jq '.available | map(select(.available == true)) | length'
# Expected: 3
```

---

## Browser Developer Tools Testing

### Console Logs

Open DevTools (F12) → Console

**When page loads:**
```javascript
// Should see no errors
// Check Network tab for GET request
```

**When saving preferences:**
```javascript
// Should see successful POST response
// Status: 201 or 200
```

### Network Tab

1. Go to `/settings/provider-strategy`
2. Open Network tab
3. Click "Sauvegarder les préférences"
4. Check requests:
   - ✅ POST to `/api/ai/orchestrate/providers/preferences`
   - ✅ Status: 201 or 200
   - ✅ Response has `success: true`

### Application Tab (Storage)

1. No need to check - preferences stored server-side
2. (Future: Will be in database)

---

## Edge Cases Testing

### Edge Case 1: No Providers Available

**Setup:**
- Delete all API keys
- Puppeteer/Cheerio disabled (not realistic but test anyway)

**Expected:**
```
GET /providers/available
Returns: { available: [], strategy: {search: [], scrape: []} }
Frontend shows: "Aucun provider disponible"
```

### Edge Case 2: All Providers Available

**Setup:**
- All API keys configured

**Expected:**
```
GET /providers/available
Returns all 4 providers with available: true
```

### Edge Case 3: Preference Not Available Anymore

**Setup:**
1. User selects SerpAPI
2. Backend saves: {search: ["serpapi"]}
3. Later, user removes SerpAPI key

**Expected:**
```
Next GET /providers/available
Sees SerpAPI now has available: false
System cascades to next in fallback chain
```

---

## Performance Testing

### Load Test

```bash
# Test with 10 concurrent requests
for i in {1..10}; do
  curl -X GET http://localhost:3001/api/ai/orchestrate/providers/available \
    -H "X-User-Id: cmi57ycue0000w3vunopeduv6" \
    -H "X-Agency-Id: cmk5fdg2f0000v5qcmie0wjpn" &
done
wait
```

**Expected:**
- All requests succeed (200 OK)
- Response time < 100ms
- No memory leaks

---

## Debugging

### Enable Debug Logs

Add to `/backend/.env`:
```
DEBUG=true
LOG_LEVEL=debug
```

### Check ProviderSelectorService Logs

```bash
tail -f backend/logs/app.log | grep ProviderSelector
```

### Browser Network

1. F12 → Network
2. Filter by "orchestrate"
3. See requests/responses in real-time

---

## Rollback (if needed)

If something breaks:

```bash
# Reset database (NOT recommended in production)
npm run db:reset

# Just restart services
npm run dev
```

---

## Success Criteria

✅ **Test Passes When:**
- [x] Frontend page loads at /settings/provider-strategy
- [x] GET /providers/available returns 200 with providers list
- [x] POST /providers/preferences returns 201 with success
- [x] No console errors
- [x] No backend compilation errors
- [x] Response times acceptable
- [x] Providers correctly marked as available/unavailable
- [x] Preferences persist across page refresh

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| 404 on endpoint | Controller not registered | Restart backend |
| Empty providers list | ApiKeysService not working | Check ApiKeysService |
| "Preferences not saved" | DB not connected | Check DB connection |
| Slow response | N+1 queries | Check ProviderSelector logic |
| CORS error | Frontend/backend mismatch | Check headers |

---

## Test Checklist

### Before Deployment

- [ ] Frontend page displays correctly
- [ ] All 4 providers show in list (or expected number)
- [ ] Can select providers
- [ ] Can save preferences
- [ ] Success message displays
- [ ] Backend logs show no errors
- [ ] Response times < 100ms
- [ ] Works with different user IDs
- [ ] Works with different agency IDs
- [ ] Preferences persist on reload

### Performance

- [ ] GET /providers/available: < 50ms
- [ ] POST /providers/preferences: < 100ms
- [ ] Can handle 10+ concurrent requests
- [ ] No memory leaks after 100+ requests

### Edge Cases

- [ ] Works when no providers available
- [ ] Works when all providers available
- [ ] Fallback works if preferred unavailable
- [ ] Handles API key changes gracefully

---

## Final Test Command

**Run everything:**
```bash
node test-provider-endpoints.js && \
echo "✅ Backend tests passed" && \
curl -s http://localhost:3000/settings/provider-strategy | grep -q "provider-strategy" && \
echo "✅ Frontend page accessible" && \
echo "✅ ALL TESTS PASSED ✨"
```

---

**Ready to test? Let's go! 🚀**
