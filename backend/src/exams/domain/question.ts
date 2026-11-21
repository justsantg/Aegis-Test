import { ApiProperty } from '@nestjs/swagger';
import { QuestionTypeEnum } from '../exams.enum';
import { QuestionOption } from './question-option';

export class Question {
  @ApiProperty({
    type: String,
    example: 'a12f60d3-3563-4b62-9721-3965cfd2d148',
  })
  id: string;

  @ApiProperty({
    enum: QuestionTypeEnum,
    example: QuestionTypeEnum.ICFES_MULTIPLE_CHOICE,
  })
  type: QuestionTypeEnum;

  @ApiProperty({
    type: String,
    example: 'Choose the correct option to complete the dialogue.',
  })
  prompt: string;

  @ApiProperty({
    type: String,
    example: 'Mark: Where is Sarah? \n John: She ______ ten minutes ago.',
    required: false,
  })
  contextText?: string | null;

  @ApiProperty({
    type: Number,
    example: 1,
    description:
      'Bloque del 1 al 6 para el modo sincronizado (5 preguntas/bloque)',
  })
  blockNumber: number;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Orden original del reactivo (1 a 30)',
  })
  orderIndex: number;

  @ApiProperty({
    type: Number,
    example: 1.0,
  })
  points: number;

  @ApiProperty({
    type: () => [QuestionOption],
  })
  options: QuestionOption[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
