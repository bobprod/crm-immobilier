import { LLMRouterService, OperationType } from './llm-router.service';
import { LLMProvider } from './providers/llm-provider.interface';

/**
 * Helper pour utiliser le LLM Router avec tracking automatique
 *
 * Encapsule les appels LLM avec :
 * - Sélection intelligente du provider
 * - Tracking automatique des métriques
 * - Gestion d'erreurs
 */
export class LLMRouterHelper {
  constructor(private routerService: LLMRouterService) {}

  /**
   * Générer du contenu avec routing intelligent et tracking automatique
   *
   * @param userId - ID de l'utilisateur
   * @param operationType - Type d'opération (seo, prospecting, etc.)
   * @param prompt - Prompt à envoyer au LLM
   * @param options - Options de génération
   * @param providerOverride - Provider manuel (optionnel)
   * @returns Le contenu généré
   */
  async generateWithTracking(
    userId: string,
    operationType: OperationType,
    prompt: string,
    options?: {
      systemPrompt?: string;
      maxTokens?: number;
      temperature?: number;
      model?: string;
    },
    providerOverride?: string,
  ): Promise<string> {
    const startTime = Date.now();
    let provider: LLMProvider;
    let providerName: string;

    try {
      // 1. Sélectionner le meilleur provider
      provider = await this.routerService.selectBestProvider(
        userId,
        operationType,
        providerOverride,
      );

      providerName = provider.name.toLowerCase();

      // 2. Appeler le provider
      const result = await provider.generate(prompt, options);

      // 3. Calculer les métriques
      const latency = Date.now() - startTime;

      // Estimation des tokens (approximation: 1 token ≈ 4 caractères)
      const tokensInput = Math.ceil(prompt.length / 4);
      const tokensOutput = Math.ceil(result.length / 4);

      // 4. Tracker l'utilisation
      await this.routerService.trackUsage(
        userId,
        providerName,
        operationType,
        tokensInput,
        tokensOutput,
        latency,
        true, // success
      );

      return result;
    } catch (error) {
      // Tracker l'échec
      const latency = Date.now() - startTime;
      const tokensInput = Math.ceil(prompt.length / 4);

      if (providerName) {
        await this.routerService.trackUsage(
          userId,
          providerName,
          operationType,
          tokensInput,
          0,
          latency,
          false, // échec
          error.message,
        );
      }

      throw error;
    }
  }

  /**
   * Obtenir le provider suggéré pour une opération
   */
  async getSuggestedProvider(userId: string, operationType: OperationType) {
    return this.routerService.suggestProvider(userId, operationType);
  }
}
