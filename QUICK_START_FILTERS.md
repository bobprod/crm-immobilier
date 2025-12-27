# Quick Start: Testing Property Filters

## Step 1: Start the Development Server

```bash
cd frontend
npm run dev
```

Wait for the message: `Local: http://localhost:3000`

## Step 2: Run Filter Tests

In a new terminal:

```bash
cd frontend

# Quick verification that testMode fix works
npm run test:e2e -- verify-testmode-fix.spec.ts

# After verification passes, run full filter test suite
npm run test:e2e -- filter-tests-final.spec.ts
```

## Step 3: Review Test Results

```bash
# Open HTML report
npx playwright show-report
```

## Manual Testing (Optional)

Open browser and go to: http://localhost:3000/properties?testMode=true

You should see:
- ✅ Properties table with 3 mock properties
- ✅ Filter inputs (search, type, status, priority, price)
- ✅ Reset button
- ✅ NO redirect to login

## What Each Test File Tests

### verify-testmode-fix.spec.ts (Quick - ~30 seconds)
- ✅ testMode prevents redirect
- ✅ Mock properties are loaded
- ✅ Page displays correctly

### filter-tests-final.spec.ts (Comprehensive - ~2 minutes)
1. Mock properties load
2. Search filter works
3. Type filter renders
4. Status filter exists
5. Price filters render
6. Reset button works
7. Table displays correctly
8. No console errors
9. Filter values can be set
10. Multiple filters combine

### filter-test-simple.spec.ts (Alternative)
- 10 independent tests
- Each tests one filter aspect
- Good for isolating issues

## Expected Output

```
Running 1 test using 1 worker

✓ [chromium] › verify-testmode-fix.spec.ts (0.5s)
  VERIFY: testMode=true prevents auth redirect

1 passed (0.5s)
```

After verification passes:

```
Running 10 tests using 2 workers

✓ [chromium] › filter-tests-final.spec.ts (5.0s)
  1. Page loads with mock properties
✓ [chromium] › filter-tests-final.spec.ts (3.0s)
  2. Search filter works
✓ [chromium] › filter-tests-final.spec.ts (2.5s)
  3. Type filter renders
... (7 more tests)

10 passed (25.0s)
```

## If Tests Fail

### Failed: "Page redirected to login"
- ✅ Solution: The fix hasn't taken effect
- Try: `rm -rf .next` (clear build cache)
- Try: Restart dev server with Ctrl+C then `npm run dev`

### Failed: "Property rows not found"
- ✅ This is a real filter bug
- Check: Does page load at all?
- Try: Manual test at browser `http://localhost:3000/properties?testMode=true`

### Failed: "Filter elements not found"
- ✅ This means filter UI isn't rendering
- Check: PropertyFilters component imports
- Try: Look at browser DevTools Elements tab

## Commands Quick Reference

```bash
# Development
cd frontend
npm run dev                    # Start dev server

# Testing
npm run test:e2e              # Run all e2e tests
npm run test:e2e verify-*.ts  # Quick verification
npm run test:e2e filter-*.ts  # Full filter tests

# Utilities
npm run build                 # Build for production
npm run build:analyze         # Analyze bundle size
npx playwright show-report    # View test HTML report

# Cache clearing (if needed)
rm -rf .next                  # Clear Next.js cache
rm -rf node_modules           # Full reinstall
npm install                   # Reinstall deps
```

## What's Being Tested

**Filter Functionality:**
- Search input field
- Type dropdown (House, Apartment, Villa, etc.)
- Status dropdown (For Sale, For Rent, Sold, etc.)
- Priority field
- Price range (Min/Max price inputs)
- Reset button
- Multiple filters combined

**UI Responsiveness:**
- Filter elements render without errors
- Page doesn't crash when filters are clicked
- Values can be set and read
- No JavaScript console errors

**Authentication Bypass:**
- testMode=true prevents redirect to /login
- Mock data loads when testMode enabled
- Normal authentication flow still works without testMode

## Success Criteria

✅ **All 11 tests pass** (1 verification + 10 comprehensive)
✅ **No redirect to /login**
✅ **Table displays 3 mock properties**
✅ **All filter elements are accessible**
✅ **Can set and read filter values**
✅ **No critical JavaScript errors**

## Next Steps After Tests Pass

1. Review filter logic in PropertyFilters.tsx
2. Check PropertyList.tsx for filter application
3. Review API call in propertiesAPI.ts
4. Identify any filter-related bugs
5. Fix identified issues
6. Re-run tests to verify fixes
7. Deploy to production

## Support Files

- **FILTER_TESTING_GUIDE.md** - Detailed testing documentation
- **FILTER_TESTING_SUMMARY.md** - Technical implementation details
- **tests/verify-testmode-fix.spec.ts** - Quick verification
- **tests/filter-tests-final.spec.ts** - Comprehensive tests
- **tests/filter-test-simple.spec.ts** - Simplified tests

## Important URLs

- **Test Page**: http://localhost:3000/properties?testMode=true
- **Normal App**: http://localhost:3000/properties (requires login)
- **Test Reports**: View after running `npx playwright show-report`
