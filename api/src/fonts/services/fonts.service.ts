import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { merge } from 'lodash';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';

import { metadataLink } from '../utils/cdnLinks';

import { example, Font, FontDocument } from '../schemas/font.schema';
import { Fontlist, FontlistDocument } from '../schemas/fontlist.schema';
import { CreateFontDto } from '../dto/create-font.dto';

import {
  FontAllResponse,
  FontResponse,
  Variants,
  UnicodeRange,
} from '../interfaces/font.interface';
import { QueriesAll, QueriesOne } from '../interfaces/queries.interface';

@Injectable()
export class FontsService {
  constructor(
    @InjectModel(Font.name) private readonly fontModel: Model<FontDocument>,
    @InjectModel(Fontlist.name)
    private readonly fontlistModel: Model<FontlistDocument>,
    private httpService: HttpService,
  ) {}

  async findAll(query: QueriesAll): Promise<FontAllResponse[]> {
    const metadataArray = await this.fontModel
      .find({ ...query })
      .lean()
      .exec();
    // Mongoose returns an object with keys in a very different order than intended
    // e.g. starts with subsets and weights instead of id and family
    // Also removes unneeded properties like _id and variants
    const reorderedKeys = metadataArray.map((metadata) => {
      const orderedMetadata = {
        id: metadata.id,
        family: metadata.family,
        subsets: metadata.subsets,
        weights: metadata.weights,
        styles: metadata.styles,
        defSubset: metadata.defSubset,
        variable: metadata.variable,
        lastModified: metadata.lastModified,
        category: metadata.category,
        version: metadata.version,
        type: metadata.type,
      };
      return orderedMetadata;
    });
    return reorderedKeys;
  }

  async findOne(id: string, query: QueriesOne): Promise<FontResponse> {
    const dbResult = await this.fontModel.findOne({ id, ...query }).exec();

    // If db doesn't contain font, check one last time if it exists
    if (dbResult === null) {
      await lastValueFrom(this.httpService.get(metadataLink(id)))
        .then((res) => {
          console.log(res.data);
        })
        .catch(() => {
          throw new NotFoundException(`${id} not found`);
        });
    }

    const dbVariants = dbResult.variants;
    const variantsNewArray: Variants[] = [];
    const unicodeRangeArray: UnicodeRange[] = [];

    dbVariants.forEach((variant) => {
      const subset = variant.subset;
      const unicodeRangeValue = variant.unicodeRange;
      unicodeRangeArray.push({ [subset]: unicodeRangeValue });

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

        variantsNewArray.push(newObject);
      });
    });

    const variantsNew = merge({}, ...variantsNewArray);
    const unicodeRange = merge({}, ...unicodeRangeArray);

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

  async updateFonts(): Promise<void> {
    const fontlistData = await this.fontlistModel.findOne().lean().exec();
    const list = Object.keys(fontlistData.list);
    const existingFontDb = await this.findAll({});
  }

  async create(createFontDto: CreateFontDto) {
    const createdFont = new this.fontModel(createFontDto);
    return createdFont.save();
  }

  async addExample() {
    const font = new this.fontModel(example);
    return font.save();
  }

  async delete(id: string) {
    return await this.fontModel.findOneAndDelete({ id }).exec();
  }
}
