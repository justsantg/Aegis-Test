import { ApiProperty } from '@nestjs/swagger';
import { Course } from './course';
import { User } from '../../users/domain/user';
import { EnrollmentStatusEnum } from '../courses.enum';

export class CourseEnrollment {
  @ApiProperty({
    type: String,
    example: 'd0cae785-5df1-43e9-a41e-61c0f4f46991',
  })
  id: string;

  @ApiProperty({
    type: () => Course,
  })
  course: Course;

  @ApiProperty({
    type: () => User,
  })
  student: User;

  @ApiProperty({
    enum: EnrollmentStatusEnum,
    example: EnrollmentStatusEnum.ACTIVE,
  })
  enrollmentStatus: EnrollmentStatusEnum;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
