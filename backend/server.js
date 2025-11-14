const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Статика
app.use(express.static(path.join(__dirname, '../frontend/public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Хранилище пользователей
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Присоединение к комнате
  socket.on('join-room', (room) => {
    socket.join(room);
    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add(socket.id);
    socket.emit('room-joined', room);
    console.log(`👤 ${socket.id} joined ${room}`);
  });

  // Поиск собеседника
  socket.on('find-partner', (room) => {
    const roomUsers = rooms.get(room);
    if (roomUsers && roomUsers.size > 1) {
      const users = Array.from(roomUsers).filter(id => id !== socket.id);
      if (users.length > 0) {
        const partnerId = users[0];
        socket.emit('partner-found', partnerId);
        socket.to(partnerId).emit('partner-found', socket.id);
        console.log(`🤝 Paired: ${socket.id} and ${partnerId}`);
      } else {
        socket.emit('waiting-partner');
      }
    } else {
      socket.emit('waiting-partner');
    }
  });

  // WebRTC сигналы
  socket.on('webrtc-offer', (data) => {
    socket.to(data.target).emit('webrtc-offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(data.target).emit('webrtc-answer', {
      answer: data.answer, 
      sender: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.target).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    // Удаляем из всех комнат
    rooms.forEach((users, room) => {
      users.delete(socket.id);
      if (users.size === 0) {
        rooms.delete(room);
      }
    });
  });
});

// API статуса
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'OK', 
    rooms: rooms.size,
    connections: Array.from(rooms.values()).reduce((acc, users) => acc + users.size, 0)
  });
});

// Все пути на фронтенд
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});