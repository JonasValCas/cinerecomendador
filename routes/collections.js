const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Movie = require('../models/Movie');
const { ensureAuthenticated } = require('../middleware/auth');

// Helper function to handle common validation logic
const validateCollectionOwnership = async (collectionId, userId) => {
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    const error = new Error('Colección no encontrada');
    error.status = 404;
    throw error;
  }
  if (!userId.equals(collection.creador)) {
    const error = new Error('No tienes permiso para modificar esta colección');
    error.status = 403; // Forbidden
    throw error;
  }
  return collection;
};

// Obtener todas las colecciones públicas
router.get('/', async (req, res, next) => { // Added next
  try {
    const collections = await Collection.find({ publica: true })
      .populate('creador', 'username')
      .populate('peliculas', 'titulo imagen rating');
    
    res.render('collections/index', { 
      collections, 
      title: 'Colecciones de Películas',
      user: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Obtener colecciones del usuario actual
router.get('/mis-colecciones', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const collections = await Collection.find({ creador: req.user._id })
      .populate('peliculas', 'titulo imagen rating');
    
    res.render('collections/mis-colecciones', { 
      collections, 
      title: 'Mis Colecciones',
      user: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Formulario para crear nueva colección
router.get('/nueva', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const movies = await Movie.find().sort('titulo');
    
    res.render('collections/nueva', { 
      movies, 
      title: 'Crear Nueva Colección',
      user: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Crear nueva colección
router.post('/nueva', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const { nombre, descripcion, peliculas, publica } = req.body;

    if (!nombre || nombre.trim() === '') {
      const error = new Error('El nombre de la colección es obligatorio.');
      error.status = 400; // Bad Request
      // req.flash('error', 'El nombre de la colección es obligatorio'); // Flash will be handled by rendering logic if needed or client-side
      // return res.redirect('/collections/nueva');
      return next(error); // Or render the form again with an error message
    }

    const newCollection = new Collection({
      nombre,
      descripcion,
      peliculas: Array.isArray(peliculas) ? peliculas : (peliculas ? [peliculas] : []).filter(Boolean),
      creador: req.user._id,
      publica: publica === 'on'
    });

    await newCollection.save();
    
    req.flash('success', 'Colección creada con éxito');
    res.redirect('/collections/mis-colecciones');
  } catch (err) {
    next(err);
  }
});

// Ver detalle de una colección
router.get('/:id', async (req, res, next) => { // Added next
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('creador', 'username')
      .populate('peliculas');
    
    if (!collection) {
      const error = new Error('Colección no encontrada');
      error.status = 404;
      return next(error);
    }
    
    if (!collection.publica && (!req.user || !req.user._id.equals(collection.creador._id))) {
      const error = new Error('No tienes permiso para ver esta colección');
      error.status = 403; // Forbidden
      return next(error);
    }

    res.render('collections/detalle', { 
      collection, 
      title: collection.nombre,
      user: req.user,
      esCreador: req.user && req.user._id.equals(collection.creador._id)
    });
  } catch (err) {
    next(err);
  }
});

// Formulario para editar colección
router.get('/:id/editar', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const collection = await validateCollectionOwnership(req.params.id, req.user._id);
    const movies = await Movie.find().sort('titulo');
    
    res.render('collections/editar', { 
      collection, 
      movies,
      title: `Editar ${collection.nombre}`,
      user: req.user
    });
  } catch (err) {
    next(err);
  }
});

// Actualizar colección
router.post('/:id/editar', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const { nombre, descripcion, peliculas, publica } = req.body;

    if (!nombre || nombre.trim() === '') {
      const error = new Error('El nombre de la colección es obligatorio.');
      error.status = 400;
      return next(error);
    }
    
    const collection = await validateCollectionOwnership(req.params.id, req.user._id);

    collection.nombre = nombre;
    collection.descripcion = descripcion;
    collection.peliculas = Array.isArray(peliculas) ? peliculas : (peliculas ? [peliculas] : []).filter(Boolean);
    collection.publica = publica === 'on';
    
    await collection.save();
    
    req.flash('success', 'Colección actualizada con éxito');
    res.redirect(`/collections/${collection._id}`);
  } catch (err) {
    next(err);
  }
});

// Eliminar colección
router.post('/:id/eliminar', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const collection = await validateCollectionOwnership(req.params.id, req.user._id); // Validates and throws if not found/not owner
    
    await Collection.findByIdAndDelete(req.params.id); // No need to check for existence again if validateCollectionOwnership passed
    
    req.flash('success', 'Colección eliminada con éxito');
    res.redirect('/collections/mis-colecciones');
  } catch (err) {
    next(err);
  }
});

// Añadir película a colección
router.post('/agregar-pelicula', ensureAuthenticated, async (req, res, next) => { // Added next
  try {
    const { movieId, collectionId } = req.body;

    if (!movieId) {
        const err = new Error('ID de película no proporcionado.');
        err.status = 400;
        return next(err);
    }

    if (collectionId === 'nueva') {
      const { nuevaColeccionNombre } = req.body; // Changed from nuevaColeccion to nuevaColeccionNombre for clarity
      
      if (!nuevaColeccionNombre || nuevaColeccionNombre.trim() === '') {
        const err = new Error('Debes proporcionar un nombre para la nueva colección.');
        err.status = 400;
        // req.flash('error', 'Debes proporcionar un nombre para la nueva colección');
        // return res.redirect(`/movies/${movieId}`); // Redirects will be handled by error handler or client
        return next(err);
      }
      
      const newCollection = new Collection({
        nombre: nuevaColeccionNombre,
        peliculas: [movieId],
        creador: req.user._id,
        publica: false // Default for new collections created this way
      });
      
      await newCollection.save();
      
      req.flash('success', `Película añadida a nueva colección: ${newCollection.nombre}`);
      return res.redirect(`/movies/${movieId}`);
    }

    // Existing collection
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      const err = new Error('Colección no encontrada.');
      err.status = 404;
      return next(err);
    }

    if (!req.user._id.equals(collection.creador)) {
      const err = new Error('No tienes permiso para modificar esta colección.');
      err.status = 403;
      return next(err);
    }

    if (collection.peliculas.map(id => id.toString()).includes(movieId)) {
      // Using flash for info messages is fine, as this is not strictly an "error"
      req.flash('info', 'Esta película ya está en la colección.');
      return res.redirect(`/movies/${movieId}`);
    }

    collection.peliculas.push(movieId);
    await collection.save();
    
    req.flash('success', `Película añadida a la colección: ${collection.nombre}`);
    res.redirect(`/movies/${movieId}`);
  } catch (err) {
    // Ensure movieId is available for redirect in case of general error
    // This might be problematic if movieId itself is the issue.
    // Consider how to handle this redirect more robustly if needed.
    // For now, passing the error to the central handler is the main goal.
    next(err);
  }
});

module.exports = router;