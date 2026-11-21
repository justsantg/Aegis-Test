import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { LevelEntity } from '../../../../../levels/infrastructure/persistence/relational/entities/level.entity';

@Entity({
  name: 'language',
})
export class LanguageEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: String, length: 60 })
  name: string;

  @Column({ type: String, length: 10, unique: true })
  code: string;

  @OneToMany(() => LevelEntity, (level) => level.language)
  levels: LevelEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
