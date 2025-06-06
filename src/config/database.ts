import { Db, MongoClient } from 'mongodb';
import { DbIndexManager } from './dbIndexManager';
import { retryFunction } from '../util/retry';
import { ServerError } from "../errors";
import { ErrorCode } from '../types/enums';

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
        }, {})
    }

    public getDb(): Db {
        if (!this.db) {
            const dbError = new ServerError(
                'Database Not Initialized, Must Connect() first.', 
                { location: 'database.getDb' }, 
                ErrorCode.GET_DB_FAILED, false);
            throw dbError;
        }
        return this.db;
    }

    public async initializeIndexes(): Promise<void> {
      if (!this.db) {
        throw new ServerError(
            'Database Not Initialized, Must Connect() first',
            { location: 'database.getDb' },
            ErrorCode.INIT_INDEXES_FAILED,
            false
        );
      }
      await DbIndexManager.initialize(this.db);
    }

    public async close(): Promise<void> {
        await this.client.close();
    }
}