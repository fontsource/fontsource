export interface FontAllResponse {
  id: string;
  family: string;
  subsets: string[];
  weights: number[];
  styles: string[];
  defSubset: string;
  variable: boolean;
  lastModified: string;
  category: string;
  version: string;
  type: string;
}

export interface FontResponse extends FontAllResponse {
  unicodeRange: UnicodeRange;
  variants: Variants;
}

export interface UnicodeRange {
  [subset: string]: string;
}

export interface Variants {
  [weight: number]: {
    [style: string]: {
      [subset: string]: { url: { woff2: string; woff: string } };
    };
  };
}

export interface FontMetadata {
  fontId: string;
  fontName: string;
  subsets: string[];
  weights: number[];
  styles: string[];
  defSubset: string;
  variable: boolean;
  lastModified: string;
  version: string;
  category: string;
  source: string;
  license: string;
  type: string;
  objectID: string;
}

export interface FontCompareObj {
  [id: string]: string;
}
