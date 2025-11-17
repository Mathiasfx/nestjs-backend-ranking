import { TriviasModule } from './rooms/trivias/trivias.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ScoreModule } from './score/score.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScoreGateway } from './score/score.gateway';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ScoreModule,
    RoomsModule,
    TriviasModule,
  ],
  controllers: [AppController],
  providers: [AppService, ScoreGateway],
})
export class AppModule {}
