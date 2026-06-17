const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('createRoom', () => {
        const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();

        socket.join(roomCode);
        console.log(`Room created: ${roomCode}`);

        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', (roomCode) => {
        const room = io.sockets.adapter.rooms.get(roomCode);

        if (room && room.size === 1) {
            socket.join(roomCode);
            socket.emit('roomJoined', roomCode);

            io.to(roomCode).emit('startGame', roomCode);
        }

        else {
            socket.emit('error', 'Room is full or does not exist.');
        }
    });

    socket.on('disconnecting', () => {
        socket.rooms.forEach(room => {
            if (room != socket.id) {
                socket.to(room).emit('opponentLeft');
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});