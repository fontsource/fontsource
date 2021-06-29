import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { QueriesAll, QueriesOne } from '../interfaces/queries.interface';
import { Font, FontDocument } from '../schemas/font.schema';
import { CreateFontDto } from '../dto/create-font.dto';
import { FontAllResponse, FontResponse } from '../interfaces/font.interface';

@Injectable()
export class FontsService {
  constructor(
    @InjectModel(Font.name) private readonly fontModel: Model<FontDocument>,
  ) {}

  async findAll(query: QueriesAll): Promise<FontAllResponse[]> {
    console.log(query);

    const metadataArray = await this.fontModel.find().exec();
    const cleanedArray = metadataArray.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ variants, ...metadata }) => metadata,
    );
    return cleanedArray;
  }

  async findOne(id: string, query: QueriesOne): Promise<FontResponse> {
    console.log(query);
    const dbResult = await this.fontModel.findOne({ id }).exec();

    const unicodeRange = {};
    const dbVariants = dbResult.variants;
    let variantsNew = {};

    dbVariants.forEach((variant) => {
      const subset = variant.subset;
      variant.downloads.forEach((download) => {
        const weight = download.weight;
        const style = download.style;
        const url = download.url;

        const newObject = {
          [weight]: {
            [style]: {
              [subset]: {
                url,
              },
            },
          },
        };

        variantsNew = Object.assign(variantsNew, newObject);
      });
    });

    const metadata = {
      id: dbResult.id,
      family: dbResult.family,
      subsets: dbResult.subsets,
      weights: dbResult.weights,
      styles: dbResult.styles,
      unicodeRange,
      defSubset: dbResult.defSubset,
      variable: dbResult.variable,
      lastModified: dbResult.lastModified,
      category: dbResult.category,
      version: dbResult.version,
      type: dbResult.type,
      variants: variantsNew,
    };

    return metadata;
  }

  async create(createFontDto: CreateFontDto) {
    const createdFont = new this.fontModel(createFontDto);
    return createdFont.save();
  }

  async delete(id: string) {
    return await this.fontModel.findOneAndDelete({ id }).exec();
  }
}
