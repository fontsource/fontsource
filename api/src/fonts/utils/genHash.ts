import { createHash } from 'crypto';

export const genHash = (data: Buffer): string => {
  return createHash('md5').update(data).digest('base64');
};
