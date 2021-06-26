import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FontlistDocument = Fontlist & Document;

export class List {}

@Schema({ strict: false })
export class Fontlist {
  @Prop({ type: List })
  list: List;
}

export const FontlistSchema = SchemaFactory.createForClass(Fontlist);
