import { Module } from '@nestjs/common';
import { gridFSProviders } from './gridfs.providers';

@Module({
  providers: [...gridFSProviders],
  exports: [...gridFSProviders],
})
export class GridFSModule {}
