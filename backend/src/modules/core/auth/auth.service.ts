import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../shared/database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
}
