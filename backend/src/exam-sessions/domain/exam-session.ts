import { ApiProperty } from '@nestjs/swagger';
import { Course } from '../../courses/domain/course';
import { ExamTemplate } from '../../exams/domain/exam-template';
import { User } from '../../users/domain/user';
import { SessionModeEnum, SessionStatusEnum } from '../exam-sessions.enum';
import { SessionAttendee } from './session-attendee';

export class ExamSession {
  @ApiProperty({
    type: String,
    example: '8b7f193c-21a4-4a29-873b-5510de163359',
  })
  id: string;

  @ApiProperty({
    type: () => Course,
  })
  course: Course;

  @ApiProperty({
    type: () => ExamTemplate,
  })
  examTemplate: ExamTemplate;

  @ApiProperty({
    type: () => User,
  })
  teacher: User;

  @ApiProperty({
    type: String,
    example: '749-102',
    description: 'PIN de acceso proyectado en pantalla',
  })
  sessionPin: string;

  @ApiProperty({
    enum: SessionModeEnum,
    example: SessionModeEnum.FREE_PACE,
  })
  mode: SessionModeEnum;

  @ApiProperty({
    enum: SessionStatusEnum,
    example: SessionStatusEnum.IN_PROGRESS,
  })
  status: SessionStatusEnum;

  @ApiProperty({
    type: Number,
    example: 1,
    description: 'Bloque activo (1 a 6) para modo bloques sincronizados',
  })
  currentBlock: number;

  @ApiProperty({ required: false })
  startedAt?: Date | null;

  @ApiProperty({ required: false })
  endedAt?: Date | null;

  @ApiProperty({
    type: () => [SessionAttendee],
  })
  attendees: SessionAttendee[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
