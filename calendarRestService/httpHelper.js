
module.exports = function () {

    this.parseJsonFromRequest = function (req) {
        return new Promise(function (res, rej) {
            if (req === undefined || req === null || req.length === 0)
                rej('Request not given.');

            var body = '';
            req.on('data', function (chunk) {
                body += chunk.toString();
            });

            req.on('end', () => {
                if (body === undefined || body === null || body.length === 0)
                    rej('Body data null.');
                try {
                    bodyJson = JSON.parse(body.substring(1, body.length - 1));
                    res(bodyJson);
                } catch (e) {
                    rej(`Body data not parsed to json: ${e}`);
                }
            });
        });
    };

};