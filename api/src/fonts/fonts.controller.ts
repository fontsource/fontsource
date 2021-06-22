import { Controller, Get, Param, Query, Body, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateFontDto } from './dto/create-font.dto';
import { FontsService } from './fonts.service';

@ApiTags('fonts')
@Controller('fonts')
export class FontsController {
  constructor(private readonly fontsService: FontsService) {}

  @Get()
  async findAll(@Query() query) {
    return await this.fontsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query() query) {
    return await this.fontsService.findOne(id, query);
  }

  @Post()
  async create(@Body() createFontDto: CreateFontDto) {
    return await this.fontsService.create(createFontDto);
  }
}
