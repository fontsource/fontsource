import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Files, FilesSchema } from './files.schema';
import { Variants, VariantsSchema } from './variants.schema';

export type FontDocument = Font & Document;

@Schema()
export class Font {
  @Prop({ unique: true })
  id: string;

  @Prop()
  family: string;

  @Prop()
  subsets: string[];

  @Prop()
  weights: number[];

  @Prop()
  styles: string[];

  @Prop()
  defSubset: string;

  @Prop()
  variable: boolean;

  @Prop()
  lastModified: string;

  @Prop()
  category: string;

  @Prop()
  version: string;

  // @Prop() Upon completion of #156
  // license: string;

  // @Prop()
  // source: string;

  @Prop()
  type: string;

  @Prop({ type: [VariantsSchema], default: [], _id: false })
  variants: Variants[];

  @Prop({ type: [FilesSchema], default: [], _id: false })
  files: Files[];
}

export const FontSchema = SchemaFactory.createForClass(Font);

export const example = {
  id: 'abeezee',
  family: 'ABeeZee',
  subsets: ['latin'],
  weights: [400],
  styles: ['italic', 'normal'],
  defSubset: 'latin',
  variable: false,
  lastModified: '2020-09-02',
  version: 'v14',
  category: 'sans-serif',
  type: 'google',
  variants: [
    {
      subset: 'latin',
      unicodeRange:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
      downloads: [
        {
          weight: 400,
          style: 'normal',
          url: {
            woff2:
              'https://cdn.jsdelivr.net/npm/@fontsource/abeezee/files/abeezee-latin-400-normal.woff2',
            woff: 'https://cdn.jsdelivr.net/npm/@fontsource/abeezee/files/abeezee-latin-400-normal.woff',
            ttf: 'https://api.fontsource.org/v1/fonts/abeezee/latin-400-normal.ttf',
          },
        },
        {
          weight: 400,
          style: 'italic',
          url: {
            woff2:
              'https://cdn.jsdelivr.net/npm/@fontsource/abeezee/files/abeezee-latin-400-italic.woff2',
            woff: 'https://cdn.jsdelivr.net/npm/@fontsource/abeezee/files/abeezee-latin-400-italic.woff',
            ttf: 'https://api.fontsource.org/v1/fonts/abeezee/latin-400-italic.ttf',
          },
        },
      ],
    },
  ],
};
