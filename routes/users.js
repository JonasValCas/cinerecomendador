const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Rating = require('../models/Rating');
const { isAuthenticated, isAdmin } = require('./auth');

// User profile
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    // Usar req.user si la autenticación ya está funcionando correctamente
    const user = req.user;
    
    // Verificar si el usuario existe
    if (!user) {
      return res.status(404).render('error', { message: 'Usuario no encontrado' });
    }

    // Obtener las calificaciones del usuario con un solo query (usando populate)
    const ratings = await Rating.find({ userId: user._id }).populate('movieId');
    
    res.render('users/profile', { user, ratings });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).render('error', { message: 'Error al cargar perfil de usuario' });
  }
});

// Admin only - list users
router.get('/admin/users', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Obtener todos los usuarios con la contraseña excluida y ordenados por fecha de creación
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Usar una única consulta para obtener el conteo de calificaciones para todos los usuarios
    const ratings = await Rating.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);

    // Convertir el resultado de ratings a un formato más accesible (un objeto)
    const userRatingCounts = ratings.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});
    
    res.render('users/admin-users', { users, userRatingCounts });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).render('error', { message: 'Error al cargar lista de usuarios' });
  }
});

module.exports = router;
