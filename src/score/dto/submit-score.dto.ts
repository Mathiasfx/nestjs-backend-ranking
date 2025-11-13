import { IsString, IsNumber, Min } from 'class-validator';

export class SubmitScoreDto {
  @IsString()
  game: string; // e.g., 'TRIVIA', 'MEMOTEST'

  @IsNumber()
  @Min(0)
  points: number;
}
