import { NestFactory } from '@nestjs/core';
import { RoleSeedService } from './role/role-seed.service';
import { SeedModule } from './seed.module';
import { StatusSeedService } from './status/status-seed.service';
import { UserSeedService } from './user/user-seed.service';
import { LanguageSeedService } from './language/language-seed.service';
import { LevelSeedService } from './level/level-seed.service';
import { CourseSeedService } from './course/course-seed.service';
import { ExamSeedService } from './exam/exam-seed.service';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);

  // run
  await app.get(RoleSeedService).run();
  await app.get(StatusSeedService).run();
  await app.get(UserSeedService).run();

  const english = await app.get(LanguageSeedService).run();
  await app.get(LevelSeedService).run(english);

  await app.get(CourseSeedService).run();
  await app.get(ExamSeedService).run();

  await app.close();
  process.exit(0);
};

void runSeed().catch((error) => {
  console.error(error);
  process.exit(1);
});
