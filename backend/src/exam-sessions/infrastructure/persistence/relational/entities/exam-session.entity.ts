import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CourseEntity } from '../../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { ExamTemplateEntity } from '../../../../../exams/infrastructure/persistence/relational/entities/exam-template.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import {
  SessionModeEnum,
  SessionStatusEnum,
} from '../../../../exam-sessions.enum';
import { SessionAttendeeEntity } from './session-attendee.entity';

@Entity({
  name: 'exam_session',
})
export class ExamSessionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CourseEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: CourseEntity;

  @ManyToOne(() => ExamTemplateEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'examTemplateId' })
  examTemplate: ExamTemplateEntity;

  @ManyToOne(() => UserEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teacherId' })
  teacher: UserEntity;

  @Index()
  @Column({ type: String, length: 8 })
  sessionPin: string; // e.g. '749-102'

  @Column({
    type: 'enum',
    enum: SessionModeEnum,
    default: SessionModeEnum.FREE_PACE,
  })
  mode: SessionModeEnum;

  @Column({
    type: 'enum',
    enum: SessionStatusEnum,
    default: SessionStatusEnum.IN_PROGRESS,
  })
  status: SessionStatusEnum;

  @Column({ type: 'int', default: 1 })
  currentBlock: number; // 1 to 6

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endedAt?: Date | null;

  @OneToMany(() => SessionAttendeeEntity, (attendee) => attendee.session, {
    cascade: true,
  })
  attendees: SessionAttendeeEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
