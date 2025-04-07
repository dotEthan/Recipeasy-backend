import { Db, MongoClient } from 'mongodb';
import { DbIndexManager } from './dbIndexManager';

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
        console.log('connect')
        try {
            console.log('Connecting to Database')
            await this.client.connect();
            console.log('Database Connected')
            this.db = this.client.db();
        } catch(err) {
            console.error('Database Connection error: ', err)
            throw err;
        }
    }

    public getDb(): Db {
        if (!this.db) {
            throw new Error('Database Not Initialized, Must Connect() first.')
        }
        return this.db;
    }

    public async initializeIndexes(): Promise<void> {
      if (!this.db) throw new Error('Connect first');
      await DbIndexManager.initialize(this.db);
    }

    public async close(): Promise<void> {
        await this.client.close();
        console.log('Database Connection Closed')
    }
}