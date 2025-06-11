const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Rating = require('../models/Rating');
const Movie = require('../models/Movie');

// Importar middleware de autenticación
const { ensureAuthenticated, isAdmin } = require('../middleware/auth');

// Obtener todas las reseñas de una película
router.get('/movie/:movieId', async (req, res, next) => { // Added next
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      const error = new Error('Película no encontrada.');
      error.status = 404;
      return next(error);
    }
    
    const reviews = await Review.find({ movieId: req.params.movieId })
      .populate('userId', 'username')
      .sort({ votosUtiles: -1, createdAt: -1 });
    
    res.render('reviews/movie-reviews', { 
      movie, 
      reviews, 
      title: `Reseñas de ${movie.titulo}`,
      user: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Formulario para crear/editar reseña
router.get('/movie/:movieId/nueva', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      const error = new Error('Película no encontrada.');
      error.status = 404;
      return next(error);
    }
    
    // Verificar si el usuario ya tiene una reseña para esta película
    const existingReview = await Review.findOne({ 
      userId: req.user.id, 
      movieId: req.params.movieId 
    });
    
    // Obtener la calificación actual del usuario para esta película
    const userRating = await Rating.findOne({ 
      userId: req.user.id, 
      movieId: req.params.movieId 
    });
    
    res.render('reviews/form', { 
      movie, 
      review: existingReview, 
      userRating,
      title: existingReview ? 'Editar Reseña' : 'Nueva Reseña',
      user: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Crear/actualizar reseña
router.post('/movie/:movieId', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const { titulo, contenido, rating } = req.body;
    const movieId = req.params.movieId;
    
    // ensureAuthenticated should handle this, but as a safeguard:
    if (!req.user || !req.user.id) {
      const error = new Error('Debes iniciar sesión para publicar una reseña.');
      error.status = 401; // Unauthorized
      return next(error);
    }
    
    // Validar que se hayan proporcionado los campos requeridos
    if (!titulo || !titulo.trim() || !contenido || !contenido.trim()) {
      const error = new Error('El título y contenido son obligatorios.');
      error.status = 400; // Bad Request
      // For form submissions, you might want to re-render the form with the error
      // req.flash('error', error.message); // Flash can still be used with redirects
      // return res.redirect(`/reviews/movie/${movieId}/nueva`);
      return next(error); // Or handle by re-rendering form if not an API
    }
    
    // Verificar si el usuario ya tiene una reseña para esta película
    let review = await Review.findOne({ 
      userId: req.user.id, 
      movieId: movieId 
    });
    
    // Si se proporcionó una calificación, actualizar o crear el rating
    let ratingDoc = null;
    if (rating) {
      ratingDoc = await Rating.findOneAndUpdate(
        { userId: req.user.id, movieId: movieId },
        { rating: parseInt(rating) },
        { upsert: true, new: true }
      );
      
      // Actualizar la calificación promedio de la película
      const allRatings = await Rating.find({ movieId: movieId });
      const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / allRatings.length;
      
      await Movie.findByIdAndUpdate(movieId, { rating: avgRating });
    } else {
      // Si no se proporcionó calificación, buscar si existe una
      ratingDoc = await Rating.findOne({ userId: req.user.id, movieId: movieId });
    }
    
    if (review) {
      // Actualizar reseña existente
      review.titulo = titulo;
      review.contenido = contenido;
      review.updatedAt = Date.now(); // This is automatically handled by timestamps: true in schema
      if (ratingDoc) {
        review.ratingId = ratingDoc._id;
      }
    } else {
      // Crear nueva reseña
      review = new Review({
        userId: req.user.id,
        movieId: movieId,
        titulo: titulo,
        contenido: contenido,
        ratingId: ratingDoc ? ratingDoc._id : null
      });
      
      // Verificación adicional antes de guardar (though ensureAuthenticated should cover userId)
      if (!review.userId) {
        const error = new Error('Error al crear la reseña: ID de usuario no disponible.');
        error.status = 500; // Internal server error or configuration issue
        return next(error);
      }
    }
    
    await review.save();
    
    // Use a more specific field to check if it was an update or create for the flash message
    const actionMessage = review.createdAt.getTime() === review.updatedAt.getTime() ? 'Reseña publicada con éxito' : 'Reseña actualizada con éxito';
    req.flash('success', actionMessage);
    res.redirect(`/movies/${movieId}`);
  } catch (err) {
    next(err);
  }
});

// Votar por la utilidad de una reseña (API)
router.post('/:reviewId/vote', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const { util } = req.body;
    const reviewId = req.params.reviewId;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Reseña no encontrada.');
      error.status = 404;
      return next(error);
    }
    
    // Verificar si el usuario ya votó esta reseña
    const existingVote = review.usuariosQueVotaron.find(
      vote => vote.userId.toString() === req.user.id.toString()
    );
    
    if (existingVote) {
      // Si el voto es el mismo, eliminarlo (toggle)
      if (existingVote.util === (util === 'true')) {
        // Actualizar contadores
        if (existingVote.util) {
          review.votosUtiles -= 1;
        } else {
          review.votosNoUtiles -= 1;
        }
        
        // Eliminar el voto
        review.usuariosQueVotaron = review.usuariosQueVotaron.filter(
          vote => vote.userId.toString() !== req.user.id.toString()
        );
        
        await review.save();
        return res.json({ 
          success: true, 
          action: 'removed',
          votosUtiles: review.votosUtiles,
          votosNoUtiles: review.votosNoUtiles
        });
      } else {
        // Cambiar el voto
        if (existingVote.util) {
          review.votosUtiles -= 1;
          review.votosNoUtiles += 1;
        } else {
          review.votosUtiles += 1;
          review.votosNoUtiles -= 1;
        }
        
        existingVote.util = !existingVote.util;
        
        await review.save();
        return res.json({ 
          success: true, 
          action: 'changed',
          votosUtiles: review.votosUtiles,
          votosNoUtiles: review.votosNoUtiles
        });
      }
    } else {
      // Añadir nuevo voto
      const isUtil = util === 'true';
      
      if (isUtil) {
        review.votosUtiles += 1;
      } else {
        review.votosNoUtiles += 1;
      }
      
      review.usuariosQueVotaron.push({
        userId: req.user.id,
        util: isUtil
      });
      
      await review.save();
      return res.json({ 
        success: true, 
        action: 'added',
        votosUtiles: review.votosUtiles,
        votosNoUtiles: review.votosNoUtiles
      });
    }
  } catch (err) {
    next(err);
  }
});

// Eliminar reseña
router.post('/:reviewId/eliminar', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      const error = new Error('Reseña no encontrada.');
      error.status = 404;
      return next(error); // Consider redirecting back if preferred for non-API
    }
    
    // Verificar si el usuario es el autor de la reseña o es admin
    if (!req.user.id.equals(review.userId.toString()) && !req.user.isAdmin) {
      const error = new Error('No tienes permiso para eliminar esta reseña.');
      error.status = 403; // Forbidden
      return next(error); // Consider redirecting back
    }
    
    const movieId = review.movieId; // Save before deleting review
    
    await Review.findByIdAndDelete(req.params.reviewId);
    
    req.flash('success', 'Reseña eliminada con éxito');
    res.redirect(`/movies/${movieId.toString()}`); // Ensure movieId is a string for URL
  } catch (err) {
    next(err);
  }
});

module.exports = router;
