const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // No es required porque los mensajes del bot no tienen userId
  },
  message: {
    type: String,
    required: [true, 'El mensaje no puede estar vacío'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isBot: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Método estático para guardar un mensaje del usuario y la respuesta del bot
chatMessageSchema.statics.saveConversation = async function(userMessage, botMessage) {
  try {
    // Crear y guardar ambos mensajes en una sola operación
    const result = await this.insertMany([userMessage, botMessage]);
    return result;
  } catch (error) {
    console.error('Error al guardar la conversación:', error);
    throw error;
  }
};

// Método estático para obtener el historial de chat
chatMessageSchema.statics.getHistory = async function(limit = 50) {
  try {
    // Obtener los mensajes más recientes primero
    const messages = await this.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    // Devolver en orden cronológico (más antiguos primero)
    return messages.reverse();
  } catch (error) {
    console.error('Error al obtener historial de chat:', error);
    throw error;
  }
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
