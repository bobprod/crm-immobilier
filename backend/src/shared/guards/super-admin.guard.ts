import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * Guard pour vérifier que l'utilisateur est Super Admin
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, SuperAdminGuard)
 * @Get('admin-only')
 * adminRoute() { ... }
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Accès refusé : utilisateur non authentifié');
    }

    if (user.role !== 'superadmin') {
      throw new ForbiddenException(
        'Accès refusé : seuls les super administrateurs peuvent accéder à cette ressource'
      );
    }

    return true;
  }
}
