import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CommentsCreatedAtDesc1794313723207 implements MigrationInterface {
  name = 'CommentsCreatedAtDesc1794313723207';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_comments_created_at_id"
      ON "comments" ("created_at" DESC, "id" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_comments_created_at_id"`);
  }
}
