import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CommentsIndexMigration1794479372905 implements MigrationInterface {
  name = 'CommentsIndexMigration1794479372905';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_comments_roots_created_at_id"
      ON "comments" ("created_at" DESC, "id" DESC)
      WHERE "parent_id" IS NULL AND "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_comments_roots_user_created_at_id"
      ON "comments" ("user_id", "created_at" DESC, "id" DESC)
      WHERE "parent_id" IS NULL AND "deleted_at" IS NULL
    `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_comments_roots_user_created_at_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_comments_roots_created_at_id"`);
  }
}
