import { Injectable } from '@nestjs/common';

export interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  answeredAt?: number;
  answeredCorrect?: boolean;
}

interface TriviaQuestion {
  question: string;
  options: string[];
  answer: string; // opción correcta
}

interface Room {
  id: string;
  players: RoomPlayer[];
  currentQuestion?: TriviaQuestion;
  round: number;
  isActive: boolean;
  questions: TriviaQuestion[];
}

@Injectable()
export class RoomsService {
  private rooms: Record<string, Room> = {};

  createRoom(roomId: string): Room {
    const room: Room = {
      id: roomId,
      players: [],
      round: 0,
      isActive: false,
      questions: [],
    };
    this.rooms[roomId] = room;
    return room;
  }

  joinRoom(roomId: string, playerName: string): RoomPlayer {
    if (!this.rooms[roomId]) {
      this.createRoom(roomId);
    }
    const player: RoomPlayer = {
      id: Math.random().toString(36).substring(2, 10),
      name: playerName,
      score: 0,
    };
    this.rooms[roomId].players.push(player);
    return player;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms[roomId];
  }

  startGame(roomId: string, questions: TriviaQuestion[]): boolean {
    const room = this.rooms[roomId];
    if (room && !room.isActive) {
      room.isActive = true;
      room.round = 1;
      room.questions = questions;
      this.setCurrentQuestion(roomId);
      return true;
    }
    return false;
  }

  setCurrentQuestion(roomId: string): void {
    const room = this.rooms[roomId];
    if (room && room.questions[room.round - 1]) {
      room.currentQuestion = room.questions[room.round - 1];
      // Reset player answers for la ronda
      room.players.forEach(p => {
        p.answeredAt = undefined;
        p.answeredCorrect = false;
      });
    }
  }

  submitAnswer(roomId: string, playerId: string, answer: string): { correct: boolean; score: number } | null {
    const room = this.rooms[roomId];
    if (!room || !room.isActive) return null;
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.answeredAt) return null; // Ya respondió
    player.answeredAt = Date.now();
    const correct = answer.trim().toLowerCase() === (room.currentQuestion?.answer.trim().toLowerCase() ?? '');
    player.answeredCorrect = correct;
    if (correct) {
      // Score: base + bonus por rapidez
      const correctCount = room.players.filter(p => p.answeredCorrect).length;
      const bonus = Math.max(0, 5 - correctCount); // El primero suma más
      player.score += 10 + bonus;
    }
    return { correct, score: player.score };
  }

  nextRound(roomId: string): boolean {
    const room = this.rooms[roomId];
    if (!room || !room.isActive) return false;
    if (room.round < room.questions.length) {
      room.round++;
      this.setCurrentQuestion(roomId);
      return true;
    } else {
      room.isActive = false;
      return false;
    }
  }

  getRanking(roomId: string): RoomPlayer[] {
    const room = this.rooms[roomId];
    if (!room) return [];
    return [...room.players].sort((a, b) => b.score - a.score);
  }
}
