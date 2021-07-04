import { Module, HttpModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { Font, FontSchema } from './schemas/font.schema';
import { Fontlist, FontlistSchema } from './schemas/fontlist.schema';

import { FontsController } from './controllers/fonts.controller';
import { FontlistController } from './controllers/fontlist.controller';

import { FontsService } from './services/fonts.service';
import { FontlistService } from './services/fontlist.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Font.name, schema: FontSchema, collection: 'fonts' },
    ]),
    MongooseModule.forFeature([
      { name: Fontlist.name, schema: FontlistSchema, collection: 'fontlist' },
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [FontsController, FontlistController],
  providers: [FontsService, FontlistService],
})
export class FontsModule {}
