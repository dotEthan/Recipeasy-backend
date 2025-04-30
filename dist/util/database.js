"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = exports.mongoConnect = void 0;
const mongodb_1 = require("mongodb");
let _db;
const mongoConnect = (cb) => {
    mongodb_1.MongoClient.connect('mongodb+srv://estrauss:R4edfgt5mo4!@cluster0.8lmxv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(client => {
        //TODO check if needs name or just leave as is
        _db = client.db();
        console.log('connected');
        cb();
    }).catch(err => {
        console.log(err);
        throw err;
    });
};
exports.mongoConnect = mongoConnect;
const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No Database Found';
};
exports.getDb = getDb;
