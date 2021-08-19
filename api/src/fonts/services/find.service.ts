import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { merge } from 'lodash';

import { Model } from 'mongoose';
import { Font, FontDocument } from '../schemas/font.schema';

import {
  FontAllResponse,
  FontResponse,
  Variants,
  UnicodeRange,
} from '../interfaces/font.interface';
import {
  QueriesAll,
  QueriesOne,
  QueryMongoose,
} from '../interfaces/queries.interface';

@Injectable()
export class FindService {
  constructor(
    @InjectModel(Font.name) private readonly fontModel: Model<FontDocument>,
  ) {}

  async findAll(queries: QueriesAll): Promise<FontAllResponse[]> {
    // An array of query objects for mongo to AND search
    const findArray: QueriesAll[] = [];

    // Each query should be split into an array from commas, then queried with mongo individually
    for (const queryKey in queries) {
      const queryValue = String(queries[queryKey]).split(',');
      queryValue.forEach((value) => {
        if (queryKey === 'weights') {
          findArray.push({ [queryKey]: Number(value) });
        } else {
          findArray.push({ [queryKey]: value });
        }
      });
    }

    // If findArray is empty, do NOT use $and operator as it causes a Mongo error
    const queryMongoose: QueryMongoose =
      findArray.length !== 0 ? { $and: findArray } : <QueryMongoose>{};

    const metadataArray = await this.fontModel
      .find({ ...queryMongoose })
      .sort({ id: 'asc' })
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

    const dbVariants = dbResult.variants;
    const variantsNewArray: Variants[] = [];
    const unicodeRangeArray: UnicodeRange[] = [];

    // Rewrite variants into a format for the API
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

    // Merge into a single object
    const variantsNew: Variants = merge({}, ...variantsNewArray);
    const unicodeRange: UnicodeRange = merge({}, ...unicodeRangeArray);

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
}
