import { DeleteResult, Filter, FindCursor, InsertManyResult, UpdateResult, WithId } from 'mongodb';
import { CreatedDataResponse } from '../../types/responses';

export interface IBaseRepository<T> {
    findByIndex(filter: Filter<T>): Promise<FindCursor<WithId<T>>>;
    findOne(filter: Filter<T>): Promise<WithId<T> | null>;
    create(data: Omit<T, '_id'>): Promise<CreatedDataResponse<T>>;
    createMany(data: Omit<T, '_id'>[]): Promise<InsertManyResult<T>>;
    updateOne(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult>;
    updateByMergeOneNoDupe(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult>;
    updateByMergeOne(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult>;
    delete(filter: Filter<T>): Promise<DeleteResult>;
    getTotalDocuments(findByData: Filter<T>): Promise<number>;
}