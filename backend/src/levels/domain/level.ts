import { ApiProperty } from '@nestjs/swagger';
import { Language } from '../../languages/domain/language';
import { LevelTypeEnum } from '../levels.enum';

export class Level {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: () => Language,
  })
  language: Language;

  @ApiProperty({
    type: String,
    example: '1A',
  })
  code: string;

  @ApiProperty({
    type: String,
    example: 'Nivel 1A',
  })
  name: string;

  @ApiProperty({
    enum: LevelTypeEnum,
    example: LevelTypeEnum.REGULAR,
  })
  levelType: LevelTypeEnum;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  hasFinalExam: boolean;

  @ApiProperty({
    type: Number,
    example: 1,
  })
  orderIndex: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
