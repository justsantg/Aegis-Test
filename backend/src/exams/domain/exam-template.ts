import { ApiProperty } from '@nestjs/swagger';
import { Level } from '../../levels/domain/level';
import { User } from '../../users/domain/user';
import { ExamTypeEnum } from '../exams.enum';
import { Question } from './question';

export class ExamTemplate {
  @ApiProperty({
    type: String,
    example: 'ec945bc1-87a4-4a29-873b-5510de163359',
  })
  id: string;

  @ApiProperty({
    type: () => Level,
  })
  level: Level;

  @ApiProperty({
    enum: ExamTypeEnum,
    example: ExamTypeEnum.MIDTERM,
  })
  examType: ExamTypeEnum;

  @ApiProperty({
    type: String,
    example: 'Midterm Exam 4A - Grammar & Syntax',
  })
  title: string;

  @ApiProperty({
    type: String,
    example: 'Examen intermedio oficial de 30 puntos',
    required: false,
  })
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 30,
  })
  totalQuestions: number;

  @ApiProperty({
    type: Number,
    example: 45,
    description: 'Duración límite sugerida en minutos',
  })
  durationMinutes: number;

  @ApiProperty({
    type: () => User,
    required: false,
  })
  createdBy?: User | null;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    type: () => [Question],
  })
  questions: Question[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
