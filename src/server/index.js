'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const readdir = require("recursive-readdir");

const app = express();
const server = require('http').createServer(app);

const port = process.env.PORT || 3200;

app.get('/_health', (req, res) => {
    res.send({
        hello: 'world'
    });
})
  
app.use(bodyParser.json({
    limit: '50mb'
}));

readdir(__dirname + '/api').then((files) => {
    files.forEach((file) => {
        const routeMatch = file.match(/(\/api.*)\/([^-]*)-([^.]*)/);
        const route = routeMatch[1] + '/' + routeMatch[3];
        const method = routeMatch[2];

        console.log('Registered Route: ' + method + ' - ' + route);
        app[method](route, require(file));
    })
    
    app.use(express.static(__dirname + '/public'));

    app.use(function (req, res, next) {
        const file = __dirname + '/public' + req.path.replace(/\/$/, "") + '.pug';
        const renderVariables = {
            urlPath: req.path
        };

        if (fs.existsSync(file)) {
            res.render(file, renderVariables);
        } else if(req.path === '/') {
            res.render(__dirname + '/public/index.pug', renderVariables);
        } else {
            res.send(404, "File Not Found");
        }
    });
    
    server.listen(port);
    console.log(`Listening on localhost:${port}`);
});
