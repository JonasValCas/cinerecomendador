const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es obligatorio']
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'El ID de la película es obligatorio']
  },
  rating: {
    type: Number,
    required: [true, 'La calificación es obligatoria'],
    min: [1, 'La calificación mínima es 1'],
    max: [5, 'La calificación máxima es 5']
    // Si quieres permitir decimales como 3.5, agrega: `validate: { validator: Number.isFinite }`
  }
}, {
  timestamps: true // createdAt y updatedAt automáticos
});

// Un usuario solo puede calificar una misma película una vez
ratingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);