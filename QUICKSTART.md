# 🚀 Quick Start - Testing Property CRUD with Playwright

## ⚡ Fastest Way to Test

### Windows:
```cmd
cd frontend
run-tests.bat
```

### Linux/Mac:
```bash
cd frontend
./run-tests-with-check.sh
```

The scripts will:
- ✅ Check if frontend is running (port 3000)
- ✅ Check if backend is running (port 3001)
- ✅ Run all 6 Playwright tests
- ✅ Show results

---

## 🔧 Setup (First Time Only)

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   npx playwright install chromium
   ```

2. **Start servers** (keep both running):

   **Terminal 1 - Backend**:
   ```bash
   cd backend
   npm run start:dev
   ```

   **Terminal 2 - Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Verify servers**:
   - Frontend: http://localhost:3000 ✅
   - Backend: http://localhost:3001 ✅

---

## 🧪 Run Tests

### Option 1: Automated (Recommended)
```bash
cd frontend
./run-tests-with-check.sh     # Linux/Mac
run-tests.bat                  # Windows
```

### Option 2: Manual
```bash
cd frontend
npx playwright test property-crud-complete.spec.ts --project=chromium --workers=1
```

### Option 3: With Visible Browser (Debugging)
```bash
cd frontend
npx playwright test property-crud-complete.spec.ts --project=chromium --headed
```

### Option 4: Single Test
```bash
cd frontend
npx playwright test property-crud-complete.spec.ts --grep "delete" --headed
```

---

## 📊 View Test Report

```bash
cd frontend
npx playwright show-report
```

Opens interactive HTML report in your browser.

---

## ✅ What Tests Verify

1. **Create Property** - Modal creates property, rooms field not sent to API
2. **Edit Property** - Rooms field filtered, no 400 error occurs
3. **Delete Dialog** - Beautiful confirmation dialog appears (not browser alert)
4. **Delete Confirmed** - API called, property removed from table
5. **No Browser Alerts** - Only custom dialogs, never browser confirm/alert
6. **Bulk Delete** - Multiple properties deleted with confirmation

---

## 🐛 Troubleshooting

### Tests Don't Run
**Problem**: "6 did not run"

**Solution**: Servers not running. Start both:
```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
cd frontend && npm run dev
```

### Hydration Error in Browser
**Problem**: "The above error occurred in <AlertDialogAction>"

**Solution**: Already fixed! Make sure you pulled latest changes:
```bash
git status  # Check if confirm-dialog.tsx was updated
```

### Test Finds 2 Elements
**Problem**: "strict mode violation: resolved to 2 elements"

**Solution**: Already fixed with `.first()`. Re-run tests.

### Dialog Not Found
**Problem**: "expect(locator).toBeVisible() failed - [role='alertdialog']"

**Solution**:
- Hydration error is fixed
- Timeouts increased to 10s
- If still failing, check console for JS errors

---

## 📝 Test User Credentials

- **Email**: `test@playwright.com`
- **Password**: `Test1234`

Make sure this user exists in your database!

---

## 🎯 Quick Manual Test (No Automation)

1. Open http://localhost:3000/properties
2. Click red trash icon ➜ Beautiful dialog appears ✅
3. Click "Annuler" ➜ Dialog closes, property remains ✅
4. Click trash again ➜ Click "Supprimer" ➜ Property deleted ✅
5. Open DevTools Console ➜ NO hydration errors ✅

---

## 📁 Documentation Files

- **`SUMMARY.md`** - This guide + all fixes explained
- **`FIXES_APPLIED.md`** - Technical details of each fix
- **`frontend/TEST_INSTRUCTIONS.md`** - Complete testing guide
- **`frontend/MANUAL_TEST_CHECKLIST.md`** - Step-by-step manual testing

---

## 🎉 Expected Results

```
Running 6 tests using 1 worker

✓ [chromium] › tests\property-crud-complete.spec.ts:23:9 › should create a property without rooms field
✓ [chromium] › tests\property-crud-complete.spec.ts:69:9 › should edit a property without sending rooms field
✓ [chromium] › tests\property-crud-complete.spec.ts:139:9 › should show confirmation dialog when deleting
✓ [chromium] › tests\property-crud-complete.spec.ts:180:9 › should actually delete property when confirming
✓ [chromium] › tests\property-crud-complete.spec.ts:224:9 › should NOT show browser alert or confirm
✓ [chromium] › tests\property-crud-complete.spec.ts:258:9 › should handle bulk delete with confirmation

6 passed (1.5m)
```

---

## 💡 Pro Tips

- Run in **headed mode** (`--headed`) to see what's happening
- Use **`--debug`** flag to step through tests
- Check **`test-results/`** folder for screenshots of failures
- View **HTML report** for detailed timeline and traces

---

Need help? Check the detailed docs or run manual tests first!
