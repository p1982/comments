import sharp from 'sharp';

import type { ImageKind } from '@comments/shared';

const MAX_WIDTH = 320;
const MAX_HEIGHT = 240;

const fitImage = async (bytes: Buffer, kind: ImageKind): Promise<Buffer> => {
  return await sharp(bytes)
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFormat(kind)
    .toBuffer();
};

export { fitImage };
