export interface FontList {
  [key: string]: string;
}

export interface DownloadMetadata {
  fontId: string;
  fontName: string;
  subsets: string[];
  weights: number[];
  styles: string[];
  defSubset: string;
  variable: false | VariableData;
  lastModified: string;
  version: string;
  category: string;
  source: string;
  license: string;
  type: string;
}

export interface UnicodeData {
  [key: string]: string;
}

export interface VariableData {
  [key: string]: {
    default: string;
    min: string;
    max: string;
    step: string;
  }
}

export interface PackageJson {
  version: string;
}