/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  async findByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const {
      password: _pwd,
      createdAt: _createdAt,
      currentScores: _currentScores,
      ...rest
    } = user;
    return rest;
  }
}
