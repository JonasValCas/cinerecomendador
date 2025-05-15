const express = require('express');
const router = express.Router();
const Collection = require('../models/Collection');
const Movie = require('../models/Movie');
const { ensureAuthenticated } = require('../middleware/auth');

// Helper function to handle common validation logic
const validateCollectionOwnership = async (collectionId, userId) => {
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    throw new Error('Colección no encontrada');
  }
  if (!userId.equals(collection.creador)) {
    throw new Error('No tienes permiso para modificar esta colección');
  }
  return collection;
};

// Obtener todas las colecciones públicas
router.get('/', async (req, res) => {
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
    console.error(err);
    req.flash('error', 'Error al cargar las colecciones');
    res.redirect('/');
  }
});

// Obtener colecciones del usuario actual
router.get('/mis-colecciones', ensureAuthenticated, async (req, res) => {
  try {
    const collections = await Collection.find({ creador: req.user._id })
      .populate('peliculas', 'titulo imagen rating');
    
    res.render('collections/mis-colecciones', { 
      collections, 
      title: 'Mis Colecciones',
      user: req.user
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar tus colecciones');
    res.redirect('/');
  }
});

// Formulario para crear nueva colección
router.get('/nueva', ensureAuthenticated, async (req, res) => {
  try {
    const movies = await Movie.find().sort('titulo');
    
    res.render('collections/nueva', { 
      movies, 
      title: 'Crear Nueva Colección',
      user: req.user
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el formulario');
    res.redirect('/collections/mis-colecciones');
  }
});

// Crear nueva colección
router.post('/nueva', ensureAuthenticated, async (req, res) => {
  try {
    const { nombre, descripcion, peliculas, publica } = req.body;

    if (!nombre) {
      req.flash('error', 'El nombre de la colección es obligatorio');
      return res.redirect('/collections/nueva');
    }

    const newCollection = new Collection({
      nombre,
      descripcion,
      peliculas: Array.isArray(peliculas) ? peliculas : [peliculas].filter(Boolean),
      creador: req.user._id,
      publica: publica === 'on'
    });

    await newCollection.save();
    
    req.flash('success', 'Colección creada con éxito');
    res.redirect('/collections/mis-colecciones');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al crear la colección');
    res.redirect('/collections/nueva');
  }
});

// Ver detalle de una colección
router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('creador', 'username')
      .populate('peliculas');
    
    if (!collection) {
      req.flash('error', 'Colección no encontrada');
      return res.redirect('/collections');
    }
    
    if (!collection.publica && (!req.user || !req.user._id.equals(collection.creador._id))) {
      req.flash('error', 'No tienes permiso para ver esta colección');
      return res.redirect('/collections');
    }

    res.render('collections/detalle', { 
      collection, 
      title: collection.nombre,
      user: req.user,
      esCreador: req.user && req.user._id.equals(collection.creador._id)
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar la colección');
    res.redirect('/collections');
  }
});

// Formulario para editar colección
router.get('/:id/editar', ensureAuthenticated, async (req, res) => {
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
    console.error(err);
    req.flash('error', err.message || 'Error al cargar el formulario de edición');
    res.redirect('/collections/mis-colecciones');
  }
});

// Actualizar colección
router.post('/:id/editar', ensureAuthenticated, async (req, res) => {
  try {
    const { nombre, descripcion, peliculas, publica } = req.body;
    
    const collection = await validateCollectionOwnership(req.params.id, req.user._id);

    collection.nombre = nombre;
    collection.descripcion = descripcion;
    collection.peliculas = Array.isArray(peliculas) ? peliculas : [peliculas].filter(Boolean);
    collection.publica = publica === 'on';
    
    await collection.save();
    
    req.flash('success', 'Colección actualizada con éxito');
    res.redirect(`/collections/${collection._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', err.message || 'Error al actualizar la colección');
    res.redirect(`/collections/${req.params.id}/editar`);
  }
});

// Eliminar colección
router.post('/:id/eliminar', ensureAuthenticated, async (req, res) => {
  try {
    const collection = await validateCollectionOwnership(req.params.id, req.user._id);
    
    await Collection.findByIdAndDelete(req.params.id);
    
    req.flash('success', 'Colección eliminada con éxito');
    res.redirect('/collections/mis-colecciones');
  } catch (err) {
    console.error(err);
    req.flash('error', err.message || 'Error al eliminar la colección');
    res.redirect('/collections/mis-colecciones');
  }
});

// Añadir película a colección
router.post('/agregar-pelicula', ensureAuthenticated, async (req, res) => {
  try {
    const { movieId, collectionId } = req.body;

    if (collectionId === 'nueva') {
      const { nuevaColeccion } = req.body;
      
      if (!nuevaColeccion) {
        req.flash('error', 'Debes proporcionar un nombre para la nueva colección');
        return res.redirect(`/movies/${movieId}`);
      }
      
      const newCollection = new Collection({
        nombre: nuevaColeccion,
        peliculas: [movieId],
        creador: req.user._id,
        publica: false
      });
      
      await newCollection.save();
      
      req.flash('success', `Película añadida a nueva colección: ${nuevaColeccion}`);
      return res.redirect(`/movies/${movieId}`);
    }

    const collection = await Collection.findById(collectionId);

    if (!collection) {
      req.flash('error', 'Colección no encontrada');
      return res.redirect(`/movies/${movieId}`);
    }

    if (!req.user._id.equals(collection.creador)) {
      req.flash('error', 'No tienes permiso para modificar esta colección');
      return res.redirect(`/movies/${movieId}`);
    }

    if (collection.peliculas.includes(movieId)) {
      req.flash('info', 'Esta película ya está en la colección');
      return res.redirect(`/movies/${movieId}`);
    }

    collection.peliculas.push(movieId);
    await collection.save();
    
    req.flash('success', `Película añadida a la colección: ${collection.nombre}`);
    res.redirect(`/movies/${movieId}`);
  } catch (err) {
    console.error(err);
    req.flash('error', err.message || 'Error al añadir la película a la colección');
    res.redirect(`/movies/${req.body.movieId || ''}`);
  }
});

module.exports = router;