import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { fontFilePath } from '../utils/fontFilePath';
import { fontLink } from '../utils/cdnLinks';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { latestFontVersion } from '../utils/latestFontVersion';
import { genHash } from '../utils/genHash';

@Injectable()
export class FindService {
  constructor(
    @InjectModel(Font.name)
    private readonly fontModel: Model<FontDocument>,
    private readonly httpService: HttpService,
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

  async findFile(
    id: string,
    file: string,
    query: QueriesOne,
  ): Promise<Buffer | undefined> {
    const fontObj = await this.fontModel.findOne({ id }).exec();

    const parsedPath = fontFilePath(file);

    if (!parsedPath) throw new BadRequestException(`Bad font path: ${file}`);

    const version =
      query.version || (await latestFontVersion(this.httpService, id));

    // Search for existing file
    const fontObjFile = fontObj.files.find(
      (file) =>
        file.subset === parsedPath.subset &&
        file.weight === parsedPath.weight &&
        file.style === parsedPath.style &&
        file.ext === parsedPath.ext &&
        file.versions.includes(version),
    );

    if (fontObjFile) return fontObjFile.data;

    const throwNotFound = () => {
      throw new NotFoundException(`Not found: ${id}/${file}`);
    };

    const fontObjVariant = fontObj.variants.find(
      (variant) => variant.subset === parsedPath.subset,
    );

    if (!fontObjVariant) throwNotFound();

    const fontObjVariantDownload = fontObjVariant.downloads.find(
      (download) =>
        download.weight === parsedPath.weight &&
        download.style === parsedPath.style,
    );

    if (!fontObjVariantDownload) throwNotFound();

    const fontObjUrl = fontLink(
      id,
      parsedPath.subset,
      parsedPath.weight,
      parsedPath.style,
      version,
    )[parsedPath.ext === 'ttf' ? 'woff2' : parsedPath.ext];

    if (!fontObjUrl) throwNotFound();

    let fontBuffer: Buffer;

    await lastValueFrom(
      this.httpService.get(fontObjUrl, { responseType: 'arraybuffer' }),
    )
      .then((res: AxiosResponse<Buffer>) => {
        fontBuffer = res.data;
      })
      .catch(throwNotFound);

    if (parsedPath.ext === 'ttf') {
      fontBuffer = Buffer.from(
        await (await import('wawoff2')).decompress(fontBuffer),
      );
    }

    const fontBufferHash = genHash(fontBuffer);

    const fontObjFileFromHash = fontObj.files.find(
      (file) =>
        file.subset === parsedPath.subset &&
        file.weight === parsedPath.weight &&
        file.style === parsedPath.style &&
        file.ext === parsedPath.ext &&
        file.hash === fontBufferHash,
    );

    if (fontObjFileFromHash) {
      fontObjFileFromHash.versions.push(version);
    } else {
      fontObj.files.push({
        ...parsedPath,
        data: fontBuffer,
        hash: fontBufferHash,
        versions: [version],
      });
    }

    await fontObj.save();

    return fontBuffer;
  }
}
