import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPhoneAndCode1795137954808 implements MigrationInterface {
  name = 'AddUserPhoneAndCode1795137954808';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "phoneNumber" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "studentCode" character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_16a74f04d6e661bde2cbfbb055" ON "user" ("studentCode") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_16a74f04d6e661bde2cbfbb055"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "studentCode"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phoneNumber"`);
  }
}
