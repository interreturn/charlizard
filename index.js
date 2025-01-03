const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        // origin: "http://localhost:3000", // Allow requests from React frontend
        // methods: ["GET", "POST"]
    }
});

let users = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Listen for 'set-user-id' event
    socket.on('set-user-id', (userId) => {
        users[userId] = socket.id; // Store the userId and socket id mapping
        console.log('User ID set:', userId);
        socket.emit('me', userId);  // Send the user ID back to the client
    });

    // Handle call-user event
    socket.on('call-user', ({ to, signal }) => {
        const toSocketId = users[to];
        if (toSocketId) {
            io.to(toSocketId).emit('incoming-call', {
                from: socket.id,
                signal: signal,
            });
        }
    });

    // Handle answer-call event
    socket.on('answer-call', ({ to, signal }) => {
        io.to(to).emit('call-accepted', signal);
    });
  // Handle end-call event
socket.on('end-call', ({ to }) => {
    io.to(to).emit('call-ended'); // Notify the recipient
    socket.emit('call-ended');    // Notify the caller
});


    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove user from users list when they disconnect
        for (let userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
            }
        }
    });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

