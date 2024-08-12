const express = require("express");
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const url = require("url")
const { WebSocketServer } = require('ws');

const admin = require('./controller/admin');
const user = require('./controller/user');
const invite = require('./controller/invite');
const workspace = require('./controller/workspace');
const view = require('./controller/view');
const status = require('./controller/status');
const task = require('./controller/task');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server: server });
const port = 8080;

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.json());

app.use('/admin', admin);
app.use('/user', user);
app.use('/invite', invite);
app.use('/workspace', workspace);
app.use('/view', view);
app.use('/status', status);
app.use('/task', task);

//Web Socket Part
const connections = {};
const views = {};

wss.on("connection", (connection, request) => {
    const uuid = uuidv4();
    const host = request.headers.host;
    connections[uuid] = connection;
    
    const [, controller, id] = url.parse(request.url, true).pathname.split('/');
    if(controller == 'view') {
        views[uuid] = {
            id: id
        };
    }

    console.log(`Instance ${uuid} connected`);

    connection.on('message', async (message) => {
        let req = JSON.parse(message);
        try {
            if(req.message == 'Content Change') {
                let res = await fetch(`http://${host}/view/${id}/content`);
                if(res.ok) {
                    let data = await res.json();
                    // BroadCast cho client có cùng view trừ client vừa gửi
                    Object.keys(views).forEach((view_uuid) => {
                        if(views[view_uuid].id == id && view_uuid != uuid) {
                            connections[view_uuid].send(JSON.stringify({
                                message: req.message,
                                content: data
                            }));
                        }
                    })
                }
            }
        } catch (error) {
            console.log(error);
        }
    });

    connection.on('close', () => {
        delete connections[uuid];
        delete views[uuid];
        console.log(`Instance ${uuid} disconnected`)
    });
});

server.listen(port, () => {
    console.log(`Starting on http://localhost:${port}`);
});