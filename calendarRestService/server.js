var http = require('http');
var url = require('url');
var cs = require('./calendarService');
var calendarService = new cs();
var port = 8080;

http.createServer(function (request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    if (request.method.toLowerCase() === 'get') {
        calendarService.getCalendarRecords(response);
    }

    else if (request.method.toLowerCase() === 'post') {
        calendarService.addOrUpdateCalendarRecord(request, response);
    }

    else if (request.method.toLowerCase() === 'delete') {
        var id = url.parse(request.url, true).query.id;
        calendarService.deleteCalendarRecord(id, response);
    }

    else {
        response.write(`rest type not supported`);
        response.end();
    }
}).listen(process.env.PORT || port);