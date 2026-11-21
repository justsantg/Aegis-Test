import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/domain/user';
import { AttendanceStatusEnum } from '../exam-sessions.enum';
import { StudentAnswer } from './student-answer';

export class SessionAttendee {
  @ApiProperty({
    type: String,
    example: '3e7b2185-5df1-43e9-a41e-61c0f4f46991',
  })
  id: string;

  @ApiProperty({
    type: () => User,
  })
  student: User;

  @ApiProperty({
    enum: AttendanceStatusEnum,
    example: AttendanceStatusEnum.PENDING,
  })
  attendanceStatus: AttendanceStatusEnum;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  whatsappNotified: boolean;

  @ApiProperty({
    type: Number,
    example: 28.0,
    required: false,
  })
  totalScore?: number | null;

  @ApiProperty({
    type: Boolean,
    example: false,
  })
  isMakeup: boolean;

  @ApiProperty({ required: false })
  startedAt?: Date | null;

  @ApiProperty({ required: false })
  submittedAt?: Date | null;

  @ApiProperty({
    type: () => [StudentAnswer],
  })
  answers?: StudentAnswer[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
