import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

interface AuthenticatedUser {
  id: string;
  username: string;
  displayName?: string;
  totalScore: number;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    if (await this.usersService.validatePassword(password, user.password)) {
      // remove sensitive fields and return safe user data
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || undefined,
        totalScore: user.totalScore,
      };
    }

    throw new UnauthorizedException('Credenciales inválidas');
  }

  login(user: AuthenticatedUser) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(username: string, password: string, displayName?: string) {
    const existing = await this.usersService.findByUsername(username);
    if (existing) throw new UnauthorizedException('Usuario ya existe');
    await this.usersService.create(username, password, displayName);
    return { message: 'Usuario registrado correctamente' };
  }
}
