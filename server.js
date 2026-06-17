const express = require('express');
const http = require('http');
const {server} = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);