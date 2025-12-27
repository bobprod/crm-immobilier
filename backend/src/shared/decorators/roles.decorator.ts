import { SetMetadata } from '@nestjs/common';

/**
 * Décorateur pour définir les rôles requis pour un endpoint
 *
 * @param roles - Liste des rôles autorisés
 *
 * @example
 * @Roles('admin', 'superadmin')
 * @Get('protected')
 * protectedRoute() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
