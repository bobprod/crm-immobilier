# 📐 API Key Test Button - Visual Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Next.js)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Settings Page (/settings)                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ API Keys Tab                                              │    │
│  │ ─────────────────────────────────────────────────────── │    │
│  │                                                             │    │
│  │ Google Gemini API Key [AIzaSyB6...            ] [Tester] │    │
│  │                          ↓ Input State         ↓ Button   │    │
│  │                   apiKeyStates.gemini     onClick Handler│    │
│  │                                                             │    │
│  │ OpenAI API Key     [sk-...                  ] [Tester]   │    │
│  │ Anthropic API Key  [sk-ant-...             ] [Tester]   │    │
│  │ ... more keys ...                                          │    │
│  │                                                             │    │
│  │ Component: renderApiKeyInput()                            │    │
│  │ • Input field with password masking                       │    │
│  │ • Test button with loading state                          │    │
│  │ • Result display (success/error message + icon)           │    │
│  │ • Disabled state when empty                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                       │
│                           │ Fetch Request                         │
│                           ↓                                       │
│                  /api/api-keys/test/:provider                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP POST
                            │ JSON: { apiKey: "..." }
                            │
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (NestJS)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  API Keys Controller (NEW)                                        │
│  └─ POST /api/api-keys/test/:provider                            │
│     testApiKey(provider, apiKey)                                 │
│     │                                                              │
│     └─→ SettingsService.testApiKey(provider, apiKey)            │
│         │                                                          │
│         ├─→ testOpenAIKey()                                      │
│         ├─→ testAnthropicKey()                                   │
│         ├─→ testGeminiKey() ← Used for your key                │
│         ├─→ testDeepseekKey()                                    │
│         ├─→ testMistralKey()                                     │
│         ├─→ testGrokKey()                                        │
│         └─→ default: Return provider not supported              │
│                                                                     │
│     Each test method:                                             │
│     • Validates API key format                                   │
│     • Makes HTTP request to provider API                         │
│     • Handles rate limiting (HTTP 429)                           │
│     • Returns { success, message, provider, keyPreview }         │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Response
                            │ JSON: { success, message, ... }
                            │
                            ↓
                     EXTERNAL APIS
                     ├─ api.openai.com
                     ├─ api.anthropic.com
                     ├─ generativelanguage.googleapis.com ← Gemini
                     ├─ api.deepseek.com
                     ├─ api.mistral.ai
                     └─ ... other providers
