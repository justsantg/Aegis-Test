import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSessionEntity } from './infrastructure/persistence/relational/entities/exam-session.entity';
import { SessionAttendeeEntity } from './infrastructure/persistence/relational/entities/session-attendee.entity';
import { StudentAnswerEntity } from './infrastructure/persistence/relational/entities/student-answer.entity';
import { SessionSecurityIncidentEntity } from './infrastructure/persistence/relational/entities/session-security-incident.entity';
import { CourseEntity } from '../courses/infrastructure/persistence/relational/entities/course.entity';
import { CourseEnrollmentEntity } from '../courses/infrastructure/persistence/relational/entities/course-enrollment.entity';
import { ExamTemplateEntity } from '../exams/infrastructure/persistence/relational/entities/exam-template.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEntity } from '../roles/infrastructure/persistence/relational/entities/role.entity';
import { StatusEntity } from '../statuses/infrastructure/persistence/relational/entities/status.entity';
import { FileEntity } from '../files/infrastructure/persistence/relational/entities/file.entity';
import { ExamsModule } from '../exams/exams.module';
import { ExamSessionsService } from './exam-sessions.service';
import { ExamSessionsController } from './exam-sessions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamSessionEntity,
      SessionAttendeeEntity,
      StudentAnswerEntity,
      SessionSecurityIncidentEntity,
      CourseEntity,
      CourseEnrollmentEntity,
      ExamTemplateEntity,
      UserEntity,
      RoleEntity,
      StatusEntity,
      FileEntity,
    ]),
    ExamsModule,
  ],
  controllers: [ExamSessionsController],
  providers: [ExamSessionsService],
  exports: [ExamSessionsService, TypeOrmModule],
})
export class ExamSessionsModule {}
