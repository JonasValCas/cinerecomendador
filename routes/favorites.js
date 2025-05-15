const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Movie = require('../models/Movie');

// Importar middleware de autenticación
const { ensureAuthenticated, isAdmin } = require('../middleware/auth');

// Obtener todas las películas favoritas del usuario
router.get('/', ensureAuthenticated, async (req, res) => {
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
    console.error(err);
    req.flash('error', 'Error al cargar tus películas favoritas');
    res.redirect('/');
  }
});

// Añadir o eliminar película a favoritos (API)
router.post('/toggle', ensureAuthenticated, async (req, res) => {
  const { movieId } = req.body;
  
  // Validar que el movieId esté presente
  if (!movieId) {
    return res.status(400).json({ success: false, error: 'El ID de la película es requerido.' });
  }

  try {
    // Verificar si la película ya está en favoritos
    const existingFavorite = await Favorite.findOne({ 
      userId: req.user.id, 
      movieId: movieId 
    });

    if (existingFavorite) {
      // Si ya existe, eliminarla de favoritos
      await Favorite.findByIdAndDelete(existingFavorite._id);
      return res.json({ success: true, action: 'removed', message: 'Película eliminada de favoritos' });
    } else {
      // Si no existe, añadirla a favoritos
      const newFavorite = new Favorite({
        userId: req.user.id,
        movieId: movieId
      });

      await newFavorite.save();
      return res.json({ success: true, action: 'added', message: 'Película añadida a favoritos' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al procesar la solicitud' });
  }
});

// Verificar si una película está en favoritos (API)
router.get('/check/:movieId', ensureAuthenticated, async (req, res) => {
  const { movieId } = req.params;

  // Validar que el movieId esté presente
  if (!movieId) {
    return res.status(400).json({ success: false, error: 'El ID de la película es requerido.' });
  }

  try {
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
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al verificar el estado de favorito' });
  }
});

module.exports = router;