import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Font, FontSchema } from './schemas/font.schema';

import { FontsController } from './controllers/fonts.controller';

import { FontsService } from './services/fonts.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([
      { name: Font.name, schema: FontSchema, collection: 'fonts' },
    ]),
  ],
  controllers: [FontsController],
  providers: [FontsService],
})
export class FontsModule {}
