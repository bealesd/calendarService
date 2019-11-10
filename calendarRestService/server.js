var cr = require('./calendarRepoAzure');
var calendarRepo = new cr();

var port = process.env.PORT || 8080;
var express = require('express');
var app = express();

var allowCrossDomain = function (request, response, next) {
    response.header('Access-Control-Allow-Origin', '*');
    response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    response.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

app.use(allowCrossDomain);
app.use(express.json());

app.get('/events', function (request, response) {
    let month = Number(request.param('month'));
    let year = Number(request.param('year'));
    if (!calendarRepo.isNumber(month) || !calendarRepo.isNumber(year)) {
        return response.status(400).send('Month and year are not numbers.');
    }

    calendarRepo.getRecordsForYearAndMonth(year, month)
        .then((results) => {
            return response.status(201).json(results);
        })
        .catch((err) => {
            console.error(err);
            return response.status(400).send('Get calendar records failed.');
        });
});


app.post('/', function (request, response) {
    let json = request.body;
    calendarRepo.addCalendarRecord(json)
        .then((id) => {
            return response.status(201).json(`posted data: ${id}`);
        })
        .catch((err) => {
            console.error(err.stack);
            return response.status(400).send('Post calendar event failed.');
        });
});

app.put('/', function (request, response) {
    let json = request.body;
    calendarRepo.updateCalendarRecord(json)
        .then((id) => {
            return response.status(201).json(`posted data: ${json.id}`);
        })
        .catch((err) => {
            console.error(err.stack);
            return response.status(400).send('Post calendar event failed.');
        });
});

app.delete('/', function (request, response) {
    const id = request.param('id');
    calendarRepo.deleteCalendarRecord(id)
        .then((id) => {
            return response.status(201).json(`deleted record: ${id}.`);
        })
        .catch((err) => {
            console.error(err.stack);
            return response.status(400).send('Delete calendar event failed.');
        });
});

var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http://%s:%s", host, port);
});