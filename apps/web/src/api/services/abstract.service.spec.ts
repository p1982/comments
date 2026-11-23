import type { AxiosInstance } from 'axios';

import AbstractApiServices from './abstract.service';

class CommentsApi extends AbstractApiServices {
  list() {
    return this.get('/comments', { params: { page: 1 } });
  }

  create(body: unknown) {
    return this.post('/comments', body);
  }

  update(body: unknown) {
    return this.put('/comments/1', body);
  }

  remove() {
    return this.delete('/comments/1');
  }
}

describe('AbstractApiServices', () => {
  it('forwards get, post, put, and delete to the axios client', async () => {
    const response = { data: { ok: true } };
    const get = jest.fn().mockResolvedValue(response);
    const post = jest.fn().mockResolvedValue(response);
    const put = jest.fn().mockResolvedValue(response);
    const remove = jest.fn().mockResolvedValue(response);
    const client = { get, post, put, delete: remove } as unknown as AxiosInstance;
    const api = new CommentsApi(client);

    await expect(api.list()).resolves.toBe(response);
    await expect(api.create({ text: 'hi' })).resolves.toBe(response);
    await expect(api.update({ text: 'hi' })).resolves.toBe(response);
    await expect(api.remove()).resolves.toBe(response);

    expect(get).toHaveBeenCalledWith('/comments', { params: { page: 1 } });
    expect(post).toHaveBeenCalledWith('/comments', { text: 'hi' }, undefined);
    expect(put).toHaveBeenCalledWith('/comments/1', { text: 'hi' }, undefined);
    expect(remove).toHaveBeenCalledWith('/comments/1', undefined);
  });
});
