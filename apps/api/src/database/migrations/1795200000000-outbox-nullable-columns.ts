import type { MigrationInterface, QueryRunner } from 'typeorm';

export class OutboxNullableColumns1795200000000 implements MigrationInterface {
  name = 'OutboxNullableColumns1795200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "outbox_events"
      ALTER COLUMN "error_message" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "outbox_events"
      ALTER COLUMN "processed_at" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "outbox_events"
      SET "error_message" = ''
      WHERE "error_message" IS NULL
    `);
    await queryRunner.query(`
      UPDATE "outbox_events"
      SET "processed_at" = now()
      WHERE "processed_at" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "outbox_events"
      ALTER COLUMN "error_message" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "outbox_events"
      ALTER COLUMN "processed_at" SET NOT NULL
    `);
  }
}
