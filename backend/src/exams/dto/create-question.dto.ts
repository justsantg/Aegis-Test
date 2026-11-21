import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionTypeEnum } from '../exams.enum';

export class CreateOptionDto {
  @ApiProperty({ example: 'went' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Posición requerida para Sentence Scramble (1, 2, 3...)',
  })
  @IsOptional()
  @IsInt()
  correctPosition?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Identificador del espacio vacío para Cloze (1, 2...)',
  })
  @IsOptional()
  @IsInt()
  blankId?: number;
}

export class CreateQuestionDto {
  @ApiProperty({
    enum: QuestionTypeEnum,
    example: QuestionTypeEnum.ICFES_MULTIPLE_CHOICE,
  })
  @IsEnum(QuestionTypeEnum)
  type: QuestionTypeEnum;

  @ApiProperty({
    example: 'Choose the correct option to complete the dialogue.',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({
    example: 'Mark: Where is Sarah? \n John: She ______ ten minutes ago.',
  })
  @IsOptional()
  @IsString()
  contextText?: string;

  @ApiProperty({
    example: 1,
    description:
      'Bloque del 1 al 6 para el modo sincronizado (5 preguntas por bloque)',
  })
  @IsInt()
  blockNumber: number;

  @ApiProperty({
    example: 1,
    description: 'Número de orden de la pregunta (1 a 30)',
  })
  @IsInt()
  orderIndex: number;

  @ApiPropertyOptional({ example: 1.0, default: 1.0 })
  @IsOptional()
  @IsNumber()
  points?: number;

  @ApiProperty({ type: [CreateOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}
