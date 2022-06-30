import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Zips {
  @Prop()
  hash: string;

  @Prop([String])
  versions: string[];
}

export const ZipsSchema = SchemaFactory.createForClass(Zips);
