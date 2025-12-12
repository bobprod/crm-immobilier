# ✅ TESTING CHECKLIST - Rooms Field Fix & Confirmation Dialog

## Pre-Test Setup

### Step 1: Start Backend Server
```bash
cd backend
npm run start:dev
```
Wait for: `Nest application successfully started`

### Step 2: Start Frontend Server
```bash
cd frontend
npm run dev
```
Wait for: `ready - started server on 0.0.0.0:3000`

### Step 3: Open Browser
Navigate to: http://localhost:3000

---

## 🧪 Manual Test Cases

### TEST 1: ✅ Verify Rooms Field is Removed

**Steps:**
1. Login with `test@playwright.com` / `Test1234`
2. Click "Nouvelle Propriété" button
3. **VERIFY:** Form has only 2 columns for bedrooms/bathrooms (NO rooms field)
4. **EXPECTED:** No "Pièces" input field visible

**Result:** ☐ PASS  ☐ FAIL

---

### TEST 2: ✅ Create Property Without Rooms Error

**Steps:**
1. Click "Nouvelle Propriété"
2. Fill in:
   - Title: "Test Property No Rooms"
   - Description: "Testing without rooms field"
   - Type: Select any
   - Price: 150000
   - Area: 100
   - Bedrooms: 3
   - Bathrooms: 2
3. Click "Créer la Propriété"
4. Open browser DevTools > Network tab
5. **VERIFY:** No 400 error
6. **VERIFY:** Property appears in table

**Result:** ☐ PASS  ☐ FAIL

---

### TEST 3: ✅ Edit Property Without Rooms Error

**Steps:**
1. Click Edit (pencil icon) on any property
2. Modal opens with property data
3. **VERIFY:** No "Pièces" field in form
4. Change title to add " - Edited"
5. Open DevTools > Network tab
6. Click "Mettre à jour"
7. **VERIFY in Network tab:**
   - PUT request to `/api/properties/{id}`
   - Status code: 200 (not 400)
   - Request payload does NOT contain "rooms" field
8. **VERIFY:** Modal closes successfully
9. **VERIFY:** Updated property appears in table

**Result:** ☐ PASS  ☐ FAIL

---

### TEST 4: ✅ Delete with Beautiful Confirmation Dialog

**Steps:**
1. Find any property in the table
2. Click the red Trash icon
3. **VERIFY:**
   - ✅ Beautiful dialog appears (NOT browser alert)
   - ✅ Title says "Supprimer la propriété"
   - ✅ Description contains property title
   - ✅ Description contains "irréversible"
   - ✅ Two buttons: "Annuler" and "Supprimer"
   - ✅ "Supprimer" button is RED
4. Click "Annuler"
5. **VERIFY:** Dialog closes, property still exists

**Result:** ☐ PASS  ☐ FAIL

---

### TEST 5: ✅ Confirm Delete Actually Deletes

**Steps:**
1. Note the total number of properties
2. Click Trash icon on a property
3. Confirmation dialog appears
4. Click RED "Supprimer" button
5. **VERIFY:**
   - ✅ Dialog closes
   - ✅ Property is removed from table
   - ✅ Total property count decreased by 1

**Result:** ☐ PASS  ☐ FAIL

---

### TEST 6: ✅ No Browser Alerts

**Steps:**
1. Open DevTools > Console
2. Try to delete a property
3. **VERIFY:**
   - ✅ NO browser `confirm()` dialog appears
   - ✅ NO browser `alert()` dialog appears
   - ✅ Only custom beautiful dialog is shown

**Result:** ☐ PASS  ☐ FAIL

---

### TEST 7: ✅ Bulk Delete with Confirmation

**Steps:**
1. Check 2 properties using checkboxes
2. Click bulk action "Supprimer" button
3. **VERIFY:**
   - ✅ Confirmation dialog appears
   - ✅ Title: "Supprimer les propriétés"
   - ✅ Description mentions "2 propriété(s)"
4. Click "Annuler"
5. **VERIFY:** Both properties still exist

**Result:** ☐ PASS  ☐ FAIL

---

## 🤖 Automated Test (Optional)

If servers are running, you can run automated tests:

```bash
cd frontend

# Run all tests
npx playwright test property-crud-complete.spec.ts --project=chromium --headed

# Run specific test
npx playwright test property-crud-complete.spec.ts -g "should edit" --headed
```

---

## ✅ Success Criteria

All tests should PASS:
- ☐ No "Pièces" (rooms) field in form
- ☐ Create works without 400 error
- ☐ Edit works without "rooms should not exist" error
- ☐ Beautiful confirmation dialogs (no browser alerts)
- ☐ Delete actually removes properties
- ☐ Bulk delete works with confirmation

---

## 🐛 If You Encounter Errors

### Error: "property rooms should not exist"

**Check:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Restart frontend server
4. Check DevTools > Network > Request Payload should NOT have "rooms"

### Error: Tests fail with ERR_ABORTED

**Solution:** Make sure both servers are running (see Pre-Test Setup)

### Error: Modal doesn't close

**Check:**
1. Look for console errors in DevTools
2. Backend should return 200, not 400
3. Property data should not include rooms field

---

## 📊 Test Results Summary

Date: ___________
Tester: ___________

| Test | Status | Notes |
|------|--------|-------|
| 1. Rooms Field Removed | ☐ PASS ☐ FAIL | |
| 2. Create Property | ☐ PASS ☐ FAIL | |
| 3. Edit Property | ☐ PASS ☐ FAIL | |
| 4. Delete Confirmation | ☐ PASS ☐ FAIL | |
| 5. Confirm Delete | ☐ PASS ☐ FAIL | |
| 6. No Browser Alerts | ☐ PASS ☐ FAIL | |
| 7. Bulk Delete | ☐ PASS ☐ FAIL | |

**Overall Result:** ☐ ALL PASS ☐ SOME FAILED

**Notes:**
_______________________________________________________________
_______________________________________________________________
_______________________________________________________________
