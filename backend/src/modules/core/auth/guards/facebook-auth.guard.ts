import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard pour l'authentification Facebook OAuth
 */
@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const activate = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();
    await super.logIn(request);
    return activate;
  }
}
