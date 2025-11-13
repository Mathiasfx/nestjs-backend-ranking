import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ScoreService } from './score.service';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('scores')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submitScore(
    @Body() submitScoreDto: SubmitScoreDto,
    @Request() req: { user: { userId: string; username: string } },
  ) {
    const updatedUser = await this.scoreService.submitScore(
      req.user.userId,
      submitScoreDto.game,
      submitScoreDto.points,
    );

    // Return user position after score update
    const position = await this.scoreService.getUserPosition(updatedUser.id);
    
    return {
      message: 'Puntaje enviado correctamente',
      newTotal: updatedUser.totalScore,
      position: position?.position,
      game: submitScoreDto.game,
      points: submitScoreDto.points,
    };
  }

  @Get('ranking')
  async getRanking() {
    const ranking = await this.scoreService.getRanking(10);
    
    if (ranking.length === 0) {
      return {
        message: 'No hay puntajes registrados aún',
        ranking: [],
        totalUsers: 0,
      };
    }
    
    return {
      message: 'Ranking obtenido correctamente',
      ranking,
      totalUsers: ranking.length,
    };
  }

  @Get('position/:userId')
  async getUserPosition(@Param('userId') userId: string) {
    const position = await this.scoreService.getUserPosition(userId);
    if (!position) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return position;
  }
}
