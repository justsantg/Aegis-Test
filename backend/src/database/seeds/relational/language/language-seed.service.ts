import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LanguageEntity } from '../../../../languages/infrastructure/persistence/relational/entities/language.entity';

@Injectable()
export class LanguageSeedService {
  constructor(
    @InjectRepository(LanguageEntity)
    private readonly repository: Repository<LanguageEntity>,
  ) {}

  async run(): Promise<LanguageEntity> {
    let english = await this.repository.findOne({
      where: { code: 'EN' },
    });

    if (!english) {
      english = await this.repository.save(
        this.repository.create({
          name: 'Inglés',
          code: 'EN',
        }),
      );
    }

    return english;
  }
}
