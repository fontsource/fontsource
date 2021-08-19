import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Font, FontSchema } from './schemas/font.schema';

import { FontsController } from './fonts.controller';

import { FindService } from './services/find.service';
import { FontsService } from './services/fonts.service';
import { UpdateService } from './services/update.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Font.name, schema: FontSchema, collection: 'fonts' },
    ]),
  ],
  controllers: [FontsController],
  providers: [FontsService, FindService, UpdateService],
})
export class FontsModule {}
