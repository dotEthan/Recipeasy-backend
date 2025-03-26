import { Collection, Document, OptionalUnlessRequiredId, WithId, Filter } from "mongodb";
import { Database } from "../config/database";


export abstract class BaseRepository<T extends Document> {
    protected collection: Collection<T>;

    constructor(collectionName: string) {
        const db = Database.getInstance().getDb();
        this.collection = db.collection<T>(collectionName);
    }

    async findOne(findByData: Partial<T>): Promise<WithId<T> | null> {
        console.log('finding one: ')
        return this.collection.findOne(findByData as Filter<T>);
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
}