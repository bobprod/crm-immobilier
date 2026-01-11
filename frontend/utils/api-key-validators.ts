/**
 * Direct API Key Validators
 * Tests API keys by calling the actual provider APIs (no backend needed)
 */

export interface ValidationResult {
    success: boolean;
    message?: string;
    error?: string;
    provider: string;
    keyPreview?: string;
}

/**
 * Test Google Gemini API Key
 * Calls: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
 * Available models: gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash
 */
export async function validateGeminiKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'gemini',
        };
    }

    try {
        // Use gemini-2.5-flash (current stable model as of 2025)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: 'test',
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        if (response.status === 200) {
            return {
                success: true,
                message: '✅ Clé Gemini valide et fonctionnelle',
                provider: 'gemini',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 429) {
            // Rate limited but key is valid
            return {
                success: true,
                message: '⚠️ Clé valide (Rate limited - API fonctionne)',
                provider: 'gemini',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                error: '❌ Clé API invalide ou permissions insuffisantes',
                provider: 'gemini',
            };
        } else if (response.status === 404) {
            // 404 with valid key means model doesn't exist but key is good
            return {
                success: true,
                message: '✅ Clé Gemini valide (Modèle non disponible mais clé OK)',
                provider: 'gemini',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: `❌ Erreur ${response.status}: ${errorData.error?.message || 'Vérifiez votre clé API'}`,
                provider: 'gemini',
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `❌ Erreur réseau: ${error instanceof Error ? error.message : 'Vérifiez votre connexion'}`,
            provider: 'gemini',
        };
    }
}

/**
 * Test OpenAI API Key
 * Calls: https://api.openai.com/v1/models
 */
export async function validateOpenAIKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'openai',
        };
    }

    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.status === 200) {
            return {
                success: true,
                message: '✅ Clé OpenAI valide et fonctionnelle',
                provider: 'openai',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                error: '❌ Clé API invalide ou permissions insuffisantes',
                provider: 'openai',
            };
        } else {
            return {
                success: false,
                error: `❌ Erreur ${response.status}: Vérifiez votre clé API`,
                provider: 'openai',
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `❌ Erreur réseau: ${error instanceof Error ? error.message : 'Vérifiez votre connexion'}`,
            provider: 'openai',
        };
    }
}

/**
 * Test Anthropic Claude API Key
 * Calls: https://api.anthropic.com/v1/models
 */
export async function validateAnthropicKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'anthropic',
        };
    }

    try {
        const response = await fetch('https://api.anthropic.com/v1/models', {
            method: 'GET',
            headers: {
                'x-api-key': apiKey,
            },
        });

        if (response.status === 200) {
            return {
                success: true,
                message: '✅ Clé Claude (Anthropic) valide et fonctionnelle',
                provider: 'anthropic',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                error: '❌ Clé API invalide ou permissions insuffisantes',
                provider: 'anthropic',
            };
        } else {
            return {
                success: false,
                error: `❌ Erreur ${response.status}: Vérifiez votre clé API`,
                provider: 'anthropic',
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `❌ Erreur réseau: ${error instanceof Error ? error.message : 'Vérifiez votre connexion'}`,
            provider: 'anthropic',
        };
    }
}

/**
 * Test Mistral API Key
 * Calls: https://api.mistral.ai/v1/models
 */
export async function validateMistralKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'mistral',
        };
    }

    try {
        const response = await fetch('https://api.mistral.ai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.status === 200) {
            return {
                success: true,
                message: '✅ Clé Mistral valide et fonctionnelle',
                provider: 'mistral',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                error: '❌ Clé API invalide ou permissions insuffisantes',
                provider: 'mistral',
            };
        } else {
            return {
                success: false,
                error: `❌ Erreur ${response.status}: Vérifiez votre clé API`,
                provider: 'mistral',
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `❌ Erreur réseau: ${error instanceof Error ? error.message : 'Vérifiez votre connexion'}`,
            provider: 'mistral',
        };
    }
}

/**
 * Test Deepseek API Key
 * Calls: https://api.deepseek.com/v1/models
 */
export async function validateDeepseekKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'deepseek',
        };
    }

    try {
        const response = await fetch('https://api.deepseek.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.status === 200) {
            return {
                success: true,
                message: '✅ Clé Deepseek valide et fonctionnelle',
                provider: 'deepseek',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                error: '❌ Clé API invalide ou permissions insuffisantes',
                provider: 'deepseek',
            };
        } else {
            return {
                success: false,
                error: `❌ Erreur ${response.status}: Vérifiez votre clé API`,
                provider: 'deepseek',
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `❌ Erreur réseau: ${error instanceof Error ? error.message : 'Vérifiez votre connexion'}`,
            provider: 'deepseek',
        };
    }
}

