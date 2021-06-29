import {
  Controller,
  Get,
  Param,
  Query,
  Body,
  Post,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateFontDto } from '../dto/create-font.dto';
import { FontsService } from '../services/fonts.service';
import { FontAllResponse, FontResponse } from '../interfaces/font.interface';

@ApiTags('fonts')
@Controller('fonts')
export class FontsController {
  constructor(private readonly fontsService: FontsService) {}

  @Get()
  async findAll(@Query() query): Promise<FontAllResponse[]> {
    return await this.fontsService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query,
  ): Promise<FontResponse> {
    return await this.fontsService.findOne(id, query);
  }

  @Post()
  async create(@Body() createFontDto: CreateFontDto) {
    return await this.fontsService.create(createFontDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.fontsService.delete(id);
  }
}
