import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
class Url {
  @Prop()
  woff2: string;

  @Prop()
  woff: string;
}

const UrlSchema = SchemaFactory.createForClass(Url);

@Schema()
export class Downloads {
  @Prop()
  weight: number;

  @Prop()
  style: string;

  @Prop({ type: UrlSchema, _id: false })
  url: Url;
}

export const DownloadSchema = SchemaFactory.createForClass(Downloads);
