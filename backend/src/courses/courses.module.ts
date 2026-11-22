import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './infrastructure/persistence/relational/entities/course.entity';
import { CourseEnrollmentEntity } from './infrastructure/persistence/relational/entities/course-enrollment.entity';
import { LevelEntity } from '../levels/infrastructure/persistence/relational/entities/level.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEntity } from '../roles/infrastructure/persistence/relational/entities/role.entity';
import { StatusEntity } from '../statuses/infrastructure/persistence/relational/entities/status.entity';
import { FileEntity } from '../files/infrastructure/persistence/relational/entities/file.entity';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseEnrollmentEntity,
      LevelEntity,
      UserEntity,
      RoleEntity,
      StatusEntity,
      FileEntity,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService, TypeOrmModule],
})
export class CoursesModule {}
