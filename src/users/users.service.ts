import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';

/** User shape safe to expose over the API (never includes the password hash). */
export interface SafeUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  async create(email: string, password: string, displayName = ''): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.users.create({
      email: email.toLowerCase(),
      displayName,
      passwordHash,
      role: 'USER',
    });
    return this.users.save(user);
  }

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
