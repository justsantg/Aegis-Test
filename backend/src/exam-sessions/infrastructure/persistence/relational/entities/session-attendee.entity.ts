import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ExamSessionEntity } from './exam-session.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { AttendanceStatusEnum } from '../../../../exam-sessions.enum';
import { StudentAnswerEntity } from './student-answer.entity';

@Entity({
  name: 'session_attendee',
})
@Unique(['session', 'student'])
export class SessionAttendeeEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ExamSessionEntity, (session) => session.attendees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session: ExamSessionEntity;

  @ManyToOne(() => UserEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'studentId' })
  student: UserEntity;

  @Column({
    type: 'enum',
    enum: AttendanceStatusEnum,
    default: AttendanceStatusEnum.PENDING,
  })
  attendanceStatus: AttendanceStatusEnum;

  @Column({ type: 'boolean', default: false })
  whatsappNotified: boolean;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  totalScore?: number | null;

  @Column({ type: 'int', default: 0 })
  focusLossCount: number;

  @Column({ type: 'boolean', default: false })
  isMakeup: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date | null;

  @OneToMany(() => StudentAnswerEntity, (answer) => answer.sessionAttendee, {
    cascade: true,
  })
  answers: StudentAnswerEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
