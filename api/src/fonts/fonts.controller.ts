import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FontsService } from './fonts.service';
import { CreateFontDto } from './dto/create-font.dto';
import { UpdateFontDto } from './dto/update-font.dto';

@Controller('fonts')
export class FontsController {
  constructor(private readonly fontsService: FontsService) {}

  @Post()
  create(@Body() createFontDto: CreateFontDto) {
    return this.fontsService.create(createFontDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFontDto: UpdateFontDto) {
    return this.fontsService.update(+id, updateFontDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fontsService.remove(+id);
  }

  @Get()
  findAll() {
    return this.fontsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fontsService.findOne(+id);
  }
}
