import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CommentsParentIdNullable1794405058847 implements MigrationInterface {
  name = 'CommentsParentIdNullable1794405058847';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "parent_id" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "comments" ALTER COLUMN "parent_id" SET NOT NULL`);
  }
}
