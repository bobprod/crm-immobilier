import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../shared/database/prisma.service';
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
  ) {}

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
        role: registerDto.role || 'agent',
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
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
}
