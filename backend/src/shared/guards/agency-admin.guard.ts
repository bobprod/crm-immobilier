import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * Guard pour vérifier que l'utilisateur est Admin de son agence
 *
 * Vérifie que:
 * 1. L'utilisateur est authentifié
 * 2. L'utilisateur a un agencyId
 * 3. L'utilisateur a le rôle 'admin' ou 'superadmin'
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, AgencyAdminGuard)
 * @Post('agency-settings')
 * updateAgencySettings() { ... }
 */
@Injectable()
export class AgencyAdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new ForbiddenException('Accès refusé : utilisateur non authentifié');
    }

    // Super admin a tous les droits
    if (user.role === 'superadmin') {
      return true;
    }

    // Récupérer les infos utilisateur depuis la DB
    const dbUser = await this.prisma.users.findUnique({
      where: { id: user.userId },
      select: { agencyId: true, role: true },
    });

    if (!dbUser) {
      throw new ForbiddenException('Utilisateur introuvable');
    }

    // Vérifier que l'utilisateur a une agence
    if (!dbUser.agencyId) {
      throw new ForbiddenException(
        'Accès refusé : vous devez être membre d\'une agence pour accéder à cette ressource'
      );
    }

    // Vérifier que l'utilisateur est admin
    if (dbUser.role !== 'admin' && dbUser.role !== 'superadmin') {
      throw new ForbiddenException(
        'Accès refusé : seuls les administrateurs d\'agence peuvent accéder à cette ressource'
      );
    }

    // Ajouter l'agencyId au request pour utilisation dans les controllers
    request.user.agencyId = dbUser.agencyId;

    return true;
  }
}
