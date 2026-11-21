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
import { CourseModalityEnum } from '../../../../courses.enum';
import { CourseEnrollmentEntity } from './course-enrollment.entity';

@Entity({
  name: 'course',
})
export class CourseEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LevelEntity, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'levelId' })
  level: LevelEntity;

  @ManyToOne(() => UserEntity, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'teacherId' })
  teacher?: UserEntity | null;

  @Column({ type: String, length: 120 })
  courseName: string;

  @Column({
    type: 'enum',
    enum: CourseModalityEnum,
    default: CourseModalityEnum.REGULAR_GROUP,
  })
  courseModality: CourseModalityEnum;

  @Column({ type: 'int', default: 8 })
  capacity: number;

  @Column({ type: 'simple-array' })
  scheduleDays: string[]; // e.g. ['TUESDAY', 'WEDNESDAY', 'THURSDAY']

  @Column({ type: 'time' })
  startTime: string; // e.g. '10:00:00'

  @Column({ type: 'time' })
  endTime: string; // e.g. '12:00:00'

  @Column({ type: String, length: 50, nullable: true })
  classroom?: string | null;

  @Column({ type: String, length: 30 })
  term: string; // e.g. '2026-I'

  @Column({ type: Boolean, default: true })
  isActive: boolean;

  @OneToMany(() => CourseEnrollmentEntity, (enrollment) => enrollment.course)
  enrollments: CourseEnrollmentEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
