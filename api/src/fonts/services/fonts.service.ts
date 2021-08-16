import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosResponse } from 'axios';
import { merge } from 'lodash';
import { Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';

import { metadataLink, unicodeRangeLink, fontLink } from '../utils/cdnLinks';

import { example, Font, FontDocument } from '../schemas/font.schema';
import { CreateFontDto } from '../dto/create-font.dto';

import {
  FontAllResponse,
  FontResponse,
  Variants,
  UnicodeRange,
  FontMetadata,
  FontCompareObj,
  VariantsDocument,
  DownloadsDocument,
} from '../interfaces/font.interface';
import { QueriesAll, QueriesOne } from '../interfaces/queries.interface';

@Injectable()
export class FontsService {
  constructor(
    @InjectModel(Font.name) private readonly fontModel: Model<FontDocument>,
    private readonly httpService: HttpService,
  ) {}

  // Calls metadata from jsDelivr
  private async callMetadata(id: string): Promise<FontMetadata> {
    let fontData: FontMetadata;
    await lastValueFrom(this.httpService.get(metadataLink(id)))
      .then((res: AxiosResponse<FontMetadata>) => {
        fontData = res.data;
      })
      .catch(() => {
        throw new NotFoundException(`${id} not found`);
      });
    return fontData;
  }

  private async callUnicode(id: string): Promise<UnicodeRange> {
    let unicodeData: UnicodeRange = {};
    await lastValueFrom(this.httpService.get(unicodeRangeLink(id)))
      .then((res: AxiosResponse<UnicodeRange>) => {
        unicodeData = res.data;
      })
      .catch((err) => {
        console.log(`${id} unicode download failed. ${err}`);
      });
    return unicodeData;
  }

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

  async updateFonts() {
    // Convert existing db to key value pair of fontId:lastModified
    const existingFontDb = await this.findAll({});
    let existingFontObj: FontCompareObj = {};
    for (const font of existingFontDb) {
      const fontData = { [font.id]: font.lastModified };
      existingFontObj = Object.assign(existingFontObj, fontData);
    }

    // Convert downloaded algoliaIndex to key value pair of fontId:lastModified - newer data to compare
    const algoliaIndex: AxiosResponse<FontMetadata[]> = await lastValueFrom(
      this.httpService.get('https://fontsource.org/algolia.json'),
    );
    const algoliaIndexData = algoliaIndex.data;
    let algoliaIndexObj: FontCompareObj = {};
    for (const font of algoliaIndexData) {
      const fontData = { [font.fontId]: font.lastModified };
      algoliaIndexObj = Object.assign(algoliaIndexObj, fontData);
    }

    // Iterate through algolia object and compare
    for (const font in algoliaIndexObj) {
      const algoliaDate = algoliaIndexObj[font];
      const existingDate = existingFontObj[font];
      if (font in existingFontObj && algoliaDate === existingDate) {
        // Continue
      } else {
        // Download metadata from jsDelivr
        const fontData = await this.callMetadata(font);
        const unicodeData = await this.callUnicode(font);

        // If variable is true, it returns with axes, hence we convert to boolean
        let isVariable = false;
        if (fontData.variable) {
          isVariable = true;
        }

        // Convert metadata into document friendly variants
        const fontVariants: VariantsDocument[] = [];
        for (const subset of fontData.subsets) {
          const downloads: DownloadsDocument[] = [];
          for (const weight of fontData.weights) {
            for (const style of fontData.styles) {
              const downloadsObj: DownloadsDocument = {
                weight,
                style,
                url: fontLink(fontData.fontId, subset, weight, style),
              };
              downloads.push(downloadsObj);
            }
          }

          const variantObj: VariantsDocument = {
            subset,
            unicodeRange: unicodeData[subset],
            downloads,
          };
          fontVariants.push(variantObj);
        }

        // Ensure match schema, but partial due to other mongo related properties
        const fontObj: Partial<FontDocument> = {
          id: fontData.fontId,
          family: fontData.fontName,
          subsets: fontData.subsets,
          weights: fontData.weights,
          styles: fontData.styles,
          defSubset: fontData.defSubset,
          variable: isVariable,
          lastModified: fontData.lastModified,
          version: fontData.version,
          category: fontData.category,
          type: fontData.type,
          variants: fontVariants,
        };

        if (font in existingFontObj) {
          await this.fontModel.updateOne({ id: font }, fontObj).exec();
        } else {
          const createdFont = new this.fontModel(fontObj);
          await createdFont.save();
        }
      }
    }
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
