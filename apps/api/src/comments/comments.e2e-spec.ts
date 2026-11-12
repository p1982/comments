import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Client } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';

import { AppModule } from '@app/app/app.module';

interface CommentBody {
  id: string;
  fullName: string;
  email: string;
  text: string;
  parentId: string | null;
}

const prefix = `/api/v${process.env['API_VERSION'] ?? '1'}`;

const ensureTestDatabase = async () => {
  const admin = new Client({
    host: process.env['DB_HOST'] ?? 'localhost',
    port: Number(process.env['DB_PORT'] ?? '5432'),
    user: process.env['DB_USER'] ?? 'postgres',
    password: process.env['DB_PASSWORD'] ?? '1',
    database: 'postgres',
  });
  await admin.connect();
  const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    'comments_test',
  ]);
  if ((existing.rowCount ?? 0) === 0) {
    await admin.query('CREATE DATABASE comments_test');
  }
  await admin.end();
};

describe('comments API', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    await ensureTestDatabase();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix(prefix.slice(1));
    await app.init();
    dataSource = app.get(DataSource);
    await dataSource.runMigrations();
  });

  beforeEach(async () => {
    await dataSource.query('TRUNCATE TABLE comments, users RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  const server = (): App => app.getHttpServer() as App;

  const postComment = (body: {
    fullName: string;
    email: string;
    text: string;
    parentId?: string;
  }) => request(server()).post(`${prefix}/comments`).send(body);

  it('creates a root comment', async () => {
    const response = await postComment({
      fullName: 'JohnWick',
      email: 'johnwick@gmail.com',
      text: 'Hello, world!',
    }).expect(201);

    const body = response.body as CommentBody;
    expect(body.parentId).toBeNull();
    expect(body.fullName).toBe('JohnWick');
    expect(body.text).toBe('Hello, world!');
  });

  it('keeps a reply out of the root list', async () => {
    const root = await postComment({
      fullName: 'JohnWick',
      email: 'johnwick@gmail.com',
      text: 'Hello, world!',
    }).expect(201);
    const rootBody = root.body as CommentBody;

    const reply = await postComment({
      fullName: 'ReplyUser',
      email: 'reply@test.example',
      text: 'Answer',
      parentId: rootBody.id,
    }).expect(201);
    const replyBody = reply.body as CommentBody;

    expect(replyBody.parentId).toBe(rootBody.id);

    const roots = await request(server()).get(`${prefix}/comments`).expect(200);
    const ids = (roots.body as CommentBody[]).map((comment) => comment.id);
    expect(ids).toContain(rootBody.id);
    expect(ids).not.toContain(replyBody.id);
  });

  it('returns 404 when the parent does not exist', async () => {
    await postComment({
      fullName: 'JohnWick',
      email: 'johnwick@gmail.com',
      text: 'Hello, world!',
      parentId: '00000000-0000-4000-8000-000000000000',
    }).expect(404);
  });

  it('sorts root comments by name, email, and date', async () => {
    const first = await postComment({
      fullName: 'Zoe',
      email: 'zoe@test.example',
      text: 'First',
    }).expect(201);
    const second = await postComment({
      fullName: 'Ann',
      email: 'ann@test.example',
      text: 'Second',
    }).expect(201);
    await postComment({
      fullName: 'Mike',
      email: 'mike@test.example',
      text: 'Third',
    }).expect(201);

    const byName = await request(server())
      .get(`${prefix}/comments`)
      .query({ sort: 'fullName', order: 'asc' })
      .expect(200);
    expect((byName.body as CommentBody[]).map((comment) => comment.fullName)).toEqual([
      'Ann',
      'Mike',
      'Zoe',
    ]);

    const byEmail = await request(server())
      .get(`${prefix}/comments`)
      .query({ sort: 'email', order: 'desc' })
      .expect(200);
    expect((byEmail.body as CommentBody[]).map((comment) => comment.email)).toEqual([
      'zoe@test.example',
      'mike@test.example',
      'ann@test.example',
    ]);

    const olderId = (first.body as CommentBody).id;
    const newerId = (second.body as CommentBody).id;
    await dataSource.query(
      `UPDATE comments SET created_at = NOW() - INTERVAL '1 day' WHERE id = $1`,
      [olderId],
    );

    const byDate = await request(server()).get(`${prefix}/comments`).expect(200);
    const dateIds = (byDate.body as CommentBody[]).map((comment) => comment.id);
    expect(dateIds.indexOf(newerId)).toBeLessThan(dateIds.indexOf(olderId));
  });

  it('returns 25 root comments on a page', async () => {
    for (let index = 1; index <= 26; index += 1) {
      await postComment({
        fullName: `User${String(index).padStart(2, '0')}`,
        email: `user${String(index)}@test.example`,
        text: `Root ${String(index)}`,
      }).expect(201);
    }

    const page1 = await request(server())
      .get(`${prefix}/comments`)
      .query({ page: 1, limit: 25 })
      .expect(200);
    const page2 = await request(server())
      .get(`${prefix}/comments`)
      .query({ page: 2, limit: 25 })
      .expect(200);

    const firstPage = page1.body as CommentBody[];
    const secondPage = page2.body as CommentBody[];
    expect(firstPage).toHaveLength(25);
    expect(secondPage).toHaveLength(1);
    expect(firstPage.map((comment) => comment.id)).not.toContain(secondPage[0]?.id);
  });
});
