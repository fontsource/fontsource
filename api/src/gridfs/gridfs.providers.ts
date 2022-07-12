import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { GridFSBucket } from '.';

export const gridFSProviders = [
  {
    provide: 'GridFS',
    useFactory: (connection: Connection): GridFSBucket =>
      new GridFSBucket(connection.db),
    inject: [getConnectionToken()],
  },
];
