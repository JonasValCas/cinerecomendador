const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es obligatorio']
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'El ID de la película es obligatorio']
  }
}, {
  timestamps: true // Incluye createdAt y updatedAt automáticamente
});

// Un índice único para asegurar que un usuario solo pueda marcar una película como favorita una vez
favoriteSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
