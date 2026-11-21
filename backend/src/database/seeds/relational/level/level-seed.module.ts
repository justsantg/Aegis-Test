import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelEntity } from '../../../../levels/infrastructure/persistence/relational/entities/level.entity';
import { LevelSeedService } from './level-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([LevelEntity])],
  providers: [LevelSeedService],
  exports: [LevelSeedService],
})
export class LevelSeedModule {}
