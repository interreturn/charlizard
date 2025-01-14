const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Replace "*" with your iOS app's domain in production
        methods: ["GET", "POST"]
    },
    path: "/socket.io" // Explicitly define the WebSocket path
});

let users = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('set-user-id', (userId) => {
        users[userId] = socket.id;
        console.log('User ID set:', userId);
        socket.emit('me', userId);
    });

    socket.on('call-user', ({ to, signal }) => {
        const toSocketId = users[to];
        if (toSocketId) {
            io.to(toSocketId).emit('incoming-call', { from: socket.id, signal });
        }
    });

    socket.on('answer-call', ({ to, signal }) => {
        io.to(to).emit('call-accepted', signal);
    });

    socket.on('end-call', ({ to }) => {
        io.to(to).emit('call-ended');
        socket.emit('call-ended');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
