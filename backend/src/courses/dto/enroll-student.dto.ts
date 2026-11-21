import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class EnrollStudentDto {
  @ApiProperty({ example: 3, description: 'ID del usuario con rol estudiante' })
  @IsInt()
  @IsNotEmpty()
  studentId: number;
}
