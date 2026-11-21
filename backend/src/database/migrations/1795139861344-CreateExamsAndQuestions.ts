import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExamsAndQuestions1795139861344 implements MigrationInterface {
  name = 'CreateExamsAndQuestions1795139861344';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."exam_template_examtype_enum" AS ENUM('MIDTERM', 'FINAL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "exam_template" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "examType" "public"."exam_template_examtype_enum" NOT NULL DEFAULT 'MIDTERM', "title" character varying(120) NOT NULL, "description" text, "totalQuestions" integer NOT NULL DEFAULT '30', "durationMinutes" integer NOT NULL DEFAULT '45', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "levelId" integer, "createdById" integer, CONSTRAINT "PK_6b02dd689447ded2d7b273311c3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "question_option" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "isCorrect" boolean NOT NULL DEFAULT false, "correctPosition" integer, "blankId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "questionId" uuid, CONSTRAINT "PK_64f8e42188891f2b0610017c8f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."question_type_enum" AS ENUM('ICFES_MULTIPLE_CHOICE', 'SENTENCE_SCRAMBLE', 'FILL_IN_BLANK', 'SENTENCE_COMPLETION')`,
    );
    await queryRunner.query(
      `CREATE TABLE "question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."question_type_enum" NOT NULL, "prompt" text NOT NULL, "contextText" text, "blockNumber" integer NOT NULL DEFAULT '1', "orderIndex" integer NOT NULL, "points" numeric(4,2) NOT NULL DEFAULT '1', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "examTemplateId" uuid, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_template" ADD CONSTRAINT "FK_fa5cddb829a420f09f7a8aa8082" FOREIGN KEY ("levelId") REFERENCES "level"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_template" ADD CONSTRAINT "FK_72c954442a54e6d205dba751fb4" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_option" ADD CONSTRAINT "FK_ba19747af180520381a117f5986" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "question" ADD CONSTRAINT "FK_fdbd2706b51494e1a6531db1bcd" FOREIGN KEY ("examTemplateId") REFERENCES "exam_template"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "question" DROP CONSTRAINT "FK_fdbd2706b51494e1a6531db1bcd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_option" DROP CONSTRAINT "FK_ba19747af180520381a117f5986"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_template" DROP CONSTRAINT "FK_72c954442a54e6d205dba751fb4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_template" DROP CONSTRAINT "FK_fa5cddb829a420f09f7a8aa8082"`,
    );
    await queryRunner.query(`DROP TABLE "question"`);
    await queryRunner.query(`DROP TYPE "public"."question_type_enum"`);
    await queryRunner.query(`DROP TABLE "question_option"`);
    await queryRunner.query(`DROP TABLE "exam_template"`);
    await queryRunner.query(`DROP TYPE "public"."exam_template_examtype_enum"`);
  }
}
