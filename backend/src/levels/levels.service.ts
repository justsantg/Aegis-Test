import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LevelEntity } from './infrastructure/persistence/relational/entities/level.entity';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
  ) {}

  async findAll(languageId?: number): Promise<LevelEntity[]> {
    if (languageId) {
      return this.levelRepository.find({
        where: { language: { id: languageId } },
        order: { orderIndex: 'ASC' },
      });
    }

    return this.levelRepository.find({
      order: { orderIndex: 'ASC' },
    });
  }

  async findOne(id: number): Promise<LevelEntity> {
    const level = await this.levelRepository.findOne({
      where: { id },
    });

    if (!level) {
      throw new NotFoundException(`Level with id ${id} not found`);
    }

    return level;
  }
}
