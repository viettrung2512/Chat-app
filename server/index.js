const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const server = http.createServer(app);

// Cấu hình CORS cho production và development
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://chat-app-backend-yi62.onrender.com", "https://*.vercel.app"] 
      : "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Lưu trữ dữ liệu
const rooms = new Map();
const users = new Map();
const messages = new Map(); // Lưu trữ tin nhắn theo roomId

// API endpoint để tải file
app.get('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Phục vụ static files từ React build (chỉ trong production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('get-rooms', () => {
    socket.emit('room-list', Array.from(rooms.values()));
  });

  socket.on('create-room', (roomName) => {
    const room = {
      id: Math.random().toString(36).substr(2, 9),
      name: roomName,
      createdAt: new Date()
    };
    rooms.set(room.id, room);
    messages.set(room.id, []); // Khởi tạo mảng tin nhắn cho phòng mới
    io.emit('room-created', room);
  });

  socket.on('join-room', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.join(roomId);
      
      // Thêm user vào room
      if (!users.has(socket.id)) {
        users.set(socket.id, { id: socket.id, rooms: new Set() });
      }
      users.get(socket.id).rooms.add(roomId);

      // Gửi danh sách users trong room
      const roomUsers = Array.from(users.values())
        .filter(user => user.rooms.has(roomId))
        .map(user => ({ id: user.id }));
      
      io.to(roomId).emit('user-list', roomUsers);
      
      // Gửi lịch sử tin nhắn cho user mới
      const roomMessages = messages.get(roomId) || [];
      socket.emit('message-history', roomMessages);
      
      // Gửi thông báo user joined
      const joinMessage = {
        type: 'system',
        content: `User ${socket.id.substr(0, 6)} joined the room`,
        timestamp: new Date(),
        roomId: roomId
      };
      
      // Lưu tin nhắn hệ thống
      if (!messages.has(roomId)) {
        messages.set(roomId, []);
      }
      messages.get(roomId).push(joinMessage);
      
      io.to(roomId).emit('message', joinMessage);
    }
  });

  socket.on('send-message', (data) => {
    const message = {
      ...data,
      userId: socket.id,
      timestamp: new Date(),
      username: `User ${socket.id.substr(0, 6)}`,
      messageId: Math.random().toString(36).substr(2, 9) // ID duy nhất cho mỗi tin nhắn
    };
    
    // Lưu tin nhắn
    if (!messages.has(data.roomId)) {
      messages.set(data.roomId, []);
    }
    messages.get(data.roomId).push(message);
    
    io.to(data.roomId).emit('message', message);
  });

  socket.on('send-file', (data) => {
    // Tạo tên file duy nhất
    const fileExtension = data.fileName.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    
    // Lưu file (loại bỏ data URL prefix)
    const base64Data = data.file.replace(/^data:.*?;base64,/, '');
    fs.writeFileSync(filePath, base64Data, 'base64');
    
    const fileMessage = {
      ...data,
      userId: socket.id,
      timestamp: new Date(),
      username: `User ${socket.id.substr(0, 6)}`,
      type: 'file',
      fileId: uniqueFileName, // Lưu ID file thay vì dữ liệu file
      messageId: Math.random().toString(36).substr(2, 9)
    };
    
    // Lưu tin nhắn file
    if (!messages.has(data.roomId)) {
      messages.set(data.roomId, []);
    }
    messages.get(data.roomId).push(fileMessage);
    
    io.to(data.roomId).emit('file-received', fileMessage);
  });

  socket.on('webrtc-offer', (data) => {
    socket.to(data.roomId).emit('webrtc-offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  socket.on('webrtc-answer', (data) => {
    socket.to(data.roomId).emit('webrtc-answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    socket.to(data.roomId).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    
    if (users.has(socket.id)) {
      users.get(socket.id).rooms.delete(roomId);
      
      // Gửi danh sách users cập nhật
      const roomUsers = Array.from(users.values())
        .filter(user => user.rooms.has(roomId))
        .map(user => ({ id: user.id }));
      
      io.to(roomId).emit('user-list', roomUsers);
      
      // Gửi thông báo user left
      const leaveMessage = {
        type: 'system',
        content: `User ${socket.id.substr(0, 6)} left the room`,
        timestamp: new Date(),
        roomId: roomId
      };
      
      // Lưu tin nhắn hệ thống
      if (messages.has(roomId)) {
        messages.get(roomId).push(leaveMessage);
      }
      
      io.to(roomId).emit('message', leaveMessage);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Xóa user khỏi tất cả các room
    if (users.has(socket.id)) {
      const userRooms = users.get(socket.id).rooms;
      userRooms.forEach(roomId => {
        const disconnectMessage = {
          type: 'system',
          content: `User ${socket.id.substr(0, 6)} disconnected`,
          timestamp: new Date(),
          roomId: roomId
        };
        
        // Lưu tin nhắn hệ thống
        if (messages.has(roomId)) {
          messages.get(roomId).push(disconnectMessage);
        }
        
        io.to(roomId).emit('message', disconnectMessage);
      });
      
      users.delete(socket.id);
    }
  });
});

// Xử lý tất cả các route GET không phải API bằng React app (chỉ trong production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Sửa lỗi biến PORT ở đây
const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});