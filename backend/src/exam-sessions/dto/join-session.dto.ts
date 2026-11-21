import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class JoinSessionDto {
  @ApiProperty({
    example: '749-102',
    description: 'PIN de la sesión proyectado por el docente',
  })
  @IsString()
  @IsNotEmpty()
  sessionPin: string;

  @ApiProperty({
    example: 3,
    description: 'ID del estudiante que ingresa a la sesión',
  })
  @IsInt()
  @IsNotEmpty()
  studentId: number;
}
