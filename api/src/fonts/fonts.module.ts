import { Module } from '@nestjs/common';
import { FontsService } from './fonts.service';
import { FontsController } from './fonts.controller';

@Module({
  controllers: [FontsController],
  providers: [FontsService],
})
export class FontsModule {}
