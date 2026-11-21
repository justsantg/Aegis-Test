import { ApiProperty } from '@nestjs/swagger';

export class Language {
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;

  @ApiProperty({
    type: String,
    example: 'Inglés',
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'EN',
  })
  code: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
