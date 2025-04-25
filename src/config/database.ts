import { Db, MongoClient } from 'mongodb';
import { DbIndexManager } from './dbIndexManager';
import { retryFunction } from '../util/retry';
import { AppError } from "../errors";

export class Database {
    private static instance: Database;
    private client: MongoClient;
    private db?: Db;

    constructor() {
        const dbUrl = process.env.MONGODB_URI || 'default';
        this.client = new MongoClient(dbUrl);
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async connect(): Promise<void> {
        return retryFunction(async () => {
            await this.client.connect();
            this.db = this.client.db();
            console.log('connected');
        }, {})
    }

    public getDb(): Db {
        if (!this.db) {
            const dbError = new AppError('Database Not Initialized, Must Connect() first.', 404);
            dbError.isOperational = false;
            throw dbError;
        }
        return this.db;
    }

    public async initializeIndexes(): Promise<void> {
      if (!this.db) throw new AppError('Database Not Initialized, Must Connect() first.', 404);
      await DbIndexManager.initialize(this.db);
    }

    public async close(): Promise<void> {
        await this.client.close();
        console.log('Database Connection Closed')
    }
}