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
import { LanguageEntity } from '../../../../../languages/infrastructure/persistence/relational/entities/language.entity';
import { LevelTypeEnum } from '../../../../levels.enum';

@Entity({
  name: 'level',
})
export class LevelEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => LanguageEntity, (language) => language.levels, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'languageId' })
  language: LanguageEntity;

  @Column({ type: String, length: 15 })
  code: string;

  @Column({ type: String, length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: LevelTypeEnum,
    default: LevelTypeEnum.REGULAR,
  })
  levelType: LevelTypeEnum;

  @Column({ type: Boolean, default: true })
  hasFinalExam: boolean;

  @Column({ type: 'int' })
  orderIndex: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
