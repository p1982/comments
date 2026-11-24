import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CommentVotes1795510000000 implements MigrationInterface {
  name = 'CommentVotes1795510000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "comments"
      ADD COLUMN IF NOT EXISTS "votes_score" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "comment_votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "comment_id" uuid NOT NULL,
        "voter_key" character varying(128) NOT NULL,
        "value" smallint NOT NULL,
        CONSTRAINT "PK_comment_votes_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comment_votes_comment_id" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_comment_votes_comment_id"
      ON "comment_votes" ("comment_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_comment_votes_comment_voter"
      ON "comment_votes" ("comment_id", "voter_key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_comment_votes_comment_voter"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_comment_votes_comment_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "comment_votes"`);
    await queryRunner.query(`ALTER TABLE "comments" DROP COLUMN IF EXISTS "votes_score"`);
  }
}
