import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Files {
  @Prop()
  subset: string;

  @Prop()
  weight: number;

  @Prop()
  style: string;

  @Prop()
  ext: string;

  @Prop()
  data: Buffer;

  @Prop()
  hash: string;

  @Prop([String])
  versions: string[];
}

export const FilesSchema = SchemaFactory.createForClass(Files);
