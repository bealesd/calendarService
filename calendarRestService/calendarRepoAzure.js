const uuidv1 = require('uuid/v1');
var storage = require('azure-storage');

var storageClient;
var tableName;

var config = require('./config.js');

module.exports = function () {

    this.setup = function () {
        storageClient = storage.createTableService(config.storageAccount, config.storageKey);
        tableName = "calendar";
    };

    this.getCalendarRecords = function () {
        // create table if needed
        return new Promise(function (res, rej) {

            storageClient.createTableIfNotExists(tableName, function (error, createResult) {
                if (error) rej();
                if (createResult.isSuccessful) {
                    console.log(`1. Create Table operation executed successfully for: ${tableName}\n`);
                    res();
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
            var query = new storage.TableQuery();
            //.top(5).where('PartitionKey eq ?', 'hometasks');
            storageClient.queryEntities(tableName, query, null, function (error, result, response) {
                if (error) rej(error);
                console.log(`2. Ran query operation executed successfully`);
                var results = this.parseResults(result.entries);
                res(JSON.stringify(results));
            }.bind(this));
        }.bind(this));
    };

    this.parseResults = function (entries) {
        var jsonArray = [];
        for (var i = 0; i < entries.length; i++)
            jsonArray.push(this.parseResult(entries[i]));
        return jsonArray;
    };

    this.parseResult = function (entry) {
        return {
            id: entry.RowKey._,
            title: entry.title._,
            who: entry.who._,
            where: entry.where._,
            time: entry.time._,
            date: entry.date._
        };
    };

    this.addCalendarRecord = function (jsonRecord) {
        var id = uuidv1();
        var entity = {
            PartitionKey: id,
            RowKey: id,
            title: jsonRecord.title,
            who: jsonRecord.who,
            where: jsonRecord.where,
            time: jsonRecord.time,
            date: jsonRecord.date
        };
        return this.updateOrReplaceRecord(entity);
    };

    this.updateOrReplaceRecord = function (entity) {
        return new Promise(function (res, rej) {
            storageClient.insertOrReplaceEntity(tableName, entity, function (error, result, response) {
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
            who: jsonRecord.who,
            where: jsonRecord.where,
            time: jsonRecord.time,
            date: jsonRecord.date
        };
        return this.updateOrReplaceRecord(entity);
    };

    this.deleteCalendarRecord = function (id) {
        return new Promise(function (res, rej) {
            this.getRecordById(id).then(function (retrievedEntity) {
                storageClient.deleteEntity(tableName, retrievedEntity, function entitiesQueried(error, result) {
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
            storageClient.retrieveEntity(tableName, id, id, function (error, result, response) {
                if (error) rej(error);
                res(result);
            }.bind(this));
        }.bind(this));
    };

};