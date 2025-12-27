import { Logger } from '@nestjs/common';

/**
 * Options pour la retry logic
 */
export interface RetryOptions {
  /**
   * Nombre max de tentatives (défaut: 3)
   */
  maxRetries?: number;

  /**
   * Délai initial entre les tentatives en ms (défaut: 1000ms)
   */
  initialDelay?: number;

  /**
   * Facteur multiplicateur du délai (défaut: 2 = backoff exponentiel)
   */
  backoffFactor?: number;

  /**
   * Délai max entre les tentatives en ms (défaut: 10000ms)
   */
  maxDelay?: number;

  /**
   * Fonction pour déterminer si l'erreur est retriable
   */
  shouldRetry?: (error: any) => boolean;

  /**
   * Callback appelé avant chaque retry
   */
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Exécuter une fonction avec retry automatique en cas d'échec
 *
 * @param fn Fonction async à exécuter
 * @param options Options de retry
 * @returns Le résultat de la fonction
 *
 * @example
 * const result = await withRetry(
 *   () => axios.get('https://api.example.com'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    maxDelay = 10000,
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options;

  const logger = new Logger('RetryUtil');

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Si c'est la dernière tentative ou si l'erreur n'est pas retriable, on throw
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Log + callback
      logger.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message}. Retrying in ${delay}ms...`);

      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Attendre avant le prochain retry
      await sleep(delay);

      // Augmenter le délai (backoff exponentiel)
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  // Ne devrait jamais arriver ici, mais au cas où
  throw lastError;
}

/**
 * Fonction par défaut pour déterminer si une erreur est retriable
 */
function defaultShouldRetry(error: any): boolean {
  // Retry sur les erreurs réseau, timeouts, rate limits (429), et erreurs serveur (5xx)
  if (error.response) {
    const status = error.response.status;
    return status === 429 || status >= 500;
  }

  // Retry sur les erreurs réseau (ECONNREFUSED, ETIMEDOUT, etc.)
  if (error.code) {
    const retriableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN'];
    return retriableCodes.includes(error.code);
  }

  // Retry sur les timeouts
  if (error.message && error.message.toLowerCase().includes('timeout')) {
    return true;
  }

  return false;
}

/**
 * Helper pour attendre un certain temps
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
