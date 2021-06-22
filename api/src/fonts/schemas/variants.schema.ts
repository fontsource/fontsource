import { Prop } from '@nestjs/mongoose';
import { Downloads } from './downloads.schema';

export class Variants {
  constructor(subset: string, unicodeRange: string, downloads: Downloads[]) {
    this.subset = subset;
    this.unicodeRange = unicodeRange;
    this.downloads = downloads;
  }

  @Prop()
  subset: string;

  @Prop()
  unicodeRange: string;

  @Prop()
  downloads: Downloads[];
}
