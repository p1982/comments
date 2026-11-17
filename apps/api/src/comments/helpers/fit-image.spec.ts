import sharp from 'sharp';

import { ImageKind } from '@comments/shared';

import { fitImage } from './fit-image';

describe('fitImage', () => {
  it('leaves a 100x100 image at the same size', async () => {
    const source = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    const fitted = await fitImage(source, ImageKind.PNG);
    const meta = await sharp(fitted).metadata();

    expect(meta.width).toBe(100);
    expect(meta.height).toBe(100);
    expect(meta.format).toBe('png');
  });

  it('shrinks 800x200 to 320x80', async () => {
    const source = await sharp({
      create: { width: 800, height: 200, channels: 3, background: { r: 0, g: 0, b: 0 } },
    })
      .png()
      .toBuffer();

    const fitted = await fitImage(source, ImageKind.JPEG);
    const meta = await sharp(fitted).metadata();

    expect(meta.width).toBe(320);
    expect(meta.height).toBe(80);
    expect(meta.format).toBe('jpeg');
  });
});
