import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Email atau password tidak valid.');
    }

    const token = await this.jwt.signAsync({
      sub: user.id,
      role: user.role,
      email: user.email,
      division: user.division,
      team: user.team,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        division: user.division,
        team: user.team,
      },
    };
  }
}
