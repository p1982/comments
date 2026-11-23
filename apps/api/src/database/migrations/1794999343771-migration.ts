import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1794999343771 implements MigrationInterface {
  name = 'Migration1794999343771';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "password_hash" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "password_hash"
    `);
  }
}
