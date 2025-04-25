import {
    Collection,
    Document,
    OptionalUnlessRequiredId,
    WithId,
    Filter,
    DeleteResult,
    UpdateResult,
    InsertManyResult,
    FindCursor,
    UpdateFilter,
    WithoutId
} from "mongodb";
import { Database } from "../../config/database";
import { CreatedDataResponse } from "../../types/responses";
import { IBaseRepository } from "./baseRepository.interface";
import { AppError } from "../../util/appError";
import { PaginationOptions } from "../../types/express";

/**
 * Base Mongodb Related calls
 * @todo ensure Interface udpated
 */
// 

export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
    protected collectionName: string;
    protected _collection: Collection<T> | null = null;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }
    
    protected get collection(): Collection<T> {
        console.log('getting')
        if (!this._collection) {
            const db = Database.getInstance().getDb();
            this._collection = db.collection<T>(this.collectionName);
        }
        if (!this._collection) throw new AppError('MongDB Collection not found', 404);
        return this._collection;
    }

    async findOne(filter: Filter<T>, projection: Document = {}): Promise<WithId<T> | null> {
        console.log('finding one: ', projection)
        return await this.collection.findOne(filter, {projection});
    }

    async findByIndex(filter: Filter<T>): Promise<FindCursor<WithId<T>>> {
        console.log('finding one: ')
        return this.collection.find(filter);
    }

    async findPaginated(filter: Filter<T>, options: PaginationOptions<T>): Promise<WithId<T>[]> {
        console.log('finding one: ', options)
        return this.collection
            .find(filter)
            .sort(options.sort || {})
            .skip(options.skip || 0)
            .limit(options.limit || 0)
            .project(options.projection || {})
            .toArray() as Promise<WithId<T>[]>;
    }

    async create(data: Omit<T, '_id'>):  Promise<CreatedDataResponse<T>> {
        const now = new Date();
        const insertingDocument = {
            ...data,
            createdAt: now,
            updatedAt: now
        } as unknown as OptionalUnlessRequiredId<T>;

        const response = await this.collection.insertOne(insertingDocument);
        return { ...insertingDocument, _id: response.insertedId};
    }

    async createMany(data: Omit<T, '_id'>[]):  Promise<InsertManyResult> {
        console.log('saving many')
        const now = new Date();
        const insertingDocuments = data.map(item => ({
            ...item,
            createdAt: now,
            updatedAt: now
        }) as unknown as OptionalUnlessRequiredId<T>);

        return await this.collection.insertMany(insertingDocuments);
    }

    async findOneAndReplace(filter: Filter<T>, updatedData: WithoutId<T>): Promise<WithId<T> | null> {
        const response = await this.collection.findOneAndReplace(filter, updatedData, { returnDocument: 'after' });
        console.log('replaced: ', response);
        return response;
    }
 
    async findOneAndUpdate(filter: Filter<T>, updatedData: UpdateFilter<T>): Promise<WithId<T> | null> {
        const response = await this.collection.findOneAndUpdate(filter, updatedData, { returnDocument: 'after' });
        console.log('updated: ', response);
        return response;
    }

    // Will merge data over existing
    async updateOne(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult> {
        const response = await this.collection.updateOne(filter, updatedData);
        console.log(response);
        return response;
    }

    // Will merge data into existing, no duplicates
    async updateByMergeOneNoDupe(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult> {
        const response = await this.collection.updateOne(filter, updatedData);
        console.log(response);
        return response;
    }

    // Will merge data into existing, allows duplicates
    async updateByMergeOne(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult> {
        const insertingDocument = {
            ...updatedData,
            updatedAt: new Date()
        }
        const response = await this.collection.updateOne(filter, insertingDocument);
        console.log(response);
        return response;
    }

    async delete(filter: Filter<T>): Promise<DeleteResult> {
        const response = await this.collection.deleteOne(filter);
        console.log('deleted: ', response);
        return response;
    }

    async getTotalDocuments(findByData: Filter<T>): Promise<number> {
        return await this.collection.countDocuments(findByData);
    }
}