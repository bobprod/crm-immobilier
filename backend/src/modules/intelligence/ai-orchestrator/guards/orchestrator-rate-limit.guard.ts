import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';

/**
 * Guard de rate limiting pour l'orchestrateur IA
 *
 * Limite le nombre de requêtes par tenant pour éviter les abus
 * Utilise un cache en mémoire (en prod, utiliser Redis)
 */
@Injectable()
export class OrchestratorRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(OrchestratorRateLimitGuard.name);

  // Cache en mémoire : Map<tenantId, { count: number, resetAt: number }>
  private readonly rateLimitCache = new Map<string, { count: number; resetAt: number }>();

  // Limites configurables
  private readonly maxRequests = parseInt(process.env.AI_ORCHESTRATOR_MAX_REQUESTS || '20', 10);
  private readonly windowMs = parseInt(process.env.AI_ORCHESTRATOR_WINDOW_MS || '60000', 10); // 1 minute par défaut

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId || request.user?.userId;

    if (!tenantId) {
      // Si pas de tenantId, on laisse passer (sera géré par d'autres guards)
      return true;
    }

    const now = Date.now();
    const key = `ai-orchestrator:${tenantId}`;

    // Récupérer ou initialiser le compteur
    let rateLimit = this.rateLimitCache.get(key);

    if (!rateLimit || now > rateLimit.resetAt) {
      // Nouvelle fenêtre
      rateLimit = {
        count: 0,
        resetAt: now + this.windowMs,
      };
      this.rateLimitCache.set(key, rateLimit);
    }

    // Incrémenter le compteur
    rateLimit.count++;

    // Vérifier la limite
    if (rateLimit.count > this.maxRequests) {
      const retryAfter = Math.ceil((rateLimit.resetAt - now) / 1000);

      this.logger.warn(`Rate limit exceeded for tenant ${tenantId}: ${rateLimit.count}/${this.maxRequests}`);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many orchestration requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Ajouter des headers de rate limiting
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', this.maxRequests);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - rateLimit.count));
    response.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());

    return true;
  }

  /**
   * Nettoyer le cache périodiquement (optionnel)
   */
  clearExpiredEntries() {
    const now = Date.now();
    for (const [key, value] of this.rateLimitCache.entries()) {
      if (now > value.resetAt) {
        this.rateLimitCache.delete(key);
      }
    }
  }
}
