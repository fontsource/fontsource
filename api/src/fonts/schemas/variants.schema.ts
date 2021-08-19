import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Downloads, DownloadSchema } from './downloads.schema';

@Schema()
export class Variants {
  @Prop()
  subset: string;

  @Prop()
  unicodeRange: string;

  @Prop({ type: [DownloadSchema], default: [], _id: false })
  downloads: Downloads[];
}

export const VariantsSchema = SchemaFactory.createForClass(Variants);
