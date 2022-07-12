import { Inject } from '@nestjs/common';

export const chunkSizeBytes = 16000000;

export function InjectGridFS() {
  return Inject('GridFS');
}

export { GridFSModule } from './gridfs.module';
export * from './gridfsstream';

export { GridFSBucket } from 'mongoose/node_modules/mongodb';
