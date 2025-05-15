const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const { isAuthenticated, isAdmin } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware para verificar que la película exista
async function movieExists(req, res, next) {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).render('error', { message: 'Película no encontrada' });
    }
    req.movie = movie; // Guardamos la película en el request para usarla después
    next();
  } catch (error) {
    console.error('Error al verificar película:', error);
    res.status(500).render('error', { message: 'Error al verificar la película' });
  }
}

// Configurar almacenamiento para imágenes
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/images/movies');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    cb(null, 'movie-' + Date.now() + path.extname(file.originalname));
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const mimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (mimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPEG, PNG, GIF)'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

// Middleware para verificar que el usuario es admin
router.use(isAuthenticated, isAdmin);

// Panel de administración de películas
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.render('admin/movies', { movies, title: 'Administrar Películas' });
  } catch (error) {
    console.error('Error al obtener películas:', error);
    res.status(500).render('error', { message: 'Error al cargar películas' });
  }
});

// Formulario para agregar película
router.get('/add', (req, res) => {
  res.render('admin/movie-form', { title: 'Agregar Película', movie: null, action: '/admin/movies/add' });
});

// Procesar formulario de nueva película
router.post('/add', upload.single('imagen'), async (req, res) => {
  const { titulo, genero, descripcion, anio } = req.body;
  try {
    const newMovie = new Movie({
      titulo,
      genero,
      descripcion,
      anio: parseInt(anio),
      imagen: req.file ? `/images/movies/${req.file.filename}` : '/images/default-movie.jpg'
    });
    await newMovie.save();
    req.flash('success', 'Película agregada correctamente');
    res.redirect('/admin/movies');
  } catch (error) {
    console.error('Error al agregar película:', error);
    res.status(500).render('error', { message: 'Error al agregar película' });
  }
});

// Formulario para editar película
router.get('/edit/:id', movieExists, (req, res) => {
  res.render('admin/movie-form', { title: 'Editar Película', movie: req.movie, action: `/admin/movies/edit/${req.movie._id}` });
});

// Procesar formulario de edición de película
router.post('/edit/:id', movieExists, upload.single('imagen'), async (req, res) => {
  const { titulo, genero, descripcion, anio } = req.body;
  const movie = req.movie; // Usamos la película que ya cargamos en el middleware movieExists
  
  try {
    movie.titulo = titulo;
    movie.genero = genero;
    movie.descripcion = descripcion;
    movie.anio = parseInt(anio);

    if (req.file) {
      if (movie.imagen && movie.imagen !== '/images/default-movie.jpg') {
        const oldImagePath = path.join(__dirname, '../public', movie.imagen);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      movie.imagen = `/images/movies/${req.file.filename}`;
    }

    await movie.save();
    req.flash('success', 'Película actualizada correctamente');
    res.redirect('/admin/movies');
  } catch (error) {
    console.error('Error al actualizar película:', error);
    res.status(500).render('error', { message: 'Error al actualizar película' });
  }
});

// Eliminar película
router.post('/delete/:id', movieExists, async (req, res) => {
  const movie = req.movie;

  try {
    if (movie.imagen && movie.imagen !== '/images/default-movie.jpg') {
      const imagePath = path.join(__dirname, '../public', movie.imagen);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await Movie.findByIdAndDelete(req.params.id);
    req.flash('success', 'Película eliminada correctamente');
    res.redirect('/admin/movies');
  } catch (error) {
    console.error('Error al eliminar película:', error);
    res.status(500).render('error', { message: 'Error al eliminar película' });
  }
});

module.exports = router;