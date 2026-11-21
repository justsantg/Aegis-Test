import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LevelEntity } from '../../../../levels/infrastructure/persistence/relational/entities/level.entity';
import { LanguageEntity } from '../../../../languages/infrastructure/persistence/relational/entities/language.entity';
import { LevelTypeEnum } from '../../../../levels/levels.enum';

@Injectable()
export class LevelSeedService {
  constructor(
    @InjectRepository(LevelEntity)
    private readonly levelRepository: Repository<LevelEntity>,
  ) {}

  async run(language: LanguageEntity) {
    const regularCodes = [
      '1A',
      '1B',
      '2A',
      '2B',
      '3A',
      '3B',
      '4A',
      '4B',
      '5A',
      '5B',
      '6A',
      '6B',
      '7A',
      '7B',
      '8A',
      '8B',
      '9A',
      '9B',
      '10A',
      '10B',
    ];

    let order = 1;
    for (const code of regularCodes) {
      const existing = await this.levelRepository.findOne({
        where: { code, language: { id: language.id } },
      });

      if (!existing) {
        await this.levelRepository.save(
          this.levelRepository.create({
            code,
            name: `Nivel ${code}`,
            levelType: LevelTypeEnum.REGULAR,
            hasFinalExam: true,
            orderIndex: order,
            language,
          }),
        );
      }
      order++;
    }

    // Nivel Training (APTIS)
    const existingTraining = await this.levelRepository.findOne({
      where: { code: 'TRAINING', language: { id: language.id } },
    });

    if (!existingTraining) {
      await this.levelRepository.save(
        this.levelRepository.create({
          code: 'TRAINING',
          name: 'Fase Training (Prep. APTIS)',
          levelType: LevelTypeEnum.TRAINING_APTIS,
          hasFinalExam: false,
          orderIndex: 21,
          language,
        }),
      );
    }
  }
}
