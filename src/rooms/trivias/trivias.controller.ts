/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Post, Get, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { TriviasService } from './trivias.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('rooms/trivias')
export class TriviasController {
  constructor(private readonly triviasService: TriviasService) {}

  @Post()
  createTrivia(@Req() req, @Body() dto: any) {
    return this.triviasService.createTrivia(req.user.userId, dto);
  }

  @Get('mine')
  getMyTrivia(@Req() req) {
    return this.triviasService.getTriviaByUser(req.user.userId);
  }

  @Put(':id')
  updateTrivia(@Param('id') id: string, @Body() dto: any, @Req() req) {
    return this.triviasService.updateTrivia(id, req.user.userId, dto);
  }

  @Delete(':id')
  deleteTrivia(@Param('id') id: string, @Req() req) {
    return this.triviasService.deleteTrivia(id, req.user.userId);
  }

  @Post(':id/start')
  startTrivia(@Param('id') id: string, @Req() req) {
    return this.triviasService.startTrivia(id, req.user.userId);
  }

  @Get(':id/ranking')
  getRanking(@Param('id') id: string) {
    return this.triviasService.getRanking(id);
  }
}
