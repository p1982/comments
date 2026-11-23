import { ImageKind } from '@comments/shared';

const imageKind = (bytes: Buffer): ImageKind | null => {
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isGif = bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38;
  if (isJpeg) return ImageKind.JPEG;
  if (isPng) return ImageKind.PNG;
  if (isGif) return ImageKind.GIF;
  return null;
};

export { imageKind };
