/**
 * CSS SELECTORS REFERENCE - LLM API Keys E2E Tests
 *
 * Ce fichier documente tous les sélecteurs CSS utilisés dans les tests Playwright
 * pour les clés API LLM
 */

// ════════════════════════════════════════════════════════════════════
// PAGE & NAVIGATION
// ════════════════════════════════════════════════════════════════════

// URL
const URLS = {
    BASE: 'http://localhost:3000',
    API_BASE: 'http://localhost:3001/api',
    LOGIN: 'http://localhost:3000/login',
    AI_API_KEYS: 'http://localhost:3000/settings/ai-api-keys',
};

// ════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ════════════════════════════════════════════════════════════════════

const LOGIN_SELECTORS = {
    EMAIL_INPUT: 'input[type="email"]',
    PASSWORD_INPUT: 'input[type="password"]',
    LOGIN_BUTTON: 'button:has-text("Se connecter")',
};

// ════════════════════════════════════════════════════════════════════
// API KEYS PAGE - STRUCTURE
// ════════════════════════════════════════════════════════════════════

const PAGE_SELECTORS = {
    // Titre principal
    MAIN_HEADING: 'h1:has-text("Mes Clés API")',

    // Container d'alerte d'info
    INFO_ALERT: 'text=/BYOK|Bring Your Own Key/',

    // Tabs
    TABS_LIST: '[role="tablist"]',
    TAB_LLM: 'button[role="tab"]:has-text("LLM / IA")',
    TAB_SCRAPING: 'button[role="tab"]:has-text("Scraping & Data")',

    // Alert de succès/erreur
    SUCCESS_ALERT: 'text="Clés API sauvegardées avec succès"',
    ERROR_ALERT: '[class*="red"]',
};

// ════════════════════════════════════════════════════════════════════
// LLM INPUTS - Les 9 Nouveaux Champs
// ════════════════════════════════════════════════════════════════════

const LLM_INPUTS = {
    // Providers existants (5)
    ANTHROPIC: 'input#anthropicApiKey',
    OPENAI: 'input#openaiApiKey',
    GEMINI: 'input#geminiApiKey',
    DEEPSEEK: 'input#deepseekApiKey',
    OPENROUTER: 'input#openrouterApiKey',

    // NOUVEAUX (9)
    MISTRAL: 'input#mistralApiKey',
    GROK: 'input#grokApiKey',
    COHERE: 'input#cohereApiKey',
    TOGETHER_AI: 'input#togetherAiApiKey',
    REPLICATE: 'input#replicateApiKey',
    PERPLEXITY: 'input#perplexityApiKey',
    HUGGING_FACE: 'input#huggingfaceApiKey',
    ALEPH_ALPHA: 'input#alephAlphaApiKey',
    NLP_CLOUD: 'input#nlpCloudApiKey',
};

// ════════════════════════════════════════════════════════════════════
// BUTTONS
// ════════════════════════════════════════════════════════════════════

const BUTTON_SELECTORS = {
    // Sauvegarde LLM
    SAVE_LLM: 'button:has-text("Sauvegarder les clés LLM")',
    SAVE_SCRAPING: 'button:has-text("Sauvegarder les clés Scraping")',

    // Eye icons (pour montrer/cacher)
    // Généralement: button dans le container du champ
    EYE_BUTTON_PATTERN: 'button[type="button"]',
};

// ════════════════════════════════════════════════════════════════════
// SCRAPING INPUTS (pour les tests futurs)
// ════════════════════════════════════════════════════════════════════

const SCRAPING_INPUTS = {
    SERP_API: 'input#serpApiKey',
    FIRECRAWL: 'input#firecrawlApiKey',
    PICA: 'input#picaApiKey',
    JINA_READER: 'input#jinaReaderApiKey',
    SCRAPING_BEE: 'input#scrapingBeeApiKey',
    BROWSERLESS: 'input#browserlessApiKey',
    RAPID_API: 'input#rapidApiKey',
};

// ════════════════════════════════════════════════════════════════════
// PLAYWRIGHT HELPERS
// ════════════════════════════════════════════════════════════════════

/**
 * Fonction pour attendre un input spécifique
 */
export async function waitForLlmInput(page, fieldId) {
    await page.waitForSelector(`input#${fieldId}`, { timeout: 5000 });
}

/**
 * Fonction pour remplir un input LLM
 */
export async function fillLlmKey(page, fieldId, value) {
    const input = page.locator(`input#${fieldId}`);
    await input.fill(value);
}

/**
 * Fonction pour cliquer sur le tab LLM
 */
export async function clickLlmTab(page) {
    const llmTab = page.locator('button[role="tab"]').filter({ hasText: 'LLM / IA' });
    await llmTab.click();
    await page.waitForSelector('input#mistralApiKey', { timeout: 5000 });
}

/**
 * Fonction pour sauvegarder les clés
 */
export async function saveLlmKeys(page) {
    const saveButton = page.locator('button:has-text("Sauvegarder les clés LLM")');
    await saveButton.click();

    // Attendre le message de succès (avec timeout court)
    const successAlert = page.locator('text="Clés API sauvegardées avec succès"');
    try {
        await successAlert.waitFor({ timeout: 3000 });
        return true;
    } catch {
        console.warn('Success message not visible - but save may have worked');
        return false;
    }
}

