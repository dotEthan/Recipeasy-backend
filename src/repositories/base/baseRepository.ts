import {
    Collection,
    Document,
    OptionalUnlessRequiredId,
    WithId,
    Filter,
    DeleteResult,
    UpdateResult,
    FindCursor,
    UpdateFilter,
    WithoutId,
    InsertOneResult,
    PipelineStage
} from "mongodb";
import { Database } from "../../config/database";
import { IBaseRepository } from "./baseRepository.interface";
import { ServerError } from "../../errors";
import { PaginationOptions } from "../../types/express";
import { ErrorCode } from "../../types/enums";

/**
 * Base Mongodb Related calls
 * @todo - post - Remove any not currently used
 */
// 

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
    protected collectionName: string;
    protected _collection: Collection<T> | null = null;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }
    
    protected get collection(): Collection<T> {
        if (!this._collection) {
            const db = Database.getInstance().getDb();
            this._collection = db.collection<T>(this.collectionName);
        }
        if (!this._collection) {
            const dbError = new ServerError('MongDB Collection not found', { location: 'baseRepository.get.collection'}, ErrorCode.COLLECTION_NOT_FOUND, false);
            throw dbError;
        }
        return this._collection;
    }

    async findOne(filter: Filter<T>, projection: Document = {}): Promise<WithId<T> | null> {
        return await this.collection.findOne(filter, {projection});
    }

    async findByIndex(filter: Filter<T>): Promise<FindCursor<WithId<T>>> {
        return await this.collection.find(filter);
    }

    async findPaginated(filter: Filter<T>, options: PaginationOptions<T>): Promise<WithId<T>[]> {
        return this.collection
            .find(filter)
            .sort(options.sort || {})
            .skip(options.skip || 0)
            .limit(options.limit || 0)
            .project(options.projection || {})
            .toArray() as Promise<WithId<T>[]>;
    }

    async create(data: Omit<T, '_id'>):  Promise<InsertOneResult<T>> {
        const now = new Date();
        const insertingDocument = {
            ...data,
            createdAt: now,
            updatedAt: now
        } as unknown as OptionalUnlessRequiredId<T>;

        return await this.collection.insertOne(insertingDocument);
    }

    async findOneAndReplace(filter: Filter<T>, updatedData: WithoutId<T>): Promise<WithId<T> | null> {
        const insertingDocument = {
            ...updatedData,
            updatedAt: new Date()
        }
        return await this.collection.findOneAndReplace(filter, insertingDocument, { returnDocument: 'after' });
    }

    async findOneAndUpdate(filter: Filter<T>, updatedData: UpdateFilter<T>): Promise<WithId<T> | null> {
        return await this.collection.findOneAndUpdate(filter, updatedData, { returnDocument: 'after' });
    }

    // Will merge data over existing
    async updateOne(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult> {
        return await this.collection.updateOne(filter, updatedData);
    }

    // Will merge data into existing, no duplicates
    async updateByMergeOneNoDupe(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult> {
        return await this.collection.updateOne(filter, updatedData);
    }

    async delete(filter: Filter<T>): Promise<DeleteResult> {
        return await this.collection.deleteOne(filter);
    }

    async findOneAndDelete(filter: Filter<T>): Promise<WithId<T> | null> {
        return await this.collection.findOneAndDelete(filter);
    }

    async getTotalDocuments(findByData: Filter<T>): Promise<number> {
        return await this.collection.countDocuments(findByData);
    }

    async aggregate<R = T>(pipeline: PipelineStage[]): Promise<R[]> {
        return this.collection.aggregate(pipeline).toArray() as Promise<R[]>;
    }
}