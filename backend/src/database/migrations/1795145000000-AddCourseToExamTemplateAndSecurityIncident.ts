import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseToExamTemplateAndSecurityIncident1795145000000
  implements MigrationInterface
{
  name = 'AddCourseToExamTemplateAndSecurityIncident1795145000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add courseId to exam_template if it does not exist
    await queryRunner.query(
      `ALTER TABLE "exam_template" ADD COLUMN IF NOT EXISTS "courseId" uuid`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_7e4ec98163e7d4c61a0afbda1c2'
        ) THEN
          ALTER TABLE "exam_template" ADD CONSTRAINT "FK_7e4ec98163e7d4c61a0afbda1c2" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;`,
    );

    // 2. Create session_security_incident table if it does not exist
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "session_security_incident" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "incidentType" character varying(50) NOT NULL DEFAULT 'FOCUS_LOSS',
        "details" text,
        "incidentNumber" integer NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "sessionId" uuid,
        "studentId" integer,
        CONSTRAINT "PK_session_security_incident_id" PRIMARY KEY ("id")
      )`,
    );

    // Foreign keys for session_security_incident
    await queryRunner.query(
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_8e8f215520b5a4fc22ef43bac39'
        ) THEN
          ALTER TABLE "session_security_incident" ADD CONSTRAINT "FK_8e8f215520b5a4fc22ef43bac39" FOREIGN KEY ("sessionId") REFERENCES "exam_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;`,
    );

    await queryRunner.query(
      `DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_672dacf7b3cd35ca7fa8f446b29'
        ) THEN
          ALTER TABLE "session_security_incident" ADD CONSTRAINT "FK_672dacf7b3cd35ca7fa8f446b29" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
        END IF;
      END $$;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session_security_incident" DROP CONSTRAINT IF EXISTS "FK_672dacf7b3cd35ca7fa8f446b29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_security_incident" DROP CONSTRAINT IF EXISTS "FK_8e8f215520b5a4fc22ef43bac39"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "session_security_incident"`);
    await queryRunner.query(
      `ALTER TABLE "exam_template" DROP CONSTRAINT IF EXISTS "FK_7e4ec98163e7d4c61a0afbda1c2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_template" DROP COLUMN IF EXISTS "courseId"`,
    );
  }
}
