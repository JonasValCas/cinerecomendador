const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Rating = require('../models/Rating');
const { isAuthenticated, isAdmin } = require('./auth');

// User profile
router.get('/profile', isAuthenticated, async (req, res, next) => { // Added next
  try {
    // req.user is populated by isAuthenticated. If not, isAuthenticated should handle the error.
    // For robustness, you might fetch the user fresh from DB if req.user is just an ID.
    // Assuming req.user is the user object:
    const user = await User.findById(req.user.id).select('-password'); // Ensure password is not selected

    if (!user) {
      const error = new Error('Usuario no encontrado.');
      error.status = 404;
      return next(error);
    }

    // Obtener las calificaciones del usuario con un solo query (usando populate)
    const ratings = await Rating.find({ userId: user._id }).populate('movieId');
    
    res.render('users/profile', { user, ratings });
  } catch (error) {
    // console.error('Error al obtener perfil de usuario:', error); // Will be logged by central handler
    next(error);
  }
});

// Admin only - list users
router.get('/admin/users', isAuthenticated, isAdmin, async (req, res, next) => { // Added next
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
    // console.error('Error al listar usuarios:', error); // Will be logged by central handler
    next(error);
  }
});

module.exports = router;
