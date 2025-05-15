const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    minlength: [3, 'El título debe tener al menos 3 caracteres'],
    maxlength: [100, 'El título no debe exceder los 100 caracteres']
  },
  contenido: {
    type: String,
    required: [true, 'El contenido de la reseña es obligatorio'],
    trim: true,
    minlength: [10, 'El contenido debe tener al menos 10 caracteres'],
    maxlength: [5000, 'El contenido no debe exceder los 5000 caracteres']
  },
  // Calificación opcional asociada (puede estar integrada en la review o ser referencia externa)
  ratingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating'
  },
  votosUtiles: {
    type: Number,
    default: 0,
    min: 0
  },
  votosNoUtiles: {
    type: Number,
    default: 0,
    min: 0
  },
  usuariosQueVotaron: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    util: {
      type: Boolean,
      required: true
    }
  }]
}, {
  timestamps: true // Mongoose gestiona createdAt y updatedAt automáticamente
});

// Índice para prevenir más de una reseña por película por usuario
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);