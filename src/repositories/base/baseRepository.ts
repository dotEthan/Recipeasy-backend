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
    UpdateFilter
} from "mongodb";
import { Database } from "../../config/database";
import { CreatedDataResponse } from "../../types/responses";
import { IBaseRepository } from "./baseRepository.interface";


export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
    protected collection: Collection<T>;

    constructor(collectionName: string) {
        const db = Database.getInstance().getDb();
        this.collection = db.collection<T>(collectionName);
    }
    
    async findOne(filter: Filter<T>): Promise<WithId<T> | null> {
        console.log('finding one: ')
        return await this.collection.findOne(filter as Filter<T>);
    }

    async findByIndex(filter: Filter<T>): Promise<FindCursor<WithId<T>>> {
        console.log('finding one: ')
        return this.collection.find(filter);
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

    
    // overwrites 
    async findOneAndUpdate(filter: Filter<T>, updatedData: UpdateFilter<T>): Promise<WithId<T> | null> {
        const response = await this.collection.findOneAndUpdate(filter, updatedData, { returnDocument: 'after' });
        console.log(response);
        return response;
    }

    // Will merge data over existing
    async updateOne(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult> {
        const insertingDocument = {
            ...updatedData,
            updatedAt: new Date()
        }
        const response = await this.collection.updateOne(filter, {$set: insertingDocument});
        console.log(response);
        return response;
    }

    // Will merge data into existing, no duplicates
    async updateOneByMergeNoDupe(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult> {
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

    // TODO Do properly.
    async delete(toDeleteData: Partial<T>): Promise<DeleteResult> {
        const response = await this.collection.deleteOne(toDeleteData._id);
        console.log(response);
        return response;
    }

    async getTotalDocuments(findByData: Filter<T>): Promise<number> {
        return await this.collection.countDocuments(findByData);
    }
}