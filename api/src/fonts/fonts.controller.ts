import { Controller, Get, Param, Query, Post, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { FontsService } from './services/fonts.service';
import { FindService } from './services/find.service';
import { UpdateService } from './services/update.service';

import { FontAllResponse, FontResponse } from './interfaces/font.interface';
import { QueriesAll } from './interfaces/queries.interface';

@ApiTags('fonts')
@Controller({ path: 'fonts', version: '1' })
export class FontsController {
  constructor(
    private readonly findService: FindService,
    private readonly fontsService: FontsService,
    private readonly updateService: UpdateService,
  ) {}

  @Get()
  async findAll(@Query() query: QueriesAll): Promise<FontAllResponse[]> {
    return await this.findService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query,
  ): Promise<FontResponse> {
    return await this.findService.findOne(id, query);
  }

  @Get(':id/:file')
  async findFile(
    @Param('id') id: string,
    @Param('file') file: string,
    @Query() query,
  ): Promise<Buffer | undefined> {
    return await this.findService.findFile(id, file, query);
  }

  /* Test routes
  @Post('update')
  async updateFonts() {
    return await this.updateService.updateFonts();
  }

  @Post('example')
  async addExample() {
    return await this.fontsService.addExample();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.fontsService.delete(id);
  }*/
}
