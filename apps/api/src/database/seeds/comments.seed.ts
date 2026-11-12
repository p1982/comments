import { Logger } from '@nestjs/common';
import { In, Like, type DataSource } from 'typeorm';

import { CommentsEntity } from '@app/comments/entity/comments.entity';
import { UsersEntity } from '@app/users/entity/users.entity';
import dataSource from '@app/database/data-source';

const ROOT_COUNT = 30;
const SEED_EMAIL_DOMAIN = '@seed.example';
const logger = new Logger('CommentsSeed');

const pad = (value: number): string => String(value).padStart(2, '0');

const seedComments = async (source: DataSource): Promise<{ roots: number; replies: number }> => {
  return await source.transaction(async (manager) => {
    const users = manager.getRepository(UsersEntity);
    const comments = manager.getRepository(CommentsEntity);
    const existing = await users.find({
      where: { email: Like(`%${SEED_EMAIL_DOMAIN}`) },
      withDeleted: true,
    });

    if (existing.length > 0) {
      const ids = existing.map((user) => user.id);
      await comments.delete({ userId: In(ids) });
      await users.delete({ id: In(ids) });
    }

    const savedUsers = await users.save(
      Array.from({ length: ROOT_COUNT }, (_, index) => {
        const number = pad(index + 1);
        return users.create({
          fullName: `User${number}`,
          email: `user${number}${SEED_EMAIL_DOMAIN}`,
          homepage: index % 2 === 0 ? '' : `https://user${number}.example`,
        });
      }),
    );

    const savedRoots = await comments.save(
      savedUsers.map((user, index) => {
        const id = crypto.randomUUID();
        const createdAt = new Date(Date.now() - (ROOT_COUNT - 1 - index) * 60_000);
        return comments.create({
          id,
          rootId: id,
          parentId: null,
          userId: user.id,
          text: `Root comment ${pad(index + 1)}`,
          createdAt,
          updatedAt: createdAt,
        });
      }),
    );

    const replies = savedRoots.flatMap((root, index) =>
      Array.from({ length: index }, (_, childIndex) => {
        const createdAt = new Date(root.createdAt.getTime() + (childIndex + 1) * 1000);
        return comments.create({
          id: crypto.randomUUID(),
          rootId: root.id,
          parentId: root.id,
          userId: root.userId,
          text: `Reply ${pad(childIndex + 1)} to root ${pad(index + 1)}`,
          createdAt,
          updatedAt: createdAt,
        });
      }),
    );

    if (replies.length > 0) {
      await comments.save(replies);
    }

    return { roots: savedRoots.length, replies: replies.length };
  });
};

const run = async (): Promise<void> => {
  await dataSource.initialize();
  try {
    const { roots, replies } = await seedComments(dataSource);
    logger.log(
      `Seeded ${String(roots)} root comments with 0-${String(ROOT_COUNT - 1)} replies (${String(replies)} replies)`,
    );
  } finally {
    await dataSource.destroy();
  }
};

void run().catch((error: unknown) => {
  logger.error(error);
  process.exitCode = 1;
});
