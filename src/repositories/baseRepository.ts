import { Collection, Document, OptionalUnlessRequiredId, WithId, Filter, DeleteResult, UpdateResult } from "mongodb";
import { Database } from "../config/database";


export abstract class BaseRepository<T extends Document> {
    protected collection: Collection<T>;

    constructor(collectionName: string) {
        const db = Database.getInstance().getDb();
        this.collection = db.collection<T>(collectionName);
    }

    async findOne(findByData: Partial<T>): Promise<WithId<T> | null> {
        console.log('finding one: ', findByData)
        return await this.collection.findOne(findByData as Filter<T>);
    }

    async create(data: Omit<T, '_id'>): Promise<T> {
        const now = new Date();
        const insertingDocument = {
            ...data,
            createdAt: now,
            updatedAt: now
        } as unknown as OptionalUnlessRequiredId<T>;

        const response = await this.collection.insertOne(insertingDocument);

        return { ...insertingDocument, _id: response.insertedId} as T;
    }

    async updateOne(filter: Filter<T>, updatedData: Partial<T>): Promise<UpdateResult> {
        const insertingDocument = {
            ...updatedData,
            updatedAt: new Date()
        }
        const response = await this.collection.updateOne(filter, {$set: insertingDocument});
        console.log(response);
        return response;
    }

    // TODO Do properly.
    async delete(toDeleteData: Partial<T>): Promise<DeleteResult> {
        const response = await this.collection.deleteOne(toDeleteData._id);
        console.log(response);
        return response;
    }
}