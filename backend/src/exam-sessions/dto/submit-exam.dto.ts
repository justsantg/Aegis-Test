import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerItemDto {
  @ApiProperty({
    example: 'ede81dfd-7c04-4612-bd2e-a331a3045658',
    description: 'UUID de la pregunta',
  })
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    example: '7d4aff6e-2461-4e75-91ba-e8a573857a5f',
    description:
      'Respuesta enviada: ID de opción elegida, array ordenado de IDs, mapa de blanks o texto exacto',
  })
  @IsNotEmpty()
  response: any;
}

export class SubmitExamDto {
  @ApiProperty({
    example: 3,
    description: 'ID del estudiante',
  })
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @ApiProperty({ type: [AnswerItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerItemDto)
  answers: AnswerItemDto[];
}
