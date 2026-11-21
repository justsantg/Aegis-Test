import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelEntity } from './infrastructure/persistence/relational/entities/level.entity';
import { LevelsService } from './levels.service';
import { LevelsController } from './levels.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LevelEntity])],
  controllers: [LevelsController],
  providers: [LevelsService],
  exports: [LevelsService, TypeOrmModule],
})
export class LevelsModule {}
