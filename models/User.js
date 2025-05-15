const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [50, 'El nombre de usuario no puede exceder los 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El correo electrónico es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/, 'Por favor ingresa un correo electrónico válido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Mongoose automáticamente maneja createdAt y updatedAt
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para cambiar la contraseña de un usuario
userSchema.methods.changePassword = async function(newPassword) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(newPassword, salt);
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
