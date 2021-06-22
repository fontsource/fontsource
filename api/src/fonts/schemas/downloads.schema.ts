import { Prop } from '@nestjs/mongoose';

export class Downloads {
  constructor(weight: number, style: string, url: Url) {
    this.weight = weight;
    this.style = style;
    this.url = url;
  }

  @Prop()
  weight: number;

  @Prop()
  style: string;

  @Prop()
  url: Url;
}

export class Url {
  constructor(woff2: string, woff: string) {
    this.woff2 = woff2;
    this.woff = woff;
  }

  @Prop()
  woff2: string;

  @Prop()
  woff: string;
}