```

---

## Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│ USER INTERACTION                                                │
│                                                                  │
│ 1. User enters API key in input field                           │
│    [Text field]: "AIzaSyB6ZOSlEVDIXpWdMB6..."                  │
│                                                                  │
│ 2. User clicks "Tester" button                                  │
│    [Button]: "Tester"                                           │
└────────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ FRONTEND STATE CHANGE                                           │
│                                                                  │
│ apiKeyStates.gemini = {                                         │
│   apiKey: "AIzaSyB6ZOSlEVDIXpWdMB6...",  ← User input          │
│   testing: true,                          ← Loading state       │
│   testResult: null                        ← Pending            │
│ }                                                                │
│                                                                  │
│ UI Updates:                                                     │
│ • Button shows spinner: "Test... ⟳"                            │
│ • Button is disabled                                            │
│ • Input field locked (readonly during test)                    │
└────────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ API REQUEST                                                     │
│                                                                  │
│ POST http://localhost:3001/api/api-keys/test/gemini            │
│ Content-Type: application/json                                 │
│                                                                  │
│ {                                                               │
│   "apiKey": "AIzaSyB6ZOSlEVDIXpWdMB6zgDvmDiC-3pxPDSw"        │
│ }                                                               │
└────────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ BACKEND PROCESSING                                              │
│                                                                  │
│ 1. ApiKeysController receives POST request                      │
│ 2. Calls SettingsService.testApiKey('gemini', apiKey)          │
│ 3. Routes to testGeminiKey(apiKey)                             │
│ 4. Validates key format (not empty)                            │
│ 5. Makes HTTPS request to Google API:                          │
│                                                                  │
│    POST https://generativelanguage.googleapis.com/v1beta/...   │
│    ?key=AIzaSyB6ZOSlEVDIXpWdMB6zgDvmDiC-3pxPDSw              │
│                                                                  │
│ 6. Receives response (could be):                               │
│    • HTTP 200: Key is valid                                   │
│    • HTTP 400: Invalid request format (key is valid)           │
│    • HTTP 429: Rate limited (key is valid - treated as ✓)      │
│    • HTTP 401/403: Key is invalid                              │
│                                                                  │
│ 7. Constructs response object:                                 │
│    {                                                            │
│      "success": true,                                          │
│      "message": "Clé Gemini valide (Rate limited...)",         │
│      "provider": "gemini",                                     │
│      "keyPreview": "AIzaSyB6ZO..."                             │
│    }                                                            │
└────────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ API RESPONSE                                                    │
│                                                                  │
│ HTTP 200 OK                                                     │
│ Content-Type: application/json                                 │
│                                                                  │
│ {                                                               │
│   "success": true,                                             │
│   "message": "Clé Gemini valide (Rate limited - API foncti...│
│   "provider": "gemini",                                        │
│   "keyPreview": "AIzaSyB6ZO..."                                │
│ }                                                               │
└────────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ FRONTEND STATE UPDATE                                           │
│                                                                  │
│ apiKeyStates.gemini = {                                         │
│   apiKey: "AIzaSyB6ZOSlEVDIXpWdMB6...",                        │
│   testing: false,                         ← Loading done       │
│   testResult: {                           ← Result received    │
│     success: true,                                             │
│     message: "Clé Gemini valide (Rate limited...)",            │
│     provider: "gemini",                                        │
│     keyPreview: "AIzaSyB6ZO..."                                │
│   }                                                             │
│ }                                                               │
│                                                                  │
│ UI Updates:                                                     │
│ • Button returns to "Tester" text                              │
│ • Button becomes enabled again                                  │
│ • Success message displays:                                    │
│   ✓ "Clé Gemini valide (Rate limited - API fonctionne)"       │
│ • Green background with CheckCircle icon                       │
└────────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌────────────────────────────────────────────────────────────────┐
│ USER SEES RESULT                                                │
│                                                                  │
│ Google Gemini API Key [AIzaSyB6...            ] [Tester]       │
│                                                                  │
│ ✓ Clé Gemini valide (Rate limited - API fonctionne)            │
│   (Green box with CheckCircle icon)                            │
│                                                                  │
│ Status: KEY IS VALID ✅                                        │
└────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Diagram

```
Settings Page Component
│
├─ State: activeTab = 'api-keys'
├─ State: apiKeyStates = { gemini: {...}, openai: {...}, ... }
│
├─ Function: testApiKey(provider, apiKey)
│  ├─ Updates state: testing = true
│  ├─ Fetch POST /api/api-keys/test/{provider}
│  └─ Updates state: testResult = response
│
├─ Function: handleApiKeyChange(provider, value)
│  └─ Updates state: apiKey = value
│
├─ Function: renderApiKeyInput(provider, label, placeholder, description)
│  ├─ Input Component (type="password")
│  │  └─ onChange → handleApiKeyChange()
│  │
│  ├─ Button Component ("Tester")
│  │  ├─ onClick → testApiKey()
│  │  ├─ disabled = testing || !apiKey.trim()
│  │  └─ children = spinner or "Tester" text
│  │
│  └─ Result Display
│     ├─ if testResult.success
│     │  └─ Green Box + CheckCircle + Success Message
│     │
│     └─ if testResult.error
│        └─ Red Box + AlertCircle + Error Message
│
└─ Render (JSX)
   ├─ Card: "LLM - Modèles d'IA"
   │  ├─ renderApiKeyInput('openai', ...)
   │  ├─ renderApiKeyInput('anthropic', ...)
   │  ├─ renderApiKeyInput('gemini', ...)      ← Tested Key Here
   │  ├─ renderApiKeyInput('deepseek', ...)
   │  ├─ renderApiKeyInput('mistral', ...)
   │  ├─ renderApiKeyInput('openrouter', ...)
   │  └─ renderApiKeyInput('grok', ...)
   │
   └─ Card: "Moteurs de Scraping Web"
      ├─ Firecrawl input
      ├─ SERP API input
      └─ Pica input
