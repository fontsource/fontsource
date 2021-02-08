export interface MetadataProps {
  fontId: string;
  fontName: string;
  subsets: string[];
  weights: number[];
  styles: string;
  defSubset: string;
  variable: false | VariableMetadataProps;
  lastModified: string;
  version: string;
  source: string;
  license: string;
  type: "google" | "icons" | "other";
}

// Pulled from here - https://fonts.google.com/variablefonts#axis-definitions
export interface VariableMetadataProps {
  ital?: AxesProps;
  opsz?: AxesProps;
  slnt?: AxesProps;
  wdth?: AxesProps;
  wght: AxesProps;
  CASL?: AxesProps;
  CSRV?: AxesProps;
  GRAD?: AxesProps;
  MONO?: AxesProps;
  SOFT?: AxesProps;
  WONK?: AxesProps;
  XPRN?: AxesProps;
}

export interface AxesProps {
  default: string;
  min: string;
  max: string;
  step: string;
}

export interface FontPageProps {
  metadata: MetadataProps;
  downloadLink: string;
}
