import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamTemplateEntity } from '../../../../exams/infrastructure/persistence/relational/entities/exam-template.entity';
import { QuestionEntity } from '../../../../exams/infrastructure/persistence/relational/entities/question.entity';
import { QuestionOptionEntity } from '../../../../exams/infrastructure/persistence/relational/entities/question-option.entity';
import { LevelEntity } from '../../../../levels/infrastructure/persistence/relational/entities/level.entity';
import { ExamSeedService } from './exam-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamTemplateEntity,
      QuestionEntity,
      QuestionOptionEntity,
      LevelEntity,
    ]),
  ],
  providers: [ExamSeedService],
  exports: [ExamSeedService],
})
export class ExamSeedModule {}
