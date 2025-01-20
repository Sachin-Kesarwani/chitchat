// Backend: Node.js with Express.js (index.js)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

let users = [];

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle login
  socket.on('login', (username) => {
    users.push({ username, socketId: socket.id, online: true });
    io.emit('users', users);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    users = users.map((user) =>
      user.socketId === socket.id ? { ...user, online: false } : user
    );
    io.emit('users', users);
  });

  // Handle sending messages
  socket.on('sendMessage', (data) => {
    const receiver = users.find((user) => user.username === data.receiver);
    if (receiver) {
      io.to(receiver.socketId).emit('receiveMessage', data);
    }
  });

  // Handle typing event
  socket.on('typing', ({ sender, receiver, isTyping }) => {
    const receiverUser = users.find((user) => user.username === receiver);
    if (receiverUser) {
      io.to(receiverUser.socketId).emit('typing', { sender, isTyping });
    }
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
