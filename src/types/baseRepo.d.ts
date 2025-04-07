interface IRepository<T> {
    findByIndex(filter: Filter<T>): Promise<FindCursor<WithId<T>>>;
}

export interface IEntity extends Document {
    _id: ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
  }