/**
 * Test Grok (xAI) API Key
 * Format validation only (no public endpoint available)
 */
export async function validateGrokKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'grok',
        };
    }

    // Basic format validation for Grok keys
    if (!apiKey.startsWith('xai-') && !apiKey.startsWith('sk-')) {
        return {
            success: false,
            error: '❌ Format de clé invalide (doit commencer par "xai-" ou "sk-")',
            provider: 'grok',
        };
    }

    return {
        success: true,
        message: '✅ Format de clé Grok valide (vérification complète disponible via l\'API)',
        provider: 'grok',
        keyPreview: apiKey.substring(0, 10) + '...',
    };
}

/**
 * Test Open Router API Key
 * Calls: https://openrouter.ai/api/v1/models
 */
export async function validateOpenRouterKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'openrouter',
        };
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.status === 200) {
            return {
                success: true,
                message: '✅ Clé Open Router valide et fonctionnelle',
                provider: 'openrouter',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                error: '❌ Clé API invalide ou permissions insuffisantes',
                provider: 'openrouter',
            };
        } else {
            return {
                success: false,
                error: `❌ Erreur ${response.status}: Vérifiez votre clé API`,
                provider: 'openrouter',
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `❌ Erreur réseau: ${error instanceof Error ? error.message : 'Vérifiez votre connexion'}`,
            provider: 'openrouter',
        };
    }
}

/**
 * Main validator router - dispatches to correct validator based on provider
 */
export async function validateApiKey(
    provider: string,
    apiKey: string
): Promise<ValidationResult> {
    const validators: Record<string, (key: string) => Promise<ValidationResult>> = {
        gemini: validateGeminiKey,
        openai: validateOpenAIKey,
        anthropic: validateAnthropicKey,
        mistral: validateMistralKey,
        deepseek: validateDeepseekKey,
        grok: validateGrokKey,
        openrouter: validateOpenRouterKey,
    };

    const validator = validators[provider];

    if (!validator) {
        return {
            success: false,
            error: `Provider '${provider}' non supporté`,
            provider,
        };
    }

    return validator(apiKey);
}

/**
 * Get available models for a provider
 * Fetches the list of models from the provider's API
 */
export async function getAvailableModels(provider: string, apiKey: string): Promise<string[]> {
    try {
        switch (provider) {
            case 'openai':
                return await getOpenAIModels(apiKey);
            case 'anthropic':
                return getAnthropicModels();
            case 'gemini':
                return await getGeminiModels(apiKey);
            case 'deepseek':
                return getDeepseekModels();
            case 'mistral':
                return await getMistralModels(apiKey);
            case 'openrouter':
                return await getOpenRouterModels(apiKey);
            case 'grok':
                return getGrokModels();
            default:
                return [];
        }
    } catch (error) {
        console.error(`Error fetching models for ${provider}:`, error);
        return [];
    }
}

// OpenAI Models
async function getOpenAIModels(apiKey: string): Promise<string[]> {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            const models = data.data
                .filter((m: any) => m.id.includes('gpt'))
                .map((m: any) => m.id)
                .sort();
            return models;
        }
        return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    } catch {
        return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    }
}

// Anthropic Models (static list)
function getAnthropicModels(): string[] {
    return [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20250219',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
    ];
}

// Google Gemini Models
async function getGeminiModels(apiKey: string): Promise<string[]> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (response.ok) {
            const data = await response.json();
            const models = data.models
                .filter((m: any) => m.displayName && !m.displayName.includes('Embed'))
                .map((m: any) => m.name.replace('models/', ''))
                .sort();
            return models;
        }
        return ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
    } catch {
        return ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
    }
}

// Deepseek Models (static list)
function getDeepseekModels(): string[] {
    return [
        'deepseek-chat',
        'deepseek-coder',
    ];
}

// Mistral Models
async function getMistralModels(apiKey: string): Promise<string[]> {
    try {
        const response = await fetch('https://api.mistral.ai/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            const models = data.data
                .map((m: any) => m.id)
                .sort();
            return models;
        }
        return ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'];
    } catch {
        return ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'];
    }
}

// OpenRouter Models
async function getOpenRouterModels(apiKey: string): Promise<string[]> {
    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
            },
        });

        if (response.ok) {
            const data = await response.json();
            const models = data.data
                .map((m: any) => m.id)
                .slice(0, 20)
                .sort();
            return models;
        }
        return ['gpt-4', 'claude-3-opus', 'mistral-large'];
    } catch {
        return ['gpt-4', 'claude-3-opus', 'mistral-large'];
    }
}

// Grok Models (static list)
function getGrokModels(): string[] {
    return [
        'grok-2',
        'grok-1',
    ];
}

