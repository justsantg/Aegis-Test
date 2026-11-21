import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExamSessionsAndAnswers1795140304812 implements MigrationInterface {
  name = 'CreateExamSessionsAndAnswers1795140304812';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."exam_session_mode_enum" AS ENUM('FREE_PACE', 'SYNC_BLOCKS', 'PAPER_OMR')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."exam_session_status_enum" AS ENUM('WAITING_LOBBY', 'IN_PROGRESS', 'FINISHED', 'CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "exam_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sessionPin" character varying(8) NOT NULL, "mode" "public"."exam_session_mode_enum" NOT NULL DEFAULT 'FREE_PACE', "status" "public"."exam_session_status_enum" NOT NULL DEFAULT 'IN_PROGRESS', "currentBlock" integer NOT NULL DEFAULT '1', "startedAt" TIMESTAMP, "endedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "courseId" uuid, "examTemplateId" uuid, "teacherId" integer, CONSTRAINT "PK_e95661f107b30b65c630381d1e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_09acda94d0b0e5b7ac2bdd6dd0" ON "exam_session" ("sessionPin") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."session_attendee_attendancestatus_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ABSENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "session_attendee" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "attendanceStatus" "public"."session_attendee_attendancestatus_enum" NOT NULL DEFAULT 'PENDING', "whatsappNotified" boolean NOT NULL DEFAULT false, "totalScore" numeric(4,2), "isMakeup" boolean NOT NULL DEFAULT false, "startedAt" TIMESTAMP, "submittedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "sessionId" uuid, "studentId" integer, CONSTRAINT "UQ_e712a86592baceb21186483f60a" UNIQUE ("sessionId", "studentId"), CONSTRAINT "PK_9ba1b78c774ba5e603d40206df0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "student_answer" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "studentResponse" text NOT NULL, "isCorrect" boolean NOT NULL, "scoreEarned" numeric(4,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "sessionAttendeeId" uuid, "questionId" uuid, CONSTRAINT "PK_376adcf5739803c71c22eece43b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_session" ADD CONSTRAINT "FK_5f5e68d6ca98b850b5b80776220" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_session" ADD CONSTRAINT "FK_82182534e275a1186a3c30178fd" FOREIGN KEY ("examTemplateId") REFERENCES "exam_template"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_session" ADD CONSTRAINT "FK_8d87b4fb94e3b81b0fb2c7f50a2" FOREIGN KEY ("teacherId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_attendee" ADD CONSTRAINT "FK_129dc2979bc11a3b68caeb88fc7" FOREIGN KEY ("sessionId") REFERENCES "exam_session"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_attendee" ADD CONSTRAINT "FK_ebac5d174047ad7f2d214bae108" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_answer" ADD CONSTRAINT "FK_d66ce1f494ecaf8cd40eb16dd0e" FOREIGN KEY ("sessionAttendeeId") REFERENCES "session_attendee"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_answer" ADD CONSTRAINT "FK_d1b9efd6286e9c05ed43cf28ae4" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_answer" DROP CONSTRAINT "FK_d1b9efd6286e9c05ed43cf28ae4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_answer" DROP CONSTRAINT "FK_d66ce1f494ecaf8cd40eb16dd0e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_attendee" DROP CONSTRAINT "FK_ebac5d174047ad7f2d214bae108"`,
    );
    await queryRunner.query(
      `ALTER TABLE "session_attendee" DROP CONSTRAINT "FK_129dc2979bc11a3b68caeb88fc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_session" DROP CONSTRAINT "FK_8d87b4fb94e3b81b0fb2c7f50a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_session" DROP CONSTRAINT "FK_82182534e275a1186a3c30178fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "exam_session" DROP CONSTRAINT "FK_5f5e68d6ca98b850b5b80776220"`,
    );
    await queryRunner.query(`DROP TABLE "student_answer"`);
    await queryRunner.query(`DROP TABLE "session_attendee"`);
    await queryRunner.query(
      `DROP TYPE "public"."session_attendee_attendancestatus_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_09acda94d0b0e5b7ac2bdd6dd0"`,
    );
    await queryRunner.query(`DROP TABLE "exam_session"`);
    await queryRunner.query(`DROP TYPE "public"."exam_session_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."exam_session_mode_enum"`);
  }
}
