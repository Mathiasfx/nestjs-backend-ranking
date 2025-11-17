/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService, RoomPlayer } from './rooms.service';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({ namespace: '/rooms' })
@Injectable()
export class RoomsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomsService: RoomsService) {}

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; name: string },
    @ConnectedSocket() client: Socket,
  ): { success: boolean; player: RoomPlayer } {
    const player = this.roomsService.joinRoom(data.roomId, data.name);
    client.join(data.roomId);
    this.server.to(data.roomId).emit('playerJoined', player);
    return { success: true, player };
  }

  private timers: Record<string, NodeJS.Timeout> = {};

  @SubscribeMessage('startGame')
  async handleStartGame(
    @MessageBody() data: { roomId: string; questions: Array<any>; timerSeconds?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const started = this.roomsService.startGame(data.roomId, data.questions);
    if (started) {
      // Emitir countdown antes de iniciar la trivia
      this.server.to(data.roomId).emit('countdown', { seconds: 3 });
      setTimeout(() => {
        const room = this.roomsService.getRoom(data.roomId);
        this.server.to(data.roomId).emit('gameStarted', {
          roomId: data.roomId,
          question: room?.currentQuestion,
          round: room?.round,
          timer: data.timerSeconds || 10,
        });
        this.startTimer(data.roomId, data.timerSeconds || 10);
      }, 3000);
    }
    return { success: started };
  }

  startTimer(roomId: string, seconds: number) {
    if (this.timers[roomId]) {
      clearTimeout(this.timers[roomId]);
    }
    this.timers[roomId] = setTimeout(() => {
      this.handleTimeout(roomId);
    }, seconds * 1000);
    this.server.to(roomId).emit('timerStarted', { seconds });
  }

  handleTimeout(roomId: string) {
    const room = this.roomsService.getRoom(roomId);
    if (!room || !room.isActive) return;
    // Marcar como incorrectos los que no respondieron
    room.players.forEach(p => {
      if (!p.answeredAt) {
        p.answeredAt = Date.now();
        p.answeredCorrect = false;
      }
    });
    // Avanzar ronda
    const advanced = this.roomsService.nextRound(roomId);
    const updatedRoom = this.roomsService.getRoom(roomId);
    if (advanced && updatedRoom) {
      this.server.to(roomId).emit('newRound', {
        round: updatedRoom.round,
        question: updatedRoom.currentQuestion,
        timer: 10,
      });
      this.startTimer(roomId, 10);
    } else if (updatedRoom && !updatedRoom.isActive) {
      // Juego terminado
      const ranking = this.roomsService.getRanking(roomId);
      this.server.to(roomId).emit('gameEnded', { ranking });
      clearTimeout(this.timers[roomId]);
      delete this.timers[roomId];
    }
  }

  @SubscribeMessage('submitAnswer')
  handleSubmitAnswer(
    @MessageBody() data: { roomId: string; playerId: string; answer: string },
    @ConnectedSocket() client: Socket,
  ) {
    const result = this.roomsService.submitAnswer(data.roomId, data.playerId, data.answer);
    if (result) {
      this.server.to(data.roomId).emit('answerSubmitted', {
        playerId: data.playerId,
        correct: result.correct,
        score: result.score,
      });
      // Emitir ranking actualizado en tiempo real
      const ranking = this.roomsService.getRanking(data.roomId);
      this.server.to(data.roomId).emit('rankingUpdated', { ranking });
    }
    // Si todos respondieron, avanzar ronda antes de que termine el timer
    const room = this.roomsService.getRoom(data.roomId);
    if (room) {
      const totalPlayers = room.players.length;
      const answeredPlayers = room.players.filter(p => p.answeredAt).length;
      if (answeredPlayers === totalPlayers) {
        if (this.timers[data.roomId]) {
          clearTimeout(this.timers[data.roomId]);
          delete this.timers[data.roomId];
        }
        // Avanzar ronda
        const advanced = this.roomsService.nextRound(data.roomId);
        const updatedRoom = this.roomsService.getRoom(data.roomId);
        if (advanced && updatedRoom) {
          this.server.to(data.roomId).emit('newRound', {
            round: updatedRoom.round,
            question: updatedRoom.currentQuestion,
            timer: 10,
          });
          this.startTimer(data.roomId, 10);
        } else if (updatedRoom && !updatedRoom.isActive) {
          // Juego terminado
          const ranking = this.roomsService.getRanking(data.roomId);
          this.server.to(data.roomId).emit('gameEnded', { ranking });
        }
      }
    }
    return result;
  }

  @SubscribeMessage('nextRound')
  handleNextRound(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const advanced = this.roomsService.nextRound(data.roomId);
    const room = this.roomsService.getRoom(data.roomId);
    if (advanced && room) {
      this.server.to(data.roomId).emit('newRound', {
        round: room.round,
        question: room.currentQuestion,
      });
    } else if (room && !room.isActive) {
      // Game ended
      const ranking = this.roomsService.getRanking(data.roomId);
      this.server.to(data.roomId).emit('gameEnded', { ranking });
    }
    return { success: advanced };
  }

  @SubscribeMessage('getRanking')
  handleGetRanking(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ): { ranking: RoomPlayer[] } {
    const ranking = this.roomsService.getRanking(data.roomId);
    return { ranking };
  }
}
