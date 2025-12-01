import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Fallback ThrottlerGuard pour quand @nestjs/throttler n'est pas installé
 * En production, installer @nestjs/throttler et utiliser la vraie implémentation
 *
 * @example Installation:
 * npm install @nestjs/throttler
 *
 * Puis remplacer ce guard par:
 * import { ThrottlerGuard } from '@nestjs/throttler';
 */
@Injectable()
export class ThrottlerBehindProxyGuard implements CanActivate {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly ttl = 60000; // 1 minute
  private readonly limit = 100; // 100 requests per minute

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = this.getClientIp(request);
    const now = Date.now();

    const record = this.requestCounts.get(ip);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requestCounts.set(ip, { count: 1, resetTime: now + this.ttl });
      return true;
    }

    if (record.count >= this.limit) {
      return false; // Rate limited
    }

    record.count++;
    return true;
  }

  private getClientIp(request: any): string {
    // Support for proxies (X-Forwarded-For)
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = forwarded.split(',');
      return ips[0].trim();
    }
    return request.ip || request.connection?.remoteAddress || 'unknown';
  }
}
