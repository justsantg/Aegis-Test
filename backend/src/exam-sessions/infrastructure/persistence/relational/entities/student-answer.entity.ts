import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { SessionAttendeeEntity } from './session-attendee.entity';
import { QuestionEntity } from '../../../../../exams/infrastructure/persistence/relational/entities/question.entity';

@Entity({
  name: 'student_answer',
})
export class StudentAnswerEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SessionAttendeeEntity, (attendee) => attendee.answers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionAttendeeId' })
  sessionAttendee: SessionAttendeeEntity;

  @ManyToOne(() => QuestionEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'questionId' })
  question: QuestionEntity;

  @Column({ type: 'text' })
  studentResponse: string;

  @Column({ type: 'boolean' })
  isCorrect: boolean;

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 0.0 })
  scoreEarned: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
