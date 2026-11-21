import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamTemplateEntity } from './infrastructure/persistence/relational/entities/exam-template.entity';
import { QuestionEntity } from './infrastructure/persistence/relational/entities/question.entity';
import { QuestionOptionEntity } from './infrastructure/persistence/relational/entities/question-option.entity';
import { LevelEntity } from '../levels/infrastructure/persistence/relational/entities/level.entity';
import { CourseEntity } from '../courses/infrastructure/persistence/relational/entities/course.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamTemplateEntity,
      QuestionEntity,
      QuestionOptionEntity,
      LevelEntity,
      CourseEntity,
      UserEntity,
    ]),
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService, TypeOrmModule],
})
export class ExamsModule {}
