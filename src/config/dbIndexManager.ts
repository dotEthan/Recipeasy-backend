import { Db } from "mongodb";
import { retryFunction } from "../util/retry";

export class DbIndexManager {
    private static initialized = false;

    static async initialize(db: Db) {
        if (this.initialized) return;

        try {
            await this.createRecipeIndexes(db);
            this.initialized = true;
        } catch (error) {
            console.error('DB index initialization error: ', error);
        }
    }

    private static async createRecipeIndexes(db: Db): Promise<void> {
        await retryFunction(() => db.collection('recipes').createIndexes([{ 
            key: {visibilty: 1, 'ratings.averageRating': -1},
            background: true 
        }]),{});
    }
}