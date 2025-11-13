import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ScoreService } from './score.service';
import { ScoreController } from './score.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ScoreController],
  providers: [ScoreService],
  exports: [ScoreService],
})
export class ScoreModule {}
