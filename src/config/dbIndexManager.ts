import { Db } from "mongodb";
import { retryFunction } from "../util/retry";
import { ServerError } from "../errors";
import { ErrorCode } from "../types/enums";

export class DbIndexManager {
    private static initialized = false;

    static async initialize(db: Db) {
        if (this.initialized) return;

        try {
            await Promise.all([
                this.createRecipeIndexes(db),
                this.createUserIndexes(db)
            ]);
            this.initialized = true;
        } catch (error) {
            console.error('DB index initialization error: ', error);
            throw new ServerError(
                'creating indexes failed', 
                { location: 'dbIndexManager.initialize' }, 
                ErrorCode.INIT_INDEXES_FAILED
            );
        }
    }
    private static async createUserIndexes(db: Db): Promise<void> {
        await retryFunction(() => db.collection('users').createIndexes([
            {
                key: { 
                    email: 1
                },
                name: 'email_index',
                background: true
            },
            {
                key: { 'ratings.recipeId': 1 },
                name: 'ratings_recipeId_index',
                background: true
            },
            {
                key: { 'ratings.rating': -1, 'ratings.timestamp': -1 },
                name: 'ratings_score_recency_index',
                background: true
            }
        ]),{});
    }

    private static async createRecipeIndexes(db: Db): Promise<void> {
        await retryFunction(() => db.collection('recipes').createIndexes([
            {
                key: { 
                    visibility: 1,
                    'ratings.averageRating': -1,
                    'internalState.isDeleted': 1 
                },
                name: 'public_recipes_index',
                partialFilterExpression: { 
                    'internalState.isDeleted': { $eq: true },
                    visibility: 'public'
                },
                background: true
            },
            {
                key: { 
                    'ratings.averageRating': -1 
                },
                name: 'all_recipes_rating_index',
                background: true
            },
            {
                key: { tags: 1 },
                name: 'public_tags_index',
                partialFilterExpression: {
                    'internalState.isDeleted': { $eq: true }
                },
                background: true
            }
        ]),{});
    }
}