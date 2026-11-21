import { ApiProperty } from '@nestjs/swagger';

export class QuestionOption {
  @ApiProperty({
    type: String,
    example: 'd8c4fa01-9a78-43bb-a807-6f5ec85a4721',
  })
  id: string;

  @ApiProperty({
    type: String,
    example: 'went',
  })
  content: string;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  isCorrect?: boolean;

  @ApiProperty({
    type: Number,
    example: 1,
    required: false,
  })
  correctPosition?: number | null;

  @ApiProperty({
    type: Number,
    example: 1,
    required: false,
  })
  blankId?: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
