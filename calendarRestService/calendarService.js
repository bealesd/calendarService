var hh = require('./httpHelper');
var httpHelper = new hh();
var cr = require('./calendarRepoAzure');
//var cr = require('./calendarRepoFs');
var calendarRepo = new cr();
calendarRepo.setup();

module.exports = function () {
    this.getCalendarRecords = function (res) {
        return calendarRepo.getCalendarRecords(res)
            .then((result) => {
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end(`records: ${result}`);
            })
            .catch((err) => {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(err);
            });
    };

    this.addOrUpdateCalendarRecord = function (req, res) {
        return httpHelper.parseJsonFromRequest(req)
            .then((result) => {
                if (!this.isValidCalendarRecord(result)) {
                    return new Promise((rej) => { return rej('bad json'); });
                }
                if (this.calendarRecordHasValidId(result)) 
                    return calendarRepo.updateCalendarRecord(result);
                return calendarRepo.addCalendarRecord(result);
            })
            .then((id) => {
                console.log(id);
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end(`posted data: ${id}`);
            })
            .catch((err) => {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(err);
            });
    };

    this.deleteCalendarRecord = function (id, res) {
        return calendarRepo.deleteCalendarRecord(id)
            .then(() => {
                res.writeHead(201, { 'Content-Type': 'text/plain' });
                res.end(`deleted record: ${id}`);
            })
            .catch((err) => {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end(err);
            });
    };

    this.calendarRecordHasValidId = function (json) {
        if (!json.hasOwnProperty('id') || json.id === null || json.id === undefined) {
            return false;
        }
        return true;
    };

    this.isValidCalendarRecord = function (json) {
        jsonProperties = ['title', 'who', 'where', 'time', 'date'];
        for (var i = 0; i < jsonProperties.length; i++) {
            var key = jsonProperties[i];
            if (!json.hasOwnProperty(key)) {
                console.log('property missing');
                return false;
            }

            else if (json[key].length < 2 || json[key].length > 20) {
                return false;
            }
        }
        return true;
    };
};