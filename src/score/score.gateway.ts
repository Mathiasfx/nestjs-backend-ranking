 
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway()
export class ScoreGateway {
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
  }

   handleDisconnect(client: any) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('getRanking')
  async getRanking() {
    const topUsers = await this.prisma.user.findMany({
      orderBy: { totalScore: 'desc' },
      take: 10,
      select: { username: true, totalScore: true },
    });
    this.server.emit('rankingUpdates', topUsers);
  }

  @SubscribeMessage('getPosition')
  async getPosition(@MessageBody() userId: string) {
    const position = await this.getUserPosition(userId);
    this.server.to(userId).emit('myPosition', position);
  }

  private async getUserPosition(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return null;
    }
    const better = await this.prisma.user.count({ where: { totalScore: { gt: user.totalScore } } });
    return better + 1;
  }
}