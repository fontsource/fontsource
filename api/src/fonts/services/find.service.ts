import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { merge } from 'lodash';
import * as JSZip from 'jszip';

import { Model } from 'mongoose';
import { Font, FontDocument } from '../schemas/font.schema';

import {
  FontAllResponse,
  FontResponse,
  Variants,
  UnicodeRange,
  FontFilePath,
} from '../interfaces/font.interface';
import {
  QueriesAll,
  QueriesOne,
  QueryMongoose,
  QueriesAllIndex,
} from '../interfaces/queries.interface';
import { fontFilePath } from '../utils/fontFilePath';
import { fontLink } from '../utils/cdnLinks';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { latestFontVersion } from '../utils/latestFontVersion';
import { genHash } from '../utils/genHash';
import { mimes } from '../utils/mimes';
import {
  chunkSizeBytes,
  InjectGridFS,
  GridFSBucket,
  gridFSWrite,
  gridFSRead,
} from '../../gridfs';

@Injectable()
export class FindService {
  constructor(
    @InjectModel(Font.name)
    private readonly fontModel: Model<FontDocument>,
    @InjectGridFS()
    private readonly gridFS: GridFSBucket,
    private readonly httpService: HttpService,
  ) {}

  async findAll(queries: QueriesAll): Promise<FontAllResponse[]> {
    // An array of query objects for mongo to AND search
    const findArray: QueriesAll[] = [];

    // Each query should be split into an array from commas, then queried with mongo individually
    for (const queryKey in queries) {
      const queryValue = String(queries[queryKey as QueriesAllIndex]).split(
        ',',
      );
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

    if (dbResult == null) {
      throw new NotFoundException();
    }

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

    // Metadata object
    return {
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
  }

  async findZip(id: string, query: QueriesOne): Promise<Buffer> {
    const NotFound = () => new NotFoundException(`Not found: ${id}/download`);

    const fontObj = await this.fontModel.findOne({ id }).exec();

    if (fontObj == null) throw NotFound();

    const version =
      query.version || (await latestFontVersion(this.httpService, id));

    // Search for existing zip
    const fontObjZip = fontObj.zips.find((zip) =>
      zip.versions.includes(version),
    );

    if (fontObjZip) {
      return await gridFSRead(
        this.gridFS.openDownloadStreamByName(
          `v1/fonts/${id}/${fontObjZip.hash}`,
        ),
      );
    }

    const fileTypes = [
      { ext: 'ttf', dir: 'ttf' },
      { ext: 'woff', dir: 'webfonts' },
      { ext: 'woff2', dir: 'webfonts' },
    ];

    const zip = new JSZip();

    const fontPaths: string[] = [];
    const fontPromises: Array<
      Promise<{
        data: Buffer;
        type: string;
      }>
    > = [];

    for (const { ext, dir } of fileTypes) {
      for (const subset of fontObj.subsets) {
        for (const weight of fontObj.weights) {
          for (const style of fontObj.styles) {
            fontPaths.push(`${dir}/${id}-${subset}-${weight}-${style}.${ext}`);
            fontPromises.push(
              this.findFile(id, { subset, weight, style, ext }, query),
            );
          }
        }
      }
    }

    const fontFiles = await Promise.all(fontPromises);

    for (let i = 0; i < fontPaths.length; i++) {
      zip.file(fontPaths[i], fontFiles[i].data);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const zipBufferHash = genHash(zipBuffer);

    const zipObjFileFromHash = fontObj.files.find(
      (zip) => zip.hash === zipBufferHash,
    );

    if (zipObjFileFromHash) {
      zipObjFileFromHash.versions.push(version);
    } else {
      fontObj.zips.push({
        hash: zipBufferHash,
        versions: [version],
      });
    }

    await fontObj.save();

    await gridFSWrite(
      this.gridFS.openUploadStream(`v1/fonts/${id}/${zipBufferHash}`, {
        chunkSizeBytes,
      }),
      zipBuffer,
    );

    return zipBuffer;
  }

  async findFile(
    id: string,
    file: string | FontFilePath,
    query: QueriesOne,
  ): Promise<{ data: Buffer; type: string }> {
    const NotFound = () => new NotFoundException(`Not found: ${id}/${file}`);

    let fontObj = await this.fontModel.findOne({ id }).exec();

    if (fontObj == null) throw NotFound();

    const parsedPath = typeof file === 'string' ? fontFilePath(file) : file;

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

    if (fontObjFile) {
      return {
        data: await gridFSRead(
          this.gridFS.openDownloadStreamByName(
            `v1/fonts/${id}/${fontObjFile.hash}`,
          ),
        ),
        type: mimes[parsedPath.ext],
      };
    }

    let fontBuffer = Buffer.alloc(0);

    if (parsedPath.ext === 'ttf') {
      fontBuffer = Buffer.from(
        await (
          await import('wawoff2')
        ).decompress(
          (
            await this.findFile(
              id,
              {
                ...parsedPath,
                ext: 'woff2',
              },
              query,
            )
          ).data,
        ),
      );

      fontObj = await this.fontModel.findOne({ _id: fontObj._id }).exec();

      if (fontObj == null) throw NotFound();
    } else {
      const fontObjVariant = fontObj.variants.find(
        (variant) => variant.subset === parsedPath.subset,
      );
      if (!fontObjVariant) throw NotFound();

      const fontObjVariantDownload = fontObjVariant.downloads.find(
        (download) =>
          download.weight === parsedPath.weight &&
          download.style === parsedPath.style,
      );
      if (!fontObjVariantDownload) throw NotFound();

      const parsedPathType: string =
        parsedPath.ext === 'ttf' ? 'woff2' : parsedPath.ext;
      const fontObjUrl = fontLink(
        id,
        parsedPath.subset,
        parsedPath.weight,
        parsedPath.style,
        version,
      )[parsedPathType as 'woff' | 'woff2'];

      if (!fontObjUrl) throw NotFound();

      await lastValueFrom(
        this.httpService.get(fontObjUrl, { responseType: 'arraybuffer' }),
      )
        .then((res: AxiosResponse<Buffer>) => {
          fontBuffer = res.data;
        })
        .catch(() => {
          throw NotFound();
        });
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
        hash: fontBufferHash,
        versions: [version],
      });
    }

    await fontObj.save();

    await gridFSWrite(
      this.gridFS.openUploadStream(`v1/fonts/${id}/${fontBufferHash}`, {
        chunkSizeBytes,
      }),
      fontBuffer,
    );

    return { data: fontBuffer, type: mimes[parsedPath.ext] };
  }
}
