import { ImageKind } from '@comments/shared';

import { imageKind } from './image-kind';

describe('imageKind', () => {
  it('recognizes jpeg, png and gif headers', () => {
    expect(imageKind(Buffer.from([0xff, 0xd8, 0xff]))).toBe(ImageKind.JPEG);
    expect(imageKind(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(ImageKind.PNG);
    expect(imageKind(Buffer.from([0x47, 0x49, 0x46, 0x38]))).toBe(ImageKind.GIF);
  });

  it('rejects a file with another header', () => {
    expect(imageKind(Buffer.from([0x25, 0x50, 0x44, 0x46]))).toBeNull();
  });
});
