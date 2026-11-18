import type { FileUpload } from 'graphql-upload/processRequest.mjs';

export async function fileUploadToMulter(
  upload: Promise<FileUpload> | undefined,
): Promise<Express.Multer.File | undefined> {
  if (!upload) {
    return undefined;
  }

  const { createReadStream, filename, mimetype, encoding } = await upload;
  const chunks: Buffer[] = [];

  for await (const chunk of createReadStream()) {
    chunks.push(Buffer.isBuffer(chunk) ? Buffer.from(chunk) : Buffer.from(chunk as Uint8Array));
  }

  const buffer = Buffer.concat(chunks);

  return {
    fieldname: 'file',
    originalname: filename,
    encoding,
    mimetype,
    size: buffer.length,
    buffer,
    destination: '',
    filename,
    path: '',
    stream: undefined as never,
  };
}
