const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Rating = require('../models/Rating');
const Review = require('../models/Review');
const Collection = require('../models/Collection');
const Favorite = require('../models/Favorite');
const { isAuthenticated, isAdmin } = require('./auth');

// Get all movies
router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    let query = {};
    
    if (searchQuery) {
      query = {
        $or: [
          { titulo: { $regex: searchQuery, $options: 'i' } },
          { genero: { $regex: searchQuery, $options: 'i' } }
        ]
      };
    }
    
    const movies = await Movie.find(query).sort({ createdAt: -1 });
    
    // If user is logged in, get their ratings
    let userRatings = {};
    if (req.session.user) {
      const ratings = await Rating.find({ userId: req.session.user.id });
      ratings.forEach(rating => {
        userRatings[rating.movieId.toString()] = rating.rating;
      });
    }
    
    res.render('movies/index', { 
      movies, 
      userRatings,
      searchQuery
    });
  } catch (error) {
    console.error('Error al obtener películas:', error);
    res.status(500).render('error', { message: 'Error al cargar películas' });
  }
});

// Get movie details
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).render('error', { message: 'Película no encontrada' });
    }
    
    // Get average rating
    const ratings = await Rating.find({ movieId: movie._id });
    const avgRating = ratings.length > 0 
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
      : 0;
    
    // Get user rating if logged in
    let userRating = null;
    let userCollections = [];
    
    if (req.session.user) {
      // Get user rating
      const rating = await Rating.findOne({ 
        userId: req.session.user.id,
        movieId: movie._id
      });
      if (rating) {
        userRating = rating.rating;
      }
      
      // Get user collections for the dropdown
      userCollections = await Collection.find({ creador: req.session.user.id });
    }
    
    // Get featured reviews (top 2 by votes)
    const featuredReviews = await Review.find({ movieId: movie._id })
      .populate('userId', 'username')
      .sort({ votosUtiles: -1 })
      .limit(2);
    
    // Get total review count
    const reviewCount = await Review.countDocuments({ movieId: movie._id });
    
    // Get similar movies (same genre, excluding current)
    const similarMovies = await Movie.find({
      genero: movie.genero,
      _id: { $ne: movie._id }
    }).limit(6);
    
    res.render('movies/detail', { 
      movie, 
      avgRating: avgRating.toFixed(1),
      userRating,
      ratingCount: ratings.length,
      userCollections,
      featuredReviews,
      reviewCount,
      similarMovies
    });
  } catch (error) {
    console.error('Error al obtener detalles de película:', error);
    res.status(500).render('error', { message: 'Error al cargar detalles de película' });
  }
});

// Rate a movie
router.post('/:id/rate', isAuthenticated, async (req, res) => {
  try {
    const { rating } = req.body;
    const movieId = req.params.id;
    
    // Verificar que el usuario esté autenticado y tenga un ID válido
    if (!req.user || !req.user.id) {
      console.error('Error: Usuario no autenticado o ID de usuario no disponible');
      return res.status(401).json({ success: false, error: 'Usuario no autenticado correctamente' });
    }
    
    const userId = req.user.id;
    console.log('Calificando película:', { userId, movieId, rating });
    
    // Validate rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, error: 'Calificación inválida' });
    }
    
    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, error: 'Película no encontrada' });
    }
    
    try {
      // Update or create rating
      const userRating = await Rating.findOneAndUpdate(
        { userId, movieId },
        { rating: ratingNum },
        { upsert: true, new: true }
      );
      
      console.log('Calificación guardada:', userRating);
      
      // Update movie average rating
      const ratings = await Rating.find({ movieId });
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      
      movie.rating = avgRating;
      await movie.save();
    } catch (ratingError) {
      console.error('Error al guardar calificación:', ratingError);
      
      // Si hay un error de duplicado (código 11000), intentar actualizar directamente
      if (ratingError.code === 11000) {
        // Intentar actualizar directamente
        await Rating.updateOne({ userId, movieId }, { rating: ratingNum });
        console.log('Calificación actualizada después de error de duplicado');
        
        // Actualizar promedio de calificaciones
        const ratings = await Rating.find({ movieId });
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        
        movie.rating = avgRating;
        await movie.save();
      } else {
        // Si es otro tipo de error, lanzarlo para que lo maneje el catch externo
        throw ratingError;
      }
    }
    
    res.json({ 
      success: true, 
      rating: ratingNum,
      avgRating: avgRating.toFixed(1),
      ratingCount: ratings.length
    });
  } catch (error) {
    console.error('Error al calificar película:', error);
    res.status(500).json({ success: false, error: 'Error al calificar película: ' + error.message });
  }
});

// Get movie recommendations
router.get('/user/recommendations', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user ratings
    const userRatings = await Rating.find({ userId }).populate('movieId');
    
    // If user hasn't rated any movies, show top rated movies
    if (userRatings.length === 0) {
      const topMovies = await Movie.find().sort({ rating: -1 }).limit(10);
      return res.render('movies/recommendations', { 
        recommendations: topMovies,
        type: 'general'
      });
    }
    
    // Get user's favorite genres based on high ratings (4-5)
    const favoriteGenres = new Set();
    userRatings.forEach(rating => {
      if (rating.rating >= 4 && rating.movieId) {
        favoriteGenres.add(rating.movieId.genero);
      }
    });
    
    // Get movies from favorite genres that user hasn't rated yet
    const ratedMovieIds = userRatings.map(r => r.movieId._id.toString());
    
    let recommendations = [];
    
    if (favoriteGenres.size > 0) {
      recommendations = await Movie.find({
        genero: { $in: Array.from(favoriteGenres) },
        _id: { $nin: ratedMovieIds }
      }).sort({ rating: -1 }).limit(10);
    }
    
    // If not enough recommendations, add top rated movies
    if (recommendations.length < 5) {
      const moreMovies = await Movie.find({
        _id: { $nin: [...ratedMovieIds, ...recommendations.map(m => m._id)] }
      }).sort({ rating: -1 }).limit(10 - recommendations.length);
      
      recommendations = [...recommendations, ...moreMovies];
    }
    
    res.render('movies/recommendations', { 
      recommendations,
      type: favoriteGenres.size > 0 ? 'personalized' : 'general'
    });
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    res.status(500).render('error', { message: 'Error al cargar recomendaciones' });
  }
});

// Admin recommendations
router.get('/admin/recommendations', isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get top rated movies
    const topRatedMovies = await Movie.find().sort({ rating: -1 }).limit(10);
    
    // Get most rated movies
    const movieRatings = await Rating.aggregate([
      { $group: { _id: '$movieId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const mostRatedMovieIds = movieRatings.map(item => item._id);
    const mostRatedMovies = await Movie.find({ _id: { $in: mostRatedMovieIds } });
    
    // Sort by rating count
    const sortedMostRatedMovies = mostRatedMovieIds.map(id => {
      return mostRatedMovies.find(movie => movie._id.equals(id));
    }).filter(Boolean);
    
    res.render('movies/admin-recommendations', {
      topRatedMovies,
      mostRatedMovies: sortedMostRatedMovies,
      movieRatings
    });
  } catch (error) {
    console.error('Error al obtener recomendaciones de admin:', error);
    res.status(500).render('error', { message: 'Error al cargar recomendaciones' });
  }
});

module.exports = router;
