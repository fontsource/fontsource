import { Injectable } from '@nestjs/common';
import { CreateFontDto } from './dto/create-font.dto';
import { UpdateFontDto } from './dto/update-font.dto';

@Injectable()
export class FontsService {
  create(createFontDto: CreateFontDto) {
    return 'This action adds a new font';
  }

  findAll() {
    return `This action returns all fonts`;
  }

  findOne(id: number) {
    return `This action returns a #${id} font`;
  }

  update(id: number, updateFontDto: UpdateFontDto) {
    return `This action updates a #${id} font`;
  }

  remove(id: number) {
    return `This action removes a #${id} font`;
  }
}
