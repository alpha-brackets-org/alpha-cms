import ImageKit, { toFile } from '@imagekit/nodejs';

export { toFile };

export const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
export const IMAGEKIT_URL_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;

interface CustomImageKit {
  url(options: {
    src?: string;
    path?: string;
    urlEndpoint?: string;
    signed?: boolean;
    expireSeconds?: number;
  }): string;
  files: any;
  helper: any;
}

const imagekit = new ImageKit({
  publicKey: IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: IMAGEKIT_URL_ENDPOINT,
} as unknown as {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
}) as unknown as CustomImageKit;

export function getSignedUrl(src: string, expireSeconds: number = 900) {
  return imagekit.url({
    src: src,
    signed: true,
    expireSeconds: expireSeconds,
  });
}

export default imagekit;
