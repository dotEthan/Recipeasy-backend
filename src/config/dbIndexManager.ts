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
        await retryFunction(() => db.collection('recipes').createIndexes([
            {
                key: { 
                    visibility: 1,
                    'ratings.averageRating': -1
                },
                name: 'visibility_rating_desc_index',
                background: true
            },
            {
                key: {
                    'ratings.averageRating': -1,
                    visibility: 1
                },
                name: 'rating_desc_visibility_index',
                background: true
            },
            {
                key: {
                    tags: 1,
                },
                name: 'tags_index',
                background: true
            },
            {
                key: {
                    tags: 1,
                    visibility: 1
                },
                name: 'tags_visibility_index',
                background: true
            }
        ]),{});
    }
}