const express = require("express");
const http = require('http');

const admin = require('./controller/admin');
const user = require('./controller/user');
const workspace = require('./controller/workspace');

const app = express();
const server = http.createServer(app);
const port = 8080;

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.json());

app.use('/admin', admin);
app.use('/user', user);
app.use('/workspace', workspace);

server.listen(port, () => {
    console.log(`Starting on http://localhost:${port}`);
});