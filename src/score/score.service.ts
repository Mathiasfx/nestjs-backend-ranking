import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

export interface RankingEntry {
  id: string;
  username: string;
  displayName?: string;
  totalScore: number;
  position: number;
}

export interface UserPosition {
  id: string;
  username: string;
  displayName?: string;
  position: number;
  totalScore: number;
}

@Injectable()
export class ScoreService {
  constructor(private prisma: PrismaService) {}

  async submitScore(
    userId: string,
    game: string,
    points: number,
  ): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('Usuario no encontrado');

      // Parse current scores from JSON, handle edge case of empty/null scores
      let currentScores: Record<string, number> = {};
      try {
        currentScores = (user.currentScores as Record<string, number>) || {};
      } catch {
        currentScores = {};
      }

      // Update current score for this game
      currentScores[game] = points;

      // Calculate new total (sum of best scores per game)
      const newTotal = Object.values(currentScores).reduce(
        (sum, score) => sum + score,
        0,
      );

      // Only update totalScore if new total is better
      const shouldUpdateTotal = newTotal > user.totalScore;

      return this.prisma.user.update({
        where: { id: userId },
        data: {
          currentScores: currentScores,
          ...(shouldUpdateTotal ? { totalScore: newTotal } : {}),
        },
      });
    } catch (error) {
      throw new Error(`Error al actualizar puntaje: ${error.message}`);
    }
  }

  async getRanking(limit = 10): Promise<RankingEntry[]> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: [
          { totalScore: 'desc' },
          { createdAt: 'asc' }, // tie-breaker: earliest user wins
        ],
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          totalScore: true,
          createdAt: true,
        },
      });

      // Return empty array if no users found - this is a valid state
      if (!users || users.length === 0) {
        return [];
      }

      // Calculate positions considering ties
      const ranking: RankingEntry[] = [];
      let currentPosition = 1;

      for (let i = 0; i < users.length; i++) {
        const user = users[i];

        // If this user has a different score than the previous user, update position
        if (i > 0 && users[i - 1].totalScore !== user.totalScore) {
          currentPosition = i + 1;
        }

        ranking.push({
          id: user.id,
          username: user.username,
          displayName: user.displayName || undefined,
          totalScore: user.totalScore,
          position: currentPosition,
        });
      }

      return ranking;
    } catch (error) {
      throw new Error(`Error al obtener ranking: ${error.message}`);
    }
  }

  async getUserPosition(userId: string): Promise<UserPosition | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          totalScore: true,
          createdAt: true,
        },
      });

      if (!user) return null;

      // Count users with better scores
      const betterScoreCount = await this.prisma.user.count({
        where: { totalScore: { gt: user.totalScore } },
      });

      // Count users with same score but created earlier (tie-breaker)
      const samScoreEarlierCount = await this.prisma.user.count({
        where: {
          totalScore: user.totalScore,
          createdAt: { lt: user.createdAt },
        },
      });

      const position = betterScoreCount + samScoreEarlierCount + 1;

      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName || undefined,
        totalScore: user.totalScore,
        position,
      };
    } catch (error) {
      throw new Error(
        `Error al obtener posición del usuario: ${error.message}`,
      );
    }
  }
}
