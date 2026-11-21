import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLanguageAndLevel1795138306746 implements MigrationInterface {
  name = 'CreateLanguageAndLevel1795138306746';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "language" ("id" SERIAL NOT NULL, "name" character varying(60) NOT NULL, "code" character varying(10) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_465b3173cdddf0ac2d3fe73a33c" UNIQUE ("code"), CONSTRAINT "PK_cc0a99e710eb3733f6fb42b1d4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."level_leveltype_enum" AS ENUM('REGULAR', 'TRAINING_APTIS')`,
    );
    await queryRunner.query(
      `CREATE TABLE "level" ("id" SERIAL NOT NULL, "code" character varying(15) NOT NULL, "name" character varying(100) NOT NULL, "levelType" "public"."level_leveltype_enum" NOT NULL DEFAULT 'REGULAR', "hasFinalExam" boolean NOT NULL DEFAULT true, "orderIndex" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "languageId" integer, CONSTRAINT "PK_d3f1a7a6f09f1c3144bacdc6bcc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "level" ADD CONSTRAINT "FK_7bb30cf5a32b461721289c907ab" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "level" DROP CONSTRAINT "FK_7bb30cf5a32b461721289c907ab"`,
    );
    await queryRunner.query(`DROP TABLE "level"`);
    await queryRunner.query(`DROP TYPE "public"."level_leveltype_enum"`);
    await queryRunner.query(`DROP TABLE "language"`);
  }
}