/**
 * Test Firecrawl API Key
 * Calls: https://api.firecrawl.dev/v1/scrape
 */
export async function validateFirecrawlKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'firecrawl',
        };
    }

    try {
        // Test with a simple scrape request
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                url: 'https://example.com',
                formats: ['markdown'],
            }),
        });

        if (response.status === 200 || response.status === 201) {
            return {
                success: true,
                message: '✅ Clé Firecrawl valide et fonctionnelle',
                provider: 'firecrawl',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 429) {
            return {
                success: true,
                message: '⚠️ Clé valide (Rate limited - quota atteint)',
                provider: 'firecrawl',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                error: '❌ Clé API invalide ou permissions insuffisantes',
                provider: 'firecrawl',
            };
        } else if (response.status === 402) {
            return {
                success: true,
                message: '⚠️ Clé valide (Paiement requis - vérifiez votre abonnement)',
                provider: 'firecrawl',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: `❌ Erreur ${response.status}: ${errorData.error || 'Vérifiez votre clé API'}`,
                provider: 'firecrawl',
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `❌ Erreur réseau: ${error instanceof Error ? error.message : 'Vérifiez votre connexion'}`,
            provider: 'firecrawl',
        };
    }
}

/**
 * Test SERP API Key
 * Calls: https://serpapi.com/account
 */
export async function validateSerpApiKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'serpapi',
        };
    }

    try {
        // Test with account endpoint to validate API key
        const response = await fetch(`https://serpapi.com/account.json?api_key=${apiKey}`);

        if (response.status === 200) {
            const data = await response.json();
            const remaining = data.total_searches_left || 0;
            return {
                success: true,
                message: `✅ Clé SERP API valide (${remaining} recherches restantes)`,
                provider: 'serpapi',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 401) {
            return {
                success: false,
                error: '❌ Clé API invalide',
                provider: 'serpapi',
            };
        } else if (response.status === 429) {
            return {
                success: true,
                message: '⚠️ Clé valide (Rate limited - quota atteint)',
                provider: 'serpapi',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: `❌ Erreur ${response.status}: ${errorData.error || 'Vérifiez votre clé API'}`,
                provider: 'serpapi',
            };
        }
    } catch (error) {
        return {
            success: false,
            error: `❌ Erreur réseau: ${error instanceof Error ? error.message : 'Vérifiez votre connexion'}`,
            provider: 'serpapi',
        };
    }
}

/**
 * Test Pica AI API Key
 * Note: Pica API documentation may vary - using generic validation
 */
export async function validatePicaKey(apiKey: string): Promise<ValidationResult> {
    if (!apiKey.trim()) {
        return {
            success: false,
            error: 'Clé API vide',
            provider: 'pica',
        };
    }

    try {
        // Try to call a basic endpoint to validate the key
        // Note: Adjust endpoint based on actual Pica API documentation
        const response = await fetch('https://api.pica-api.com/v1/status', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 200) {
            return {
                success: true,
                message: '✅ Clé Pica AI valide et fonctionnelle',
                provider: 'pica',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                error: '❌ Clé API invalide ou permissions insuffisantes',
                provider: 'pica',
            };
        } else if (response.status === 404) {
            // If endpoint not found, assume key format is valid
            return {
                success: true,
                message: '⚠️ Clé acceptée (endpoint de test non disponible)',
                provider: 'pica',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else if (response.status === 429) {
            return {
                success: true,
                message: '⚠️ Clé valide (Rate limited)',
                provider: 'pica',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        } else {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: `❌ Erreur ${response.status}: ${errorData.error || 'Vérifiez votre clé API'}`,
                provider: 'pica',
            };
        }
    } catch (error) {
        // If there's a network error, it might mean the endpoint doesn't exist
        // In this case, just validate the key format
        if (apiKey.length > 10) {
            return {
                success: true,
                message: '⚠️ Clé acceptée (validation complète non disponible)',
                provider: 'pica',
                keyPreview: apiKey.substring(0, 10) + '...',
            };
        }
        return {
            success: false,
            error: `❌ Erreur: ${error instanceof Error ? error.message : 'Clé invalide'}`,
            provider: 'pica',
        };
    }
}

/**
 * Generic validator that routes to the correct provider validator
 */
export async function validateScrapingApiKey(provider: string, apiKey: string): Promise<ValidationResult> {
    switch (provider.toLowerCase()) {
        case 'firecrawl':
            return validateFirecrawlKey(apiKey);
        case 'serpapi':
        case 'serp':
            return validateSerpApiKey(apiKey);
        case 'pica':
            return validatePicaKey(apiKey);
        default:
            return {
                success: false,
                error: `Provider ${provider} non supporté`,
                provider,
            };
    }
}
