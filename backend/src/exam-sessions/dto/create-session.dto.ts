import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { SessionModeEnum } from '../exam-sessions.enum';

export class CreateSessionDto {
  @ApiProperty({
    example: '2f33ea98-cfc3-435a-8ba1-5dad81493462',
    description: 'UUID del curso',
  })
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({
    example: '0a3b993a-4e81-4c6d-9a26-f8c9c7a96d94',
    description: 'UUID de la plantilla de examen oficial',
  })
  @IsUUID()
  @IsNotEmpty()
  examTemplateId: string;

  @ApiProperty({
    enum: SessionModeEnum,
    example: SessionModeEnum.FREE_PACE,
    description:
      'Modalidad: FREE_PACE (Libre), SYNC_BLOCKS (Bloques), PAPER_OMR (Papel)',
  })
  @IsEnum(SessionModeEnum)
  mode: SessionModeEnum;
}
