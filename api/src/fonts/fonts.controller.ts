import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Delete,
  Response,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';

import { FontsService } from './services/fonts.service';
import { FindService } from './services/find.service';
import { UpdateService } from './services/update.service';

import { FontAllResponse, FontResponse } from './interfaces/font.interface';
import { QueriesAll, QueriesOne } from './interfaces/queries.interface';
import { mimes } from './utils/mimes';

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
    return this.findService.findAll(query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: QueriesOne,
  ): Promise<FontResponse> {
    return this.findService.findOne(id, query);
  }

  @Get(':id/download')
  async findZip(
    @Response() res: FastifyReply,
    @Param('id') id: string,
    @Query() query: QueriesOne,
  ): Promise<void> {
    const zipFile = await this.findService.findZip(id, query);
    res.type(mimes.zip);
    res.send(zipFile);
  }

  @Get(':id/:file')
  async findFile(
    @Response() res: FastifyReply,
    @Param('id') id: string,
    @Param('file') file: string,
    @Query() query: QueriesOne,
  ): Promise<void> {
    const fontFile = await this.findService.findFile(id, file, query);
    res.type(fontFile.type);
    res.send(fontFile.data);
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
