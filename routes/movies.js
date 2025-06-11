/**
 * @module routes/movies
 * @description This module defines routes for movie-related operations such as
 * listing movies, viewing movie details, rating movies, and getting recommendations.
 * It interacts with Movie, Rating, Review, Collection, and Favorite models.
 * Authentication middleware is used for protected routes.
 */

const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Rating = require('../models/Rating');
const Review = require('../models/Review');
const Collection = require('../models/Collection');
const Favorite = require('../models/Favorite');
const { isAuthenticated, isAdmin } = require('./auth');

/**
 * @name GET /
 * @description Route to display all movies, with optional search functionality.
 * Also retrieves and displays user-specific ratings if the user is logged in.
 * @param {object} req - The Express request object. Expected query params: `search` (optional).
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
router.get('/', async (req, res, next) => { // Added next here
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
    // console.error('Error al obtener películas:', error); // Will be logged by central handler
    next(error);
  }
});

/**
 * @name GET /:id
 * @description Route to display detailed information about a specific movie.
 * This includes average rating, user's own rating (if logged in), user's collections,
 * featured reviews, review count, and similar movies.
 * @param {object} req - The Express request object. Expected route params: `id` (movie ID).
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
router.get('/:id', async (req, res, next) => { // Added next
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      const error = new Error('Película no encontrada');
      error.status = 404;
      return next(error);
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
    // console.error('Error al obtener detalles de película:', error); // Will be logged by central handler
    next(error);
  }
});

/**
 * @name POST /:id/rate
 * @description Route for a logged-in user to rate a movie.
 * It updates or creates a rating and then recalculates and updates the movie's average rating.
 * Responds with JSON indicating success or failure.
 * @param {object} req - The Express request object. Expected route params: `id` (movie ID). Expected body: `rating` (1-5).
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
router.post('/:id/rate', isAuthenticated, async (req, res, next) => { // Added next
  try {
    const { rating } = req.body;
    const movieId = req.params.id;
    
    // Verificar que el usuario esté autenticado y tenga un ID válido
    // isAuthenticated middleware should handle if user is not logged in.
    // This is an additional safeguard or for specific logic if req.user could be incomplete.
    if (!req.user || !req.user.id) {
      // console.error('Error: Usuario no autenticado o ID de usuario no disponible');
      // return res.status(401).json({ success: false, error: 'Usuario no autenticado correctamente' });
      const err = new Error('Usuario no autenticado correctamente para calificar.');
      err.status = 401;
      return next(err);
    }
    
    const userId = req.user.id;
    // console.log('Calificando película:', { userId, movieId, rating }); // Debug log
    
    // Validate rating
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      // return res.status(400).json({ success: false, error: 'Calificación inválida' });
      const err = new Error('Calificación inválida. Debe ser un número entre 1 y 5.');
      err.status = 400;
      return next(err);
    }
    
    // Check if movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      const error = new Error('Película no encontrada para calificar.');
      error.status = 404;
      return next(error);
    }
    
    // This try-catch is for the rating saving logic, separate from the main route try-catch
    try {
      // Update or create rating
      await Rating.findOneAndUpdate( // Removed userRating assignment as it's not used.
        { userId, movieId },
        { rating: ratingNum },
        { upsert: true, new: true }
      );
      
      // console.log('Calificación guardada:', userRating); // Debug log
      
      // Update movie average rating
      const allRatings = await Rating.find({ movieId }); // Renamed from 'ratings' to avoid conflict
      const avgRatingValue = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length; // Renamed
      
      movie.rating = avgRatingValue;
      await movie.save();

      res.json({
        success: true,
        rating: ratingNum,
        avgRating: avgRatingValue.toFixed(1), // Use updated value
        ratingCount: allRatings.length // Use updated value
      });

    } catch (ratingError) {
      // console.error('Error al guardar calificación:', ratingError); // Will be logged by central handler
      // This specific handling for duplicate key might be overly complex if upsert is reliable.
      // However, if specific error handling for ratingError is needed, it can stay.
      // Otherwise, just `return next(ratingError);` might suffice.
      if (ratingError.code === 11000) { // Duplicate key error
        // This block might be redundant due to `findOneAndUpdate` with `upsert:true`.
        // Consider if this specific handling is still necessary.
        // For now, assume it's a specific business logic to retry update.
        await Rating.updateOne({ userId, movieId }, { rating: ratingNum });
        // console.log('Calificación actualizada después de error de duplicado'); // Debug log
        
        const allRatingsRetry = await Rating.find({ movieId });
        const avgRatingRetry = allRatingsRetry.reduce((sum, r) => sum + r.rating, 0) / allRatingsRetry.length;
        
        movie.rating = avgRatingRetry;
        await movie.save();

        res.json({
          success: true,
          rating: ratingNum,
          avgRating: avgRatingRetry.toFixed(1),
          ratingCount: allRatingsRetry.length
        });

      } else {
        return next(ratingError); // Pass other rating-specific errors to central handler
      }
    }
    
  } catch (error) {
    // console.error('Error al calificar película:', error); // Will be logged by central handler
    next(error);
  }
});

/**
 * @name GET /user/recommendations
 * @description Route to get movie recommendations for the logged-in user.
 * Recommendations are based on the user's highly-rated movies and their genres.
 * If the user has no ratings, it shows top-rated movies.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
router.get('/user/recommendations', isAuthenticated, async (req, res, next) => { // Added next
  try {
    const userId = req.user.id;
    
    // Get user ratings
    const userRatings = await Rating.find({ userId }).populate('movieId');
    
    // If user hasn't rated any movies, show top rated movies
    if (userRatings.length === 0) {
      const topMovies = await Movie.find().sort({ rating: -1 }).limit(10);
      return res.render('movies/recommendations', { 
        recommendations: topMovies,
        type: 'general',
        title: 'Recomendaciones Generales'
      });
    }
    
    // Get user's favorite genres based on high ratings (4-5)
    const favoriteGenres = new Set();
    userRatings.forEach(rating => {
      if (rating.rating >= 4 && rating.movieId && rating.movieId.genero) { // Check if movieId and genero exist
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
      const additionalMoviesNeeded = 10 - recommendations.length;
      const currentRecommendationIds = recommendations.map(m => m._id.toString());
      const moviesToExclude = [...ratedMovieIds, ...currentRecommendationIds];

      const moreMovies = await Movie.find({
        _id: { $nin: moviesToExclude }
      }).sort({ rating: -1 }).limit(additionalMoviesNeeded);
      
      recommendations = [...recommendations, ...moreMovies];
    }
    
    res.render('movies/recommendations', { 
      recommendations,
      type: favoriteGenres.size > 0 ? 'personalized' : 'general',
      title: favoriteGenres.size > 0 ? 'Recomendaciones Personalizadas' : 'Recomendaciones Generales'
    });
  } catch (error) {
    // console.error('Error al obtener recomendaciones:', error); // Will be logged by central handler
    next(error);
  }
});

/**
 * @name GET /admin/recommendations
 * @description Admin-only route to view aggregated movie recommendation data,
 * such as top-rated movies and most-rated movies.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
router.get('/admin/recommendations', isAuthenticated, isAdmin, async (req, res, next) => { // Added next
  try {
    // Get top rated movies
    const topRatedMovies = await Movie.find().sort({ rating: -1 }).limit(10);
    
    // Get most rated movies
    const movieRatingsCount = await Rating.aggregate([ // Renamed from movieRatings
      { $group: { _id: '$movieId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const mostRatedMovieIds = movieRatingsCount.map(item => item._id);
    const mostRatedMovies = await Movie.find({ _id: { $in: mostRatedMovieIds } });
    
    // Sort by rating count to maintain order from aggregation
    const sortedMostRatedMovies = mostRatedMovieIds.map(id => {
      return mostRatedMovies.find(movie => movie._id.equals(id));
    }).filter(Boolean); // Filter out any potential nulls if a movie was deleted
    
    res.render('movies/admin-recommendations', {
      topRatedMovies,
      mostRatedMovies: sortedMostRatedMovies,
      movieRatingsCount, // Pass the count data if needed in template
      title: 'Recomendaciones para Administradores'
    });
  } catch (error) {
    // console.error('Error al obtener recomendaciones de admin:', error); // Will be logged by central handler
    next(error);
  }
});

module.exports = router;
