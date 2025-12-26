import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

export interface FacebookUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  facebookId: string;
}

/**
 * Stratégie OAuth2 pour Facebook
 * Permet aux utilisateurs de se connecter avec leur compte Facebook
 */
@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = configService.get<string>('FACEBOOK_APP_SECRET');

    // Utiliser un placeholder si non configuré (OAuth ne fonctionnera pas mais l'app démarrera)
    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL:
        configService.get<string>('FACEBOOK_CALLBACK_URL') ||
        'http://localhost:3000/api/auth/facebook/callback',
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });

    if (!clientID || !clientSecret) {
      console.warn(
        '[FacebookStrategy] Facebook OAuth not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in .env',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: FacebookUser) => void,
  ): Promise<void> {
    const { name, emails, photos, id } = profile;

    const user: FacebookUser = {
      email: emails?.[0]?.value || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || '',
      facebookId: id,
    };

    done(null, user);
  }
}
