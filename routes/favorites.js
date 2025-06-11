const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Movie = require('../models/Movie');

// Importar middleware de autenticación
const { ensureAuthenticated, isAdmin } = require('../middleware/auth');

// Obtener todas las películas favoritas del usuario
router.get('/', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate('movieId')
      .sort({ createdAt: -1 });
    
    res.render('favorites/index', { 
      favorites, 
      title: 'Mis Películas Favoritas',
      user: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Añadir o eliminar película a favoritos (API)
router.post('/toggle', ensureAuthenticated, async (req, res, next) => { // Added next
  const { movieId } = req.body;
  
  if (!movieId) {
    const error = new Error('El ID de la película es requerido.');
    error.status = 400;
    return next(error);
  }

  try {
    // Optional: Check if the movie actually exists before trying to favorite it
    const movie = await Movie.findById(movieId);
    if (!movie) {
      const error = new Error('Película no encontrada.');
      error.status = 404;
      return next(error);
    }

    const existingFavorite = await Favorite.findOne({ 
      userId: req.user.id, 
      movieId: movieId 
    });

    if (existingFavorite) {
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return res.json({ success: true, action: 'removed', message: 'Película eliminada de favoritos' });
    } else {
      const newFavorite = new Favorite({
        userId: req.user.id,
        movieId: movieId
      });
      await newFavorite.save();
      return res.json({ success: true, action: 'added', message: 'Película añadida a favoritos' });
    }
  } catch (err) {
    next(err);
  }
});

// Verificar si una película está en favoritos (API)
router.get('/check/:movieId', ensureAuthenticated, async (req, res, next) => { // Added next
  const { movieId } = req.params;

  if (!movieId) {
    const error = new Error('El ID de la película es requerido.');
    error.status = 400;
    return next(error);
  }

  try {
    // Optional: Check if the movie actually exists
    // const movie = await Movie.findById(movieId);
    // if (!movie) {
    //   const error = new Error('Película no encontrada para verificar favorito.');
    //   error.status = 404;
    //   return next(error);
    // }

    const favorite = await Favorite.findOne({ 
      userId: req.user.id, 
      movieId: movieId 
    });

    return res.json({ 
      success: true, 
      isFavorite: !!favorite,
      message: favorite ? 'Película está en favoritos' : 'Película no está en favoritos'
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;