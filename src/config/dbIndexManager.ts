import { Db } from "mongodb";

export class DbIndexManager {
    private static initialized = false;

    static async initialize(db: Db) {
        if (this.initialized) return;

        try {
            await this.createRecipeIndexes(db);
            this.initialized = true;
        } catch (error) {
            console.log('DB index initialization error: ', error);
        }
    }

    private static async createRecipeIndexes(db: Db) {
        await db.collection('recipes').createIndexes([
            {
                key: {visibilty: 1, 'ratings.averageRating': -1},
                background: true
            }
        ])
    }
}