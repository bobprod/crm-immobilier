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
