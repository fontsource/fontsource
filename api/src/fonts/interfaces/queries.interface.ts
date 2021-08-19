export interface QueriesAll {
  weights?: number;
  styles?: string;
  subsets?: string;
  defSubset?: string;
  category?: string;
  type?: string;
}

export interface QueriesOne {
  version?: string;
}

export interface QueryMongoose {
  $and: QueriesAll[];
}
