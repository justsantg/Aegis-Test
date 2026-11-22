import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFocusLossCountToSessionAttendee1795146000000
  implements MigrationInterface
{
  name = 'AddFocusLossCountToSessionAttendee1795146000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session_attendee" ADD COLUMN IF NOT EXISTS "focusLossCount" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session_attendee" DROP COLUMN IF EXISTS "focusLossCount"`,
    );
  }
}
