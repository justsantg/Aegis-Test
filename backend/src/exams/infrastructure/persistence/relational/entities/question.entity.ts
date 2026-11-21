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
import { ExamTemplateEntity } from './exam-template.entity';
import { QuestionOptionEntity } from './question-option.entity';
import { QuestionTypeEnum } from '../../../../exams.enum';

@Entity({
  name: 'question',
})
export class QuestionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ExamTemplateEntity, (template) => template.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'examTemplateId' })
  examTemplate: ExamTemplateEntity;

  @Column({
    type: 'enum',
    enum: QuestionTypeEnum,
  })
  type: QuestionTypeEnum;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'text', nullable: true })
  contextText?: string | null;

  @Column({ type: 'int', default: 1 })
  blockNumber: number; // 1 a 6

  @Column({ type: 'int' })
  orderIndex: number; // 1 a 30

  @Column({ type: 'decimal', precision: 4, scale: 2, default: 1.0 })
  points: number;

  @OneToMany(() => QuestionOptionEntity, (option) => option.question, {
    cascade: true,
  })
  options: QuestionOptionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
