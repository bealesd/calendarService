var storage = require('azure-storage');
var config = require('./config.js');
var storageClient;

module.exports = function () {

    this.setup = function () {
        storageClient = storage.createTableService(config.storageAccount, config.storageKey);
    };

    this.getCalendarRecords = function () {
        return new Promise(function (res, rej) {
            storageClient.createTableIfNotExists(config.storageTableLive, function (error, createResult) {
                if (error) rej();
                if (createResult.isSuccessful) {
                    console.log(`1. Create Table operation executed successfully for: ${config.storageTableLive}\n`);
                    return res();
                }
            });
        }).then(function () {
            return this.getRecords();
        }.bind(this)).then(function (result) {
            return new Promise((res) => { res(result); });
        });
    };

    this.getRecords = function () {
        return new Promise(function (res, rej) {
            let query = new storage.TableQuery();
            storageClient.queryEntities(config.storageTableLive, query, null, function (error, result, response) {
                if (error) rej(error);
                console.log(`2. Ran query operation executed successfully`);
                //var orderResultsByTime = result.entries.sort(function (a, b) {
                //    return a['date'] === b['date'] ? 0 : a['date'] > b['date'] ? 1 : -1;
                //});
                let results = this.parseResults(result.entries);
                res(JSON.stringify(results));
            }.bind(this));
        }.bind(this));
    };

    this.parseResults = function (entries) {
        let jsonArray = [];
        for (let i = 0; i < entries.length; i++)
            jsonArray.push(this.parseResult(entries[i]));
        return jsonArray;
    };

    this.parseResult = function (entry) {
        return {
            id: entry.RowKey._,
            title: entry.title._,
            date: entry.date._
        };
    };

    this.addCalendarRecord = function (jsonRecord) {
        const invertedTimeKey = this.getMaxTimeTicks() - jsonRecord.date;
        let entity = {
            PartitionKey: `${invertedTimeKey}`,
            RowKey: `${invertedTimeKey}`,
            title: jsonRecord.title,
            date: jsonRecord.date
        };
        return this.updateOrReplaceRecord(entity);
    };

    this.getMaxTimeTicks = function () {
        return (new Date(9999, 12, 31, 23, 59, 59, 9999999)).getTime();
    };

    this.updateOrReplaceRecord = function (entity) {
        return new Promise(function (res, rej) {
            storageClient.insertOrReplaceEntity(config.storageTableLive, entity, function (error, result, response) {
                if (!error) {
                    res(entity.RowKey);
                }
                rej();
            }.bind(this));
        }.bind(this));
    };

    this.updateCalendarRecord = function (jsonRecord) {
        var entity = {
            PartitionKey: jsonRecord.id,
            RowKey: jsonRecord.id,
            title: jsonRecord.title,
            time: jsonRecord.time,
            date: jsonRecord.date
        };
        return this.updateOrReplaceRecord(entity);
    };

    this.deleteCalendarRecord = function (id) {
        return new Promise(function (res, rej) {
            this.getRecordById(id).then(function (retrievedEntity) {
                storageClient.deleteEntity(config.storageTableLive, retrievedEntity, function entitiesQueried(error, result) {
                    if (error) {
                        rej();
                    }
                    res(id);
                });
            });
        }.bind(this));
    };

    this.getRecordById = function (id) {
        return new Promise(function (res, rej) {
            storageClient.retrieveEntity(config.storageTableLive, id, id, function (error, result, response) {
                if (error) rej(error);
                res(result);
            }.bind(this));
        }.bind(this));
    };
};