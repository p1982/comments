import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1794313601862 implements MigrationInterface {
  name = 'Migration1794313601862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "full_name" character varying(100) NOT NULL, "email" character varying(255) NOT NULL, "homepage" character varying(500) NOT NULL, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0adc0a8834ea0f252e96d154de" ON "users" ("full_name") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "user_id" uuid NOT NULL, "parent_id" uuid NOT NULL, "root_id" uuid NOT NULL, "text" text NOT NULL, CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4c675567d2a58f0b07cef09c13" ON "comments" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d6f93329801a93536da4241e38" ON "comments" ("parent_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_15e62f6d7e8bb3bc27cd72fab7" ON "comments" ("root_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "comment_id" uuid NOT NULL, "file_name" character varying(255) NOT NULL, "file_type" character varying(50) NOT NULL, "mime_type" character varying(50) NOT NULL, "file_size" integer NOT NULL, "storage_key" character varying(255) NOT NULL, CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b4b436948b623e8e765bd1c097" ON "attachments" ("comment_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "outbox_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "aggregate_type" character varying(255) NOT NULL, "aggregated_id" uuid NOT NULL, "event_type" character varying(100) NOT NULL, "payload" jsonb NOT NULL, "attempts" integer NOT NULL, "error_message" character varying(100) NOT NULL, "processed_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_6689a16c00d09b8089f6237f1d2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b50affe4c9f635c942ba76c4f4" ON "outbox_events" ("aggregate_type", "aggregated_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dafd7dfdf7c1f0716a857a8298" ON "outbox_events" ("created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attachments" ADD CONSTRAINT "FK_b4b436948b623e8e765bd1c0977" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "attachments" DROP CONSTRAINT "FK_b4b436948b623e8e765bd1c0977"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_dafd7dfdf7c1f0716a857a8298"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b50affe4c9f635c942ba76c4f4"`);
    await queryRunner.query(`DROP TABLE "outbox_events"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b4b436948b623e8e765bd1c097"`);
    await queryRunner.query(`DROP TABLE "attachments"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_15e62f6d7e8bb3bc27cd72fab7"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d6f93329801a93536da4241e38"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_4c675567d2a58f0b07cef09c13"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0adc0a8834ea0f252e96d154de"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
