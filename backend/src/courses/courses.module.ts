import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './infrastructure/persistence/relational/entities/course.entity';
import { CourseEnrollmentEntity } from './infrastructure/persistence/relational/entities/course-enrollment.entity';
import { LevelEntity } from '../levels/infrastructure/persistence/relational/entities/level.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseEnrollmentEntity,
      LevelEntity,
      UserEntity,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService, TypeOrmModule],
})
export class CoursesModule {}
