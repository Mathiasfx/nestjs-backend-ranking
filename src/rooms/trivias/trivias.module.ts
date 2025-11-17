import { Module } from '@nestjs/common';
import { TriviasController } from './trivias.controller';
import { TriviasService } from './trivias.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TriviasController],
  providers: [TriviasService],
})
export class TriviasModule {}
