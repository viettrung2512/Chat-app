import { io } from 'socket.io-client';

// Sử dụng biến môi trường hoặc URL mặc định
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'https://chat-app-backend-yi62.onrender.com';

let socket;

export const connectSocket = () => {
  socket = io(SOCKET_SERVER_URL, {
    transports: ['websocket', 'polling'] // Thêm transports để đảm bảo kết nối
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};