import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { Model } from 'mongoose';
import PQueue from 'p-queue';
import { lastValueFrom } from 'rxjs';

import { FindService } from './find.service';

import { metadataLink, unicodeRangeLink, fontLink } from '../utils/cdnLinks';

import { Font, FontDocument } from '../schemas/font.schema';
import { Downloads } from '../schemas/downloads.schema';
import { Variants } from '../schemas/variants.schema';

import {
  UnicodeRange,
  FontMetadata,
  FontCompareObj,
} from '../interfaces/font.interface';

@Injectable()
export class UpdateService implements OnModuleInit {
  constructor(
    @InjectModel(Font.name) private readonly fontModel: Model<FontDocument>,
    private readonly httpService: HttpService,
    private readonly findService: FindService,
  ) {}
  private readonly logger = new Logger(UpdateService.name);

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
        this.logger.error(`${id} unicode download failed. ${err}`);
      });
    return unicodeData;
  }

  // Update the fontlist on Nest application startup
  async onModuleInit(): Promise<void> {
    await this.updateFonts();
  }

  @Cron('0 0 * * *')
  async updateFonts() {
    this.logger.log('Checking for updates in font data...');
    // Convert existing db to key value pair of fontId:lastModified
    const existingFontDb = await this.findService.findAll({});
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

    // Queue system when handling large number of fonts
    const queue = new PQueue({ concurrency: 32 });

    // Iterate through algolia object and compare
    for (const font in algoliaIndexObj) {
      const algoliaDate = algoliaIndexObj[font];
      const existingDate = existingFontObj[font];
      if (font in existingFontObj && algoliaDate === existingDate) {
        // Continue
      } else {
        queue.add(async () => await this.itemUpdate(font, existingFontObj));
      }
    }

    let count = 0;
    queue.on('active', () => {
      this.logger.log(`Updating font #${++count}.  Queue size: ${queue.size}`);
    });
  }

  private async itemUpdate(font: string, existingFontObj: FontCompareObj) {
    // Download metadata from jsDelivr
    const fontData = await this.callMetadata(font);
    const unicodeData = await this.callUnicode(font);

    // If variable is true, it returns with axes, hence we convert to boolean
    let isVariable = false;
    if (fontData.variable) {
      isVariable = true;
    }

    // Convert metadata into document friendly variants
    const fontVariants: Variants[] = [];
    for (const subset of fontData.subsets) {
      const downloads: Downloads[] = [];
      for (const weight of fontData.weights) {
        for (const style of fontData.styles) {
          const downloadsObj: Downloads = {
            weight,
            style,
            url: fontLink(fontData.fontId, subset, weight, style),
          };
          downloads.push(downloadsObj);
        }
      }

      const variantObj: Variants = {
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
