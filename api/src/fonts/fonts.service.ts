import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { QueriesAll, QueriesOne } from './interfaces/queries.interface';
import { Font, FontDocument } from './schemas/font.schema';
import { CreateFontDto } from './dto/create-font.dto';

@Injectable()
export class FontsService {
  constructor(
    @InjectModel(Font.name) private readonly fontModel: Model<FontDocument>,
  ) {}

  async findAll(query: QueriesAll) {
    console.log(query);
    return await this.fontModel.find().exec();
  }

  async findOne(id: string, query: QueriesOne) {
    console.log(query);
    return await this.fontModel.findOne({ id }).exec();
  }

  async create(createFontDto: CreateFontDto) {
    const createdFont = new this.fontModel(createFontDto);
    return createdFont.save();
  }
}
