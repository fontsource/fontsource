import {
  GridFSBucketReadStream,
  GridFSBucketWriteStream,
} from 'mongoose/node_modules/mongodb';

export async function gridFSRead(
  stream: GridFSBucketReadStream,
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const buffer: any[] = [];

    stream.on('data', (chunk) => buffer.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(buffer)));
    stream.on('error', reject);
  });
}

export async function gridFSWrite(
  stream: GridFSBucketWriteStream,
  buffer: Buffer,
) {
  return new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);

    stream.write(buffer);
    stream.end();
  });
}
