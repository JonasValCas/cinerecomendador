const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Rating = require('../models/Rating');
const Movie = require('../models/Movie');

// Importar middleware de autenticación
const { ensureAuthenticated, isAdmin } = require('../middleware/auth');

// Obtener todas las reseñas de una película
router.get('/movie/:movieId', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      req.flash('error', 'Película no encontrada');
      return res.redirect('/');
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
    console.error(err);
    req.flash('error', 'Error al cargar las reseñas');
    res.redirect('/');
  }
});

// Formulario para crear/editar reseña
router.get('/movie/:movieId/nueva', ensureAuthenticated, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      req.flash('error', 'Película no encontrada');
      return res.redirect('/');
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
    console.error(err);
    req.flash('error', 'Error al cargar el formulario');
    res.redirect(`/movies/${req.params.movieId}`);
  }
});

// Crear/actualizar reseña
router.post('/movie/:movieId', ensureAuthenticated, async (req, res) => {
  try {
    const { titulo, contenido, rating } = req.body;
    const movieId = req.params.movieId;
    
    // Verificar que el usuario esté autenticado y tenga un ID válido
    if (!req.user || !req.user.id) {
      console.error('Error: Usuario no autenticado o ID de usuario no disponible');
      req.flash('error', 'Debes iniciar sesión para publicar una reseña');
      return res.redirect('/auth/login');
    }
    
    // Validar que se hayan proporcionado los campos requeridos
    if (!titulo || !contenido) {
      req.flash('error', 'El título y contenido son obligatorios');
      return res.redirect(`/reviews/movie/${movieId}/nueva`);
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
      review.updatedAt = Date.now();
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
      
      // Verificación adicional antes de guardar
      if (!review.userId) {
        console.error('Error: userId no definido en el objeto review');
        req.flash('error', 'Error al crear la reseña: ID de usuario no disponible');
        return res.redirect(`/reviews/movie/${movieId}/nueva`);
      }
    }
    
    await review.save();
    
    req.flash('success', review.updatedAt ? 'Reseña actualizada con éxito' : 'Reseña publicada con éxito');
    res.redirect(`/movies/${movieId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al guardar la reseña');
    res.redirect(`/reviews/movie/${req.params.movieId}/nueva`);
  }
});

// Votar por la utilidad de una reseña (API)
router.post('/:reviewId/vote', ensureAuthenticated, async (req, res) => {
  try {
    const { util } = req.body;
    const reviewId = req.params.reviewId;
    
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, error: 'Reseña no encontrada' });
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
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al procesar el voto' });
  }
});

// Eliminar reseña
router.post('/:reviewId/eliminar', ensureAuthenticated, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      req.flash('error', 'Reseña no encontrada');
      return res.redirect('back');
    }
    
    // Verificar si el usuario es el autor de la reseña
    if (!req.user.id.equals(review.userId)) {
      req.flash('error', 'No tienes permiso para eliminar esta reseña');
      return res.redirect('back');
    }
    
    const movieId = review.movieId;
    
    await Review.findByIdAndDelete(req.params.reviewId);
    
    req.flash('success', 'Reseña eliminada con éxito');
    res.redirect(`/movies/${movieId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al eliminar la reseña');
    res.redirect('back');
  }
});

module.exports = router;
