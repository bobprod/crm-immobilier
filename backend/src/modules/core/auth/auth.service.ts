import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CommunicationsService } from '../../communications/communications.service';
import * as bcrypt from 'bcrypt';
import { GoogleUser } from './strategies/google.strategy';
import { FacebookUser } from './strategies/facebook.strategy';

interface OAuthUserData {
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  provider: 'google' | 'facebook';
  providerId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private communicationsService: CommunicationsService,
  ) { }

  async register(registerDto: any) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.users.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.users.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role || 'AGENT',
      },
    });

    // Envoyer un email de bienvenue
    try {
      await this.communicationsService.sendEmail(user.id, {
        to: user.email,
        subject: 'Bienvenue sur CRM Immobilier!',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Bienvenue ${user.firstName}!</h1>
            <p>Nous sommes ravis de vous accueillir sur notre plateforme CRM Immobilier.</p>
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant:</p>
            <ul>
              <li>Gérer vos prospects et propriétés</li>
              <li>Planifier vos rendez-vous</li>
              <li>Utiliser l'IA pour optimiser votre travail</li>
              <li>Générer des rapports automatiques</li>
            </ul>
            <p>Pour commencer, connectez-vous avec vos identifiants.</p>
            <p>À bientôt,<br>L'équipe CRM Immobilier</p>
          </div>
        `,
      });
    } catch (error) {
      // Ne pas bloquer l'inscription si l'email échoue
      console.error('Failed to send welcome email:', error);
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.prisma.users.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Générer un refresh token
    const refreshPayload = { sub: user.id, type: 'refresh' };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        agencyId: true,
      },
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      // Vérifier et décoder le refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Vérifier que c'est bien un refresh token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Vérifier que l'utilisateur existe toujours
      const user = await this.prisma.users.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          agencyId: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Générer un nouvel access token
      const newPayload = { sub: user.id, email: user.email, role: user.role };
      const newAccessToken = this.jwtService.sign(newPayload);

      return {
        accessToken: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Connexion via Google OAuth
   */
  async googleLogin(googleUser: GoogleUser) {
    if (!googleUser || !googleUser.email) {
      throw new UnauthorizedException('No user data from Google');
    }

    return this.oauthLogin({
      email: googleUser.email,
      firstName: googleUser.firstName,
      lastName: googleUser.lastName,
      picture: googleUser.picture,
      provider: 'google',
      providerId: googleUser.googleId,
    });
  }

  /**
   * Connexion via Facebook OAuth
   */
  async facebookLogin(facebookUser: FacebookUser) {
    if (!facebookUser || !facebookUser.email) {
      throw new UnauthorizedException('No user data from Facebook');
    }

    return this.oauthLogin({
      email: facebookUser.email,
      firstName: facebookUser.firstName,
      lastName: facebookUser.lastName,
      picture: facebookUser.picture,
      provider: 'facebook',
      providerId: facebookUser.facebookId,
    });
  }

  /**
   * Méthode commune pour la connexion OAuth
   * Crée un utilisateur s'il n'existe pas, sinon le connecte
   */
  private async oauthLogin(userData: OAuthUserData) {
    // Chercher l'utilisateur par email
    let user = await this.prisma.users.findUnique({
      where: { email: userData.email },
    });

    if (!user) {
      // Créer un nouvel utilisateur
      // Générer un mot de passe aléatoire (l'utilisateur OAuth n'en a pas besoin)
      const randomPassword = Math.random().toString(36).slice(-16);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.users.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          role: 'agent',
        },
      });
    }

    // Générer les tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const refreshPayload = { sub: user.id, type: 'refresh' };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
      provider: userData.provider,
    };
  }

  /**
   * Demander un reset de mot de passe
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.prisma.users.findUnique({
        where: { email },
      });

      if (!user) {
        // Pour des raisons de sécurité, ne pas révéler si l'email existe
        return { success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
      }

      // Générer un token de réinitialisation
      const resetToken = this.jwtService.sign(
        { sub: user.id, type: 'password_reset' },
        { secret: process.env.JWT_SECRET, expiresIn: '1h' }
      );

      // Construire le lien de réinitialisation
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      // Envoyer l'email de réinitialisation
      await this.communicationsService.sendEmail(user.id, {
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe - CRM Immobilier',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Réinitialisation de mot de passe</h1>
            <p>Bonjour ${user.firstName},</p>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
            <p>Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            <p style="color: #999; font-size: 12px;">Ce lien expire dans 1 heure.</p>
            <p style="color: #999; font-size: 12px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">L'équipe CRM Immobilier</p>
          </div>
        `,
      });

      return { success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé' };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      return { success: false, message: 'Une erreur est survenue' };
    }
  }

  /**
   * Réinitialiser le mot de passe avec le token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      // Vérifier le token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Hasher le nouveau mot de passe
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Mettre à jour le mot de passe
      await this.prisma.users.update({
        where: { id: payload.sub },
        data: { password: hashedPassword },
      });

      return { success: true, message: 'Mot de passe réinitialisé avec succès' };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { success: false, message: 'Token invalide ou expiré' };
    }
  }
}
