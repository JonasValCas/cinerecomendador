const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre de la colección es obligatorio'],
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    maxlength: [100, 'El nombre no puede exceder los 100 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder los 500 caracteres']
  },
  peliculas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie'
  }],
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publica: {
    type: Boolean,
    default: false
  },
  imagen: {
    type: String,
    default: '/images/default-collection.jpg',
    trim: true
  }
}, {
  timestamps: true // genera createdAt y updatedAt automáticamente
});

// Índices sugeridos
collectionSchema.index({ creador: 1 });
collectionSchema.index({ publica: 1 });

module.exports = mongoose.model('Collection', collectionSchema);
