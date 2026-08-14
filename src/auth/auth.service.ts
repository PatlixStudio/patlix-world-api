import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import * as bcrypt from 'bcryptjs';
import { SafeUser, UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: SafeUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const user = await this.usersService.create(email, password, displayName ?? '');
    return this.buildResult(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildResult(user);
  }

  private async buildResult(user: User): Promise<AuthResult> {
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '1h');
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      { expiresIn: expiresIn as StringValue },
    );
    return {
      accessToken,
      expiresIn: parseDurationSeconds(expiresIn),
      tokenType: 'Bearer',
      user: this.usersService.toSafeUser(user),
    };
  }
}

/** Converts JWT-style durations (`15m`, `1h`, `30d`, `900`) to whole seconds. */
export function parseDurationSeconds(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)?$/.exec(value.trim());
  if (!match) {
    return 3600;
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? 's';
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * (multipliers[unit] ?? 1);
}