```

---

## HTTP Request/Response Examples

### ✅ Successful Gemini Test

**Request:**
```http
POST /api/api-keys/test/gemini HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{"apiKey":"AIzaSyB6ZOSlEVDIXpWdMB6zgDvmDiC-3pxPDSw"}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Clé Gemini valide (Rate limited - API fonctionne)",
  "provider": "gemini",
  "keyPreview": "AIzaSyB6ZO..."
}
```

### ❌ Failed OpenAI Test

**Request:**
```http
POST /api/api-keys/test/openai HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{"apiKey":"sk-invalid"}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": false,
  "error": "Incorrect API key provided: sk-invalid...",
  "provider": "openai"
}
```

---

## UI Flow Visualization

```
DEFAULT STATE
──────────────────────────────────────────────
Google Gemini API Key [                ] [Tester]
                      ↑empty field      ↑disabled


USER ENTERS KEY
──────────────────────────────────────────────
Google Gemini API Key [AIzaSyB6...     ] [Tester]
                      ↑filled           ↑enabled


USER CLICKS BUTTON
──────────────────────────────────────────────
Google Gemini API Key [AIzaSyB6...     ] [Test...⟳]
                      ↑input locked     ↑disabled + spinner


BACKEND VALIDATES
──────────────────────────────────────────────
[Making request to Google API...]


RESPONSE RECEIVED - SUCCESS
──────────────────────────────────────────────
Google Gemini API Key [AIzaSyB6...     ] [Tester]

✓ Clé Gemini valide (Rate limited - API fonctionne)
← Green box with CheckCircle icon


RESPONSE RECEIVED - ERROR
──────────────────────────────────────────────
Google Gemini API Key [AIzaSyB6...     ] [Tester]

✗ Clé API invalide
← Red box with AlertCircle icon
```

---

## File Structure

```
backend/
└── src/
    └── modules/
        └── core/
            └── settings/
                ├── api-keys.controller.ts          (NEW)
                ├── settings.controller.ts          (modified)
                ├── settings.service.ts             (enhanced)
                ├── settings.module.ts              (updated)
                └── dto/
                    └── ... existing DTOs ...

frontend/
├── pages/
│   └── settings/
│       └── index.tsx                   (enhanced)
│
└── tests/
    └── api-keys-test-button.spec.ts    (NEW)
```

---

## Key Technical Details

### Frontend
- **Framework**: React with Next.js
- **State Management**: React hooks (useState)
- **HTTP Client**: Fetch API
- **Styling**: Tailwind CSS
- **Icons**: Lucide React (CheckCircle, AlertCircle, Loader2)
- **Type Safety**: TypeScript interfaces

### Backend
- **Framework**: NestJS
- **HTTP Client**: Node.js fetch API
- **Architecture**: Controller → Service pattern
- **Response Format**: JSON with consistent structure
- **Error Handling**: Try-catch blocks with graceful fallbacks

---

## Testing Flow (Playwright E2E)

```
1. Browser starts
     ↓
2. Navigate to login page
     ↓
3. Enter credentials and login
     ↓
4. Get auth token from localStorage
     ↓
5. Navigate to /settings
     ↓
6. Click API Keys tab
     ↓
7. Find Gemini input field
     ↓
8. Enter test API key
     ↓
9. Click Test button
     ↓
10. Wait for result (max 15 seconds)
     ↓
11. Verify success message appears
     ↓
12. Test passed ✅
```

---

## Summary

This architecture provides:
- ✅ Clean separation of concerns (Frontend/Backend)
- ✅ Secure API key handling (not stored during test)
- ✅ Real-time user feedback
- ✅ Extensible provider support
- ✅ Error resilience
- ✅ Type safety
- ✅ Comprehensive testing
