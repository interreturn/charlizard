const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
    cors: {
        origin: "*",  // Adjust to a specific domain for production
        methods: ["GET", "POST"]
    },
    path: "/socket.io"  // Explicitly define the WebSocket path
});

// In-memory store for connected users
let users = {};

// Handle a new WebSocket connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // When the iOS app sends a "start_call" message
    socket.on('start_call', ({ userID, callUUID }) => {
        // Store the userID with the corresponding socket ID
        users[userID] = socket.id;
        console.log(`Received start_call for user: ${userID} with callUUID: ${callUUID}`);
        
        // Send a confirmation back to the client (iOS app)
        socket.emit('start_call_response', { success: true, userID, callUUID });
    });

    // Handle an incoming call (message from one user to another)
    socket.on('call-user', ({ to, signal }) => {
        const toSocketId = users[to];
        if (toSocketId) {
            io.to(toSocketId).emit('incoming-call', { from: socket.id, signal });
        }
    });

    // Handle an accepted call (when the user accepts the incoming call)
    socket.on('answer-call', ({ to, signal }) => {
        io.to(to).emit('call-accepted', signal);
    });

    // Handle ending the call
    socket.on('end-call', ({ to }) => {
        io.to(to).emit('call-ended');
        socket.emit('call-ended');
    });

    // When a user disconnects, clean up their entry in the users list
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (let userID in users) {
            if (users[userID] === socket.id) {
                delete users[userID];
            }
        }
    });
});

// Set the server to listen on a specific port
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
