const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Обслуживаем фронтенд
app.use(express.static(path.join(__dirname, '../frontend/public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Хранилище пользователей
const users = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);
  
  socket.emit('connected', { id: socket.id });

  // Присоединение к комнате
  socket.on('join-room', (room) => {
    socket.join(room);
    users.set(socket.id, { room, partner: null });
    socket.emit('room-joined', room);
    console.log(`👤 ${socket.id} joined ${room}`);
  });

  // Поиск партнера
  socket.on('find-partner', (room) => {
    const roomUsers = Array.from(users.entries())
      .filter(([id, data]) => data.room === room && id !== socket.id && !data.partner);
    
    if (roomUsers.length > 0) {
      const [partnerId] = roomUsers[0];
      
      // Создаем пару
      users.get(socket.id).partner = partnerId;
      users.get(partnerId).partner = socket.id;
      
      socket.emit('partner-found', partnerId);
      socket.to(partnerId).emit('partner-found', socket.id);
      
      console.log(`🤝 Paired: ${socket.id} and ${partnerId}`);
    } else {
      socket.emit('waiting-partner');
    }
  });

  // WebRTC сигналы
  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Отключение
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user && user.partner) {
      socket.to(user.partner).emit('partner-left');
      users.delete(user.partner);
    }
    users.delete(socket.id);
    console.log('❌ User disconnected:', socket.id);
  });
});

// API статуса
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'OK', 
    users: users.size,
    timestamp: new Date().toISOString()
  });
});

// Все пути ведут на фронтенд
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Frontend: http://localhost:${PORT}`);
});