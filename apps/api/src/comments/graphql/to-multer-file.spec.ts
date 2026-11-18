import { Readable } from 'node:stream';

import type { FileUpload } from 'graphql-upload/processRequest.mjs';

import { fileUploadToMulter } from './to-multer-file';

describe('fileUploadToMulter', () => {
  it('returns undefined when there is no upload', async () => {
    await expect(fileUploadToMulter(undefined)).resolves.toBeUndefined();
  });

  it('reads the upload stream into a multer-like file', async () => {
    const content = Buffer.from('hello');
    const file: FileUpload = {
      filename: 'note.txt',
      mimetype: 'text/plain',
      encoding: '7bit',
      createReadStream: () => Readable.from([content]),
    };

    await expect(fileUploadToMulter(Promise.resolve(file))).resolves.toEqual(
      expect.objectContaining({
        originalname: 'note.txt',
        mimetype: 'text/plain',
        size: content.length,
        buffer: content,
      }),
    );
  });
});
