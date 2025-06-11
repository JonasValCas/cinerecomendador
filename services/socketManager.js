/**
 * @module services/socketManager
 * @description This service manages Socket.IO connections and real-time chat functionalities.
 * It handles user connection, disconnection, message broadcasting, and integrates
 * with the chatbot service for automated responses.
 */

const { generateBotResponse } = require('./chatbotService');

/**
 * Initializes the Socket.IO manager with the given Socket.IO server instance.
 * Sets up event listeners for new connections, disconnections, and chat messages.
 * Manages a list of connected users and broadcasts user join/leave events.
 * Relays user messages to all clients and triggers chatbot responses.
 *
 * @param {object} io - The Socket.IO server instance, typically obtained from `require('socket.io')(server)`.
 */
function initSocketManager(io) {
  // Store connected users
  const connectedUsers = {};

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // User joins chat
    socket.on('join', (userData) => {
      const { username } = userData;
      connectedUsers[socket.id] = { username };

      // Notify all users about new user
      io.emit('user joined', {
        username,
        userId: socket.id,
        users: Object.values(connectedUsers).map(u => u.username),
        message: `${username} se ha unido al chat`
      });
    });

    // User sends message
    socket.on('chat message', (data) => {
      const { message } = data;
      const user = connectedUsers[socket.id];

      if (user) {
        // Broadcast message to all users
        io.emit('chat message', {
          userId: socket.id,
          username: user.username,
          message,
          timestamp: new Date().toISOString()
        });

        // Chatbot response
        setTimeout(() => {
          const botResponse = generateBotResponse(message);
          if (botResponse) {
            io.emit('chat message', {
              userId: 'bot',
              username: 'CineBot',
              message: botResponse,
              timestamp: new Date().toISOString()
            });
          }
        }, 1000); // Responder después de 1 segundo para simular escritura
      }
    });

    // User disconnects
    socket.on('disconnect', () => {
      const user = connectedUsers[socket.id];
      if (user) {
        console.log('User disconnected:', user.username);

        // Notify all users about disconnection
        io.emit('user left', {
          username: user.username,
          users: Object.values(connectedUsers)
            .filter(u => u.username !== user.username)
            .map(u => u.username),
          message: `${user.username} ha abandonado el chat`
        });

        // Remove user from connected users
        delete connectedUsers[socket.id];
      }
    });
  });
}

module.exports = {
  initSocketManager
};
