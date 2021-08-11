import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { FontlistService } from '../services/fontlist.service';

@ApiTags('fontlist')
@Controller({ path: 'fontlist', version: `1` })
export class FontlistController {
  constructor(private readonly fontlistService: FontlistService) {}

  @Get()
  async getList(): Promise<Record<string, any>> {
    return await this.fontlistService.getList();
  }
}
