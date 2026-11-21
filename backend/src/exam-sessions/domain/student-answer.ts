import { ApiProperty } from '@nestjs/swagger';
import { Question } from '../../exams/domain/question';

export class StudentAnswer {
  @ApiProperty({
    type: String,
    example: '6c1a892b-8a73-45f8-8bb3-42e7b51e0691',
  })
  id: string;

  @ApiProperty({
    type: () => Question,
  })
  question: Question;

  @ApiProperty({
    type: String,
    example: 'went',
  })
  studentResponse: string;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  isCorrect: boolean;

  @ApiProperty({
    type: Number,
    example: 1.0,
  })
  scoreEarned: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
