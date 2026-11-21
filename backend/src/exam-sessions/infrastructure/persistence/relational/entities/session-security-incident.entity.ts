import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ExamSessionEntity } from './exam-session.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity({
  name: 'session_security_incident',
})
export class SessionSecurityIncidentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ExamSessionEntity, {
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

  @Column({ type: 'varchar', length: 50, default: 'FOCUS_LOSS' })
  incidentType: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'int', default: 1 })
  incidentNumber: number;

  @CreateDateColumn()
  createdAt: Date;
}
