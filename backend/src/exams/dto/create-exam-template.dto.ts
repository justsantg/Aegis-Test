import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExamTypeEnum } from '../exams.enum';
import { CreateQuestionDto } from './create-question.dto';

export class CreateExamTemplateDto {
  @ApiProperty({
    example: 7,
    description: 'ID del nivel (ej. 7 para Nivel 4A)',
  })
  @IsInt()
  @IsNotEmpty()
  levelId: number;

  @ApiPropertyOptional({
    example: '509deb5d-fe99-48c9-ad89-f2e1c852df69',
    description: 'ID del curso para examen personalizado (opcional)',
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({
    enum: ExamTypeEnum,
    example: ExamTypeEnum.MIDTERM,
  })
  @IsEnum(ExamTypeEnum)
  examType: ExamTypeEnum;

  @ApiProperty({ example: 'Midterm Exam 4A - Grammar & Syntax' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Examen intermedio oficial de 30 puntos' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalQuestions?: number;

  @ApiPropertyOptional({ example: 45, description: 'Duración en minutos' })
  @IsOptional()
  @IsInt()
  @Min(5)
  durationMinutes?: number;

  @ApiPropertyOptional({ type: [CreateQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions?: CreateQuestionDto[];
}
