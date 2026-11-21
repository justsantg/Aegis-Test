import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { CourseEnrollmentEntity } from '../../../../courses/infrastructure/persistence/relational/entities/course-enrollment.entity';
import { LevelEntity } from '../../../../levels/infrastructure/persistence/relational/entities/level.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { CourseSeedService } from './course-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseEnrollmentEntity,
      LevelEntity,
      UserEntity,
    ]),
  ],
  providers: [CourseSeedService],
  exports: [CourseSeedService],
})
export class CourseSeedModule {}
