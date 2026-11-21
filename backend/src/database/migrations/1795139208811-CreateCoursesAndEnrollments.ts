import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoursesAndEnrollments1795139208811 implements MigrationInterface {
  name = 'CreateCoursesAndEnrollments1795139208811';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."course_enrollment_enrollmentstatus_enum" AS ENUM('ACTIVE', 'DROPPED', 'COMPLETED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "course_enrollment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "enrollmentStatus" "public"."course_enrollment_enrollmentstatus_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "courseId" uuid, "studentId" integer, CONSTRAINT "UQ_348f2217051c90157308294015a" UNIQUE ("courseId", "studentId"), CONSTRAINT "PK_3ae773370689173c290163de513" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."course_coursemodality_enum" AS ENUM('REGULAR_GROUP', 'PERSONALIZED_1ON1', 'SEMI_PERSONALIZED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "course" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "courseName" character varying(120) NOT NULL, "courseModality" "public"."course_coursemodality_enum" NOT NULL DEFAULT 'REGULAR_GROUP', "capacity" integer NOT NULL DEFAULT '8', "scheduleDays" text NOT NULL, "startTime" TIME NOT NULL, "endTime" TIME NOT NULL, "classroom" character varying(50), "term" character varying(30) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "levelId" integer, "teacherId" integer, CONSTRAINT "PK_bf95180dd756fd204fb01ce4916" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" ADD CONSTRAINT "FK_59e16bd8605d12d48dd554e4c03" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" ADD CONSTRAINT "FK_f56e46a62d53037bde7b8bde36b" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" ADD CONSTRAINT "FK_9679d37e8ce033b56d27e271609" FOREIGN KEY ("levelId") REFERENCES "level"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" ADD CONSTRAINT "FK_3e002f760e8099dd5796e5dc93b" FOREIGN KEY ("teacherId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "course" DROP CONSTRAINT "FK_3e002f760e8099dd5796e5dc93b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course" DROP CONSTRAINT "FK_9679d37e8ce033b56d27e271609"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" DROP CONSTRAINT "FK_f56e46a62d53037bde7b8bde36b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_enrollment" DROP CONSTRAINT "FK_59e16bd8605d12d48dd554e4c03"`,
    );
    await queryRunner.query(`DROP TABLE "course"`);
    await queryRunner.query(`DROP TYPE "public"."course_coursemodality_enum"`);
    await queryRunner.query(`DROP TABLE "course_enrollment"`);
    await queryRunner.query(
      `DROP TYPE "public"."course_enrollment_enrollmentstatus_enum"`,
    );
  }
}
