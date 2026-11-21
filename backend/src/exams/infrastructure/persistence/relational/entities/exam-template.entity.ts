import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { LevelEntity } from '../../../../../levels/infrastructure/persistence/relational/entities/level.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { CourseEntity } from '../../../../../courses/infrastructure/persistence/relational/entities/course.entity';
import { ExamTypeEnum } from '../../../../exams.enum';
import { QuestionEntity } from './question.entity';

@Entity({
  name: 'exam_template',
})
export class ExamTemplateEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LevelEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'levelId' })
  level: LevelEntity;

  @ManyToOne(() => CourseEntity, {
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course?: CourseEntity | null;

  @Column({
    type: 'enum',
    enum: ExamTypeEnum,
    default: ExamTypeEnum.MIDTERM,
  })
  examType: ExamTypeEnum;

  @Column({ type: String, length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int', default: 30 })
  totalQuestions: number;

  @Column({ type: 'int', default: 45 })
  durationMinutes: number;

  @ManyToOne(() => UserEntity, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'createdById' })
  createdBy?: UserEntity | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => QuestionEntity, (question) => question.examTemplate, {
    cascade: true,
  })
  questions: QuestionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
