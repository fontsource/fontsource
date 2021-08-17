import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { example, Font, FontDocument } from '../schemas/font.schema';

@Injectable()
export class FontsService {
  constructor(
    @InjectModel(Font.name) private readonly fontModel: Model<FontDocument>,
  ) {}

  async addExample() {
    const font = new this.fontModel(example);
    return font.save();
  }

  async delete(id: string) {
    return await this.fontModel.findOneAndDelete({ id }).exec();
  }
}
