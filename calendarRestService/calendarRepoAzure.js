var storage = require('azure-storage');
var config = require('./config.js');

module.exports =
class CalendarRepo {
    constructor() {
        this.storageClient = storage.createTableService(config.storageAccount, config.storageKey);
    }

    getCalendarRecords() {
        return new Promise(function (res, rej) {
            this.storageClient.createTableIfNotExists(config.storageTableLive, function (error, createResult) {
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
    }

    getRecordsForYearAndMonth(year, month) {
        return new Promise(function (res, rej) {
            let query = new storage.TableQuery();
            this.storageClient.queryEntities(config.storageTableLive, query, null, function (error, result, response) {
                if (error) rej(error);
                let recordsForMonthAndYear = []
                const results = this.parseResults(result.entries);
                for (let i = 0; i < results.length; i++) {
                    const record = results[i];
                    const date = new Date(Number.parseInt(record.date))
                    if (date.getFullYear() === year && date.getMonth() === month)
                        recordsForMonthAndYear.push(record);
                }
                res(JSON.stringify(recordsForMonthAndYear));
            }.bind(this));
        }.bind(this));
    }

    getRecords() {
        return new Promise(function (res, rej) {
            let query = new storage.TableQuery();
            this.storageClient.queryEntities(config.storageTableLive, query, null, function (error, result, response) {
                if (error) rej(error);
                //var orderResultsByTime = result.entries.sort(function (a, b) {
                //    return a['date'] === b['date'] ? 0 : a['date'] > b['date'] ? 1 : -1;
                //});
                let results = this.parseResults(result.entries);
                res(JSON.stringify(results));
            }.bind(this));
        }.bind(this));
    }

    parseResults(entries) {
        let jsonArray = [];
        for (let i = 0; i < entries.length; i++)
            jsonArray.push(this.parseResult(entries[i]));
        return jsonArray;
    }

    parseResult(entry) {
        return {
            id: entry.RowKey._,
            title: entry.title._,
            date: entry.date._
        };
    }

    addCalendarRecord(jsonRecord) {
        const invertedTimeKey = this.getMaxTimeTicks() - jsonRecord.date;
        let entity = {
            PartitionKey: `${invertedTimeKey}`,
            RowKey: `${invertedTimeKey}`,
            title: jsonRecord.title,
            date: jsonRecord.date
        };
        return this.updateOrReplaceRecord(entity);
    }

    getMaxTimeTicks() {
        return (new Date(9999, 12, 31, 23, 59, 59, 9999999)).getTime();
    }

    updateOrReplaceRecord(entity) {
        return new Promise(function (res, rej) {
            this.storageClient.insertOrReplaceEntity(config.storageTableLive, entity, function (error, result, response) {
                if (!error) {
                    res(entity.RowKey);
                }
                rej();
            }.bind(this));
        }.bind(this));
    }

    updateCalendarRecord(jsonRecord) {
        var entity = {
            PartitionKey: jsonRecord.id,
            RowKey: jsonRecord.id,
            title: jsonRecord.title,
            time: jsonRecord.time,
            date: jsonRecord.date
        };
        return this.updateOrReplaceRecord(entity);
    }

    deleteCalendarRecord(id) {
        return new Promise(function (res, rej) {
            this.getRecordById(id).then(function (retrievedEntity) {
                this.storageClient.deleteEntity(config.storageTableLive, retrievedEntity, function entitiesQueried(error, result) {
                    if (error) {
                        rej();
                    }
                    res(id);
                });
            }.bind(this));
        }.bind(this));
    }

    getRecordById(id) {
        return new Promise(function (res, rej) {
            this.storageClient.retrieveEntity(config.storageTableLive, id, id, function (error, result, response) {
                if (error) rej(error);
                res(result);
            }.bind(this));
        }.bind(this));
    }

    calendarRecordHasValidId(json) {
        return json.hasOwnProperty('id') && this.isString(json.id) && this.isNotEmptyString(json.id);
    }

    isNotEmptyString(value) {
        return this.isString(value) && value.trim() !== "";
    }

    isString(value) {
        return Object.prototype.toString.call(value) === '[object String]';
    }

    isNumber(value) {
        return Object.prototype.toString.call(value) === '[object Number]';
    }

    isValidCalendarRecord(json) {
        jsonProperties = ['title', 'date'];
        for (let i = 0; i < jsonProperties.length; i++) {
            const key = jsonProperties[i];
            if (!json.hasOwnProperty(key)) return false;
            else if (json[key].length < 1 || json[key].length > 20) return false;
        }
        return true;
    }
}