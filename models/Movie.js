const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    minlength: [1, 'El título debe tener al menos 1 carácter'],
    maxlength: [200, 'El título no puede exceder los 200 caracteres']
  },
  genero: {
    type: String,
    required: [true, 'El género es obligatorio'],
    trim: true,
    minlength: [3, 'El género debe tener al menos 3 caracteres'],
    maxlength: [50, 'El género no puede exceder los 50 caracteres']
    // Si prefieres múltiples géneros, cambia a: [String]
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
    maxlength: [2000, 'La descripción no puede exceder los 2000 caracteres']
  },
  anio: {
    type: Number,
    required: [true, 'El año es obligatorio'],
    min: [1888, 'El año no puede ser anterior a 1888'], // Primeras películas
    max: [new Date().getFullYear() + 1, 'El año no puede ser mayor al próximo año']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'La calificación mínima es 0'],
    max: [5, 'La calificación máxima es 5']
  },
  imagen: {
    type: String,
    default: '/images/default-movie.jpg',
    trim: true
  }
}, {
  timestamps: true // Crea createdAt y updatedAt automáticamente
});

module.exports = mongoose.model('Movie', movieSchema);
