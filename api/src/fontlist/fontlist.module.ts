import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Fontlist, FontlistSchema } from './schemas/fontlist.schema';
import { FontlistController } from './fontlist.controller';
import { FontlistService } from './services/fontlist.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Fontlist.name, schema: FontlistSchema, collection: 'fontlist' },
    ]),
  ],
  controllers: [FontlistController],
  providers: [FontlistService],
})
export class FontlistModule {}
