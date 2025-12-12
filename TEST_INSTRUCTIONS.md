# Property CRUD Tests with Confirmation Dialog

## Running the Tests

### Prerequisites
1. Make sure both backend and frontend servers are running
2. Backend should be on http://localhost:3001
3. Frontend should be on http://localhost:3000

### Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Run Tests

**Terminal 3 - All Tests:**
```bash
cd frontend
npx playwright test property-crud-complete.spec.ts --project=chromium --headed
```

**Run Specific Test:**
```bash
# Test create without rooms field
npx playwright test property-crud-complete.spec.ts -g "should create a property without rooms field" --headed

# Test edit without rooms field
npx playwright test property-crud-complete.spec.ts -g "should edit a property without sending rooms field" --headed

# Test delete with confirmation
npx playwright test property-crud-complete.spec.ts -g "should show confirmation dialog when deleting" --headed

# Test no browser alerts
npx playwright test property-crud-complete.spec.ts -g "should NOT show browser alert" --headed
```

**Run in headless mode (faster):**
```bash
npx playwright test property-crud-complete.spec.ts --project=chromium
```

## What Was Fixed

### Issue
When editing a property, the `rooms` field was being sent to the backend, causing a 400 error:
```
"property rooms should not exist"
```

### Solution
1. ✅ Removed `rooms` field from `initialFormData`
2. ✅ Removed `rooms` from property edit data loading
3. ✅ Removed `rooms` input field from the form UI
4. ✅ Added filtering in modal's handleSubmit: `const { rooms, ...dataToSubmit } = formData`
5. ✅ Kept existing filtering in `propertiesAPI.update()`
6. ✅ Updated grid from 3 columns to 2 columns (removed rooms, kept bedrooms & bathrooms)

### Multiple Layers of Protection
- **Layer 1**: Form doesn't include rooms in initial data
- **Layer 2**: Form doesn't load rooms when editing
- **Layer 3**: Form UI doesn't have rooms input
- **Layer 4**: Modal filters rooms before calling onSubmit
- **Layer 5**: API client filters rooms before HTTP request

### Confirmation Dialog
- ✅ Beautiful custom dialog using shadcn/ui AlertDialog
- ✅ No browser `alert()` or `confirm()` calls
- ✅ Red destructive styling for delete operations
- ✅ Works for both individual and bulk delete
- ✅ Shows property title in confirmation message

## Test Coverage

The test suite (`property-crud-complete.spec.ts`) includes:

1. **Create Property** - Verifies rooms field doesn't exist in create form
2. **Edit Property** - Verifies rooms is not sent to backend on update
3. **Delete Confirmation** - Verifies beautiful dialog appears with property name
4. **Actual Deletion** - Confirms property is removed after confirmation
5. **No Browser Dialogs** - Ensures custom dialog is used, not browser alerts
6. **Bulk Delete** - Tests confirmation dialog for multiple selections

## Expected Results

All tests should pass ✅

- Properties can be created without errors
- Properties can be edited without 400 errors
- Delete operations show beautiful confirmation dialogs
- No browser alerts/confirms are triggered
- UI is clean and intuitive
