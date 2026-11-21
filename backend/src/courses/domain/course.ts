import { ApiProperty } from '@nestjs/swagger';
import { Level } from '../../levels/domain/level';
import { User } from '../../users/domain/user';
import { CourseModalityEnum } from '../courses.enum';

export class Course {
  @ApiProperty({
    type: String,
    example: 'cbcb965b-7b0f-48d6-a212-9c3f0b2fcf00',
  })
  id: string;

  @ApiProperty({
    type: () => Level,
  })
  level: Level;

  @ApiProperty({
    type: () => User,
  })
  teacher?: User | null;

  @ApiProperty({
    type: String,
    example: 'Inglés 4A - Mar/Mié/Jue Mañana',
  })
  courseName: string;

  @ApiProperty({
    enum: CourseModalityEnum,
    example: CourseModalityEnum.REGULAR_GROUP,
  })
  courseModality: CourseModalityEnum;

  @ApiProperty({
    type: Number,
    example: 8,
  })
  capacity: number;

  @ApiProperty({
    type: [String],
    example: ['TUESDAY', 'WEDNESDAY', 'THURSDAY'],
  })
  scheduleDays: string[];

  @ApiProperty({
    type: String,
    example: '10:00:00',
  })
  startTime: string;

  @ApiProperty({
    type: String,
    example: '12:00:00',
  })
  endTime: string;

  @ApiProperty({
    type: String,
    example: 'Aula 3',
  })
  classroom?: string | null;

  @ApiProperty({
    type: String,
    example: '2026-I',
  })
  term: string;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
