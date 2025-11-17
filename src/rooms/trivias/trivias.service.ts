import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TriviasService {
  constructor(private readonly prisma: PrismaService) {}

  async createTrivia(userId: string, dto: any) {
    // Limitar a 1 trivia por usuario
      const existing = await this.prisma.trivia.findFirst({ where: { userId } });
    if (existing) throw new Error('Ya tienes una trivia creada');
    if (!dto.questions || dto.questions.length > 10) throw new Error('Máximo 10 preguntas');
    for (const q of dto.questions) {
      if (!q.options || q.options.length < 2 || q.options.length > 4) throw new Error('Cada pregunta debe tener entre 2 y 4 opciones');
    }
      return this.prisma.trivia.create({ data: { ...dto, userId } });
  }

  async getTriviaByUser(userId: string) {
    return this.prisma.trivia.findFirst({ where: { userId } });
  }

  async updateTrivia(id: string, userId: string, dto: any) {
    return this.prisma.trivia.update({ where: { id, userId }, data: dto });
  }

  async deleteTrivia(id: string, userId: string) {
    return this.prisma.trivia.delete({ where: { id, userId } });
  }

  async startTrivia(id: string, userId: string) {
    // Aquí podrías activar la trivia y lanzar el flujo por WebSocket
      return this.prisma.trivia.update({ where: { id, userId }, data: { isActive: true } });
  }

  async getRanking(id: string) {
    // Implementa la lógica para obtener el ranking de la trivia
    return [];
  }
}
