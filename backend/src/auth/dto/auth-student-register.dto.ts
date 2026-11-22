import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

export class AuthStudentRegisterDto {
  @ApiProperty({ example: 'student@example.com', type: String })
  @Transform(lowerCaseTransformer)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'secret123', type: String })
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Camila', type: String })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Morales', type: String })
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: '+57 312 987 6543', type: String })
  @IsOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional({ example: 'EST-2026-042', type: String })
  @IsOptional()
  studentCode?: string | null;
}
