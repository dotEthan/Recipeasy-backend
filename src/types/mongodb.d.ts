import { Document, Filter } from 'mongodb';

declare module 'mongodb' {
  export type PipelineStage = {
    $match?: Filter<Document>;
    $sample?: { size: number };
    $project?: Record<string, boolean| 0 | 1>;
    $sort?: Record<string, 1 | -1>;
    $limit?: number;
    $unwind?: string | {
      path: string;
      includeArrayIndex?: string;
      preserveNullAndEmptyArrays?: boolean;
    };
    $lookup?: LookupStage['$lookup'];
    $replaceRoot?: ReplaceRootStage['$replaceRoot'];
    $group?:  GroupStage['$group'];
  };
  
  export type LookupStage = {
    $lookup: {
      from: string;
      localField: string;
      foreignField: string;
      as: string;
    };
  };

  export type ReplaceRootStage = {
    $replaceRoot: {
      newRoot: string | Document;
    };
  };

  export type GroupAccumulator<T = unknown> = {
  $sum?: number | T;
  $avg?: T;
  $first?: T;
  $last?: T;
  $max?: T;
  $min?: T;
  $push?: T;
  $addToSet?: T;
  $mergeObjects?: Document;
  $stdDevPop?: T;
  $stdDevSamp?: T;
};

export type GroupStage<T = Document> = {
  $group: {
    _id: string | Document | null;
  } & {
    [field in keyof T]?: GroupAccumulator<T[field]> | unknown;
  };
};
}