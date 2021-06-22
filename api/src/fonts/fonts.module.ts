import { Module } from '@nestjs/common';
import { FontsService } from './fonts.service';
import { FontsController } from './fonts.controller';
import { Font, FontSchema } from './schemas/font.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Font.name, schema: FontSchema, collection: 'fonts' },
    ]),
  ],
  controllers: [FontsController],
  providers: [FontsService],
})
export class FontsModule {}
