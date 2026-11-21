import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CourseModalityEnum } from '../courses.enum';

export class CreateCourseDto {
  @ApiProperty({
    example: 1,
    description: 'ID del nivel (1A a 10B o Training)',
  })
  @IsInt()
  @IsNotEmpty()
  levelId: number;

  @ApiPropertyOptional({ example: 2, description: 'ID del docente asignado' })
  @IsOptional()
  @IsInt()
  teacherId?: number;

  @ApiProperty({ example: 'Inglés 4A - Mar/Mié/Jue Mañana' })
  @IsString()
  @IsNotEmpty()
  courseName: string;

  @ApiProperty({
    enum: CourseModalityEnum,
    example: CourseModalityEnum.REGULAR_GROUP,
  })
  @IsEnum(CourseModalityEnum)
  courseModality: CourseModalityEnum;

  @ApiProperty({ example: 8, description: 'Capacidad de alumnos' })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({
    type: [String],
    example: ['TUESDAY', 'WEDNESDAY', 'THURSDAY'],
  })
  @IsArray()
  scheduleDays: string[];

  @ApiProperty({ example: '10:00:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '12:00:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ example: 'Aula 2' })
  @IsOptional()
  @IsString()
  classroom?: string;

  @ApiProperty({ example: '2026-I' })
  @IsString()
  @IsNotEmpty()
  term: string;
}