/**
 * Fonction pour remplir tous les 9 champs
 */
export async function fillAll9Keys(page, timestamp) {
    const keys = {
        mistralApiKey: `mistral-${timestamp}`,
        grokApiKey: `grok-${timestamp}`,
        cohereApiKey: `cohere-${timestamp}`,
        togetherAiApiKey: `together-${timestamp}`,
        replicateApiKey: `replicate-${timestamp}`,
        perplexityApiKey: `perplexity-${timestamp}`,
        huggingfaceApiKey: `huggingface-${timestamp}`,
        alephAlphaApiKey: `aleph-${timestamp}`,
        nlpCloudApiKey: `nlpcloud-${timestamp}`,
    };

    for (const [fieldId, value] of Object.entries(keys)) {
        await fillLlmKey(page, fieldId, value);
    }

    return keys;
}

// ════════════════════════════════════════════════════════════════════
// API ENDPOINTS
// ════════════════════════════════════════════════════════════════════

const API_ENDPOINTS = {
    GET_USER_KEYS: '/ai-billing/api-keys/user',
    PUT_USER_KEYS: '/ai-billing/api-keys/user',
    GET_AGENCY_KEYS: '/ai-billing/api-keys/agency',
    PUT_AGENCY_KEYS: '/ai-billing/api-keys/agency',
    GET_GLOBAL_KEYS: '/ai-billing/api-keys/global',
    PUT_GLOBAL_KEYS: '/ai-billing/api-keys/global',
};

// ════════════════════════════════════════════════════════════════════
// EXPECTED API RESPONSE FIELDS (pour validation)
// ════════════════════════════════════════════════════════════════════

const EXPECTED_RESPONSE_FIELDS = [
    'anthropicApiKey',
    'openaiApiKey',
    'geminiApiKey',
    'deepseekApiKey',
    'openrouterApiKey',
    'mistralApiKey',      // NEW
    'grokApiKey',         // NEW
    'cohereApiKey',       // NEW
    'togetherAiApiKey',   // NEW
    'replicateApiKey',    // NEW
    'perplexityApiKey',   // NEW
    'huggingfaceApiKey',  // NEW
    'alephAlphaApiKey',   // NEW
    'nlpCloudApiKey',     // NEW
    'serpApiKey',
    'firecrawlApiKey',
    'picaApiKey',
    'jinaReaderApiKey',
    'scrapingBeeApiKey',
    'browserlessApiKey',
    'rapidApiKey',
];

// ════════════════════════════════════════════════════════════════════
// TEST DATA
// ════════════════════════════════════════════════════════════════════

export const TEST_CREDENTIALS = {
    email: 'test@example.com',
    password: 'password123',
};

export const TEST_DATA = {
    timestamp: Date.now(),

    // 9 clés de test
    mistralKey: `mistral-${Date.now()}`,
    grokKey: `grok-${Date.now()}`,
    cohereKey: `cohere-${Date.now()}`,
    togetherKey: `together-${Date.now()}`,
    replicateKey: `replicate-${Date.now()}`,
    perplexityKey: `perplexity-${Date.now()}`,
    huggingfaceKey: `huggingface-${Date.now()}`,
    alephKey: `aleph-${Date.now()}`,
    nlpCloudKey: `nlpcloud-${Date.now()}`,
};

// ════════════════════════════════════════════════════════════════════
// NOTES POUR LES TESTS
// ════════════════════════════════════════════════════════════════════

/**
 * IMPORTANT:
 *
 * 1. LES SÉLECTEURS LES PLUS IMPORTANTS:
 *    - Tab LLM: button[role="tab"]:has-text("LLM / IA")
 *    - Inputs: input#mistralApiKey, input#grokApiKey, etc.
 *    - Save: button:has-text("Sauvegarder les clés LLM")
 *    - Success: text="Clés API sauvegardées avec succès"
 *
 * 2. FLUX TYPIQUE:
 *    1. Aller à /settings/ai-api-keys
 *    2. Attendre h1:has-text("Mes Clés API")
 *    3. Cliquer sur le tab LLM
 *    4. Remplir input#mistralApiKey (ou les autres)
 *    5. Cliquer button:has-text("Sauvegarder les clés LLM")
 *    6. Vérifier text="Clés API sauvegardées avec succès"
 *
 * 3. TIMEOUT RECOMMANDÉ:
 *    - Page load: 5000ms
 *    - Input visibility: 3000ms
 *    - Success message: 5000ms
 *
 * 4. SI LES TESTS ÉCHOUENT:
 *    - Vérifie que frontend compile sans erreur
 *    - Ouvre DevTools et inspecte les sélecteurs CSS
 *    - Utilise --debug pour voir les actions en temps réel
 *    - Cherche les messages dans la console browser
 */

export const SELECTORS = {
    LOGIN_SELECTORS,
    PAGE_SELECTORS,
    LLM_INPUTS,
    BUTTON_SELECTORS,
    SCRAPING_INPUTS,
    API_ENDPOINTS,
    EXPECTED_RESPONSE_FIELDS,
    URLS,
};

export default SELECTORS;
