import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { FontlistService } from '../services/fontlist.service';

@ApiTags('fontlist')
@Controller('fontlist')
export class FontlistController {
  constructor(private readonly fontlistService: FontlistService) {}

  @Get()
  async getList() {
    return await this.fontlistService.getList();
  }
}
