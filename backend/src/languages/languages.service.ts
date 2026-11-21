import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LanguageEntity } from './infrastructure/persistence/relational/entities/language.entity';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(LanguageEntity)
    private readonly languageRepository: Repository<LanguageEntity>,
  ) {}

  async findAll(): Promise<LanguageEntity[]> {
    return this.languageRepository.find({
      order: { id: 'ASC' },
      relations: ['levels'],
    });
  }

  async findOne(id: number): Promise<LanguageEntity> {
    const language = await this.languageRepository.findOne({
      where: { id },
      relations: ['levels'],
    });

    if (!language) {
      throw new NotFoundException(`Language with id ${id} not found`);
    }

    return language;
  }
}
