import { io } from 'socket.io-client';

// Sử dụng cùng port với server (3001)
const SOCKET_SERVER_URL = 'http://localhost:3001';

let socket;

export const connectSocket = () => {
  socket = io(SOCKET_SERVER_URL);
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};