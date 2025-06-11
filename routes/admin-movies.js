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
      const error = new Error('Película no encontrada');
      error.status = 404;
      return next(error);
    }
    req.movie = movie; // Guardamos la película en el request para usarla después
    next();
  } catch (error) {
    // console.error('Error al verificar película:', error); // Will be logged by central handler
    next(error);
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
    // Pass an error to cb if file type is not supported
    const err = new Error('Solo se permiten imágenes (JPEG, PNG, GIF)');
    err.status = 400; // Bad Request
    cb(err, false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

const handleUpload = upload.single('imagen');

// Middleware para verificar que el usuario es admin
router.use(isAuthenticated, isAdmin);

// Panel de administración de películas
router.get('/', async (req, res, next) => { // Added next
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.render('admin/movies', { movies, title: 'Administrar Películas' });
  } catch (error) {
    // console.error('Error al obtener películas:', error); // Will be logged by central handler
    next(error);
  }
});

// Formulario para agregar película
router.get('/add', (req, res) => {
  res.render('admin/movie-form', { title: 'Agregar Película', movie: null, action: '/admin/movies/add' });
});

// Procesar formulario de nueva película
router.post('/add', (req, res, next) => { // Added next
  handleUpload(req, res, async (err) => {
    if (err) {
      // Multer errors (e.g., file too large, or our custom file filter error)
      if (err instanceof multer.MulterError) {
        err.status = 400; // Bad Request for multer-specific errors
      } else if (!err.status) {
        // Ensure other errors from multer (like fs errors) or our filter get a status
        err.status = err.status || 500;
      }
      return next(err);
    }

    const { titulo, genero, descripcion, anio } = req.body;
    try {
      const newMovie = new Movie({
        titulo,
        genero,
        descripcion,
        anio: parseInt(anio), // Consider adding validation for anio
        imagen: req.file ? `/images/movies/${req.file.filename}` : '/images/default-movie.jpg'
      });
      await newMovie.save();
      req.flash('success', 'Película agregada correctamente');
      res.redirect('/admin/movies');
    } catch (error) {
      // Handle Mongoose validation errors or other save errors
      // console.error('Error al agregar película:', error); // Will be logged by central handler
      // If there's an error and a file was uploaded, attempt to delete it
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error al eliminar archivo subido tras fallo:', unlinkErr);
        });
      }
      next(error);
    }
  });
});

// Formulario para editar película
router.get('/edit/:id', movieExists, (req, res) => { // movieExists already calls next or responds
  res.render('admin/movie-form', { title: 'Editar Película', movie: req.movie, action: `/admin/movies/edit/${req.movie._id}` });
});

// Procesar formulario de edición de película
router.post('/edit/:id', movieExists, (req, res, next) => { // Added next, movieExists calls next
  handleUpload(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        err.status = 400;
      } else if (!err.status) {
        err.status = err.status || 500;
      }
      return next(err);
    }

    const { titulo, genero, descripcion, anio } = req.body;
    const movie = req.movie; // Usamos la película que ya cargamos en el middleware movieExists

    try {
      movie.titulo = titulo;
      movie.genero = genero;
      movie.descripcion = descripcion;
      movie.anio = parseInt(anio); // Consider validation

      const oldImagePath = movie.imagen; // Store old image path

      if (req.file) {
        movie.imagen = `/images/movies/${req.file.filename}`;
      }

      await movie.save();

      // Delete old image only if save was successful and image changed
      if (req.file && oldImagePath && oldImagePath !== '/images/default-movie.jpg' && oldImagePath !== movie.imagen) {
        const fullOldPath = path.join(__dirname, '../public', oldImagePath);
        if (fs.existsSync(fullOldPath)) {
          fs.unlink(fullOldPath, (unlinkErr) => {
            if (unlinkErr) console.error('Error al eliminar imagen antigua:', unlinkErr);
          });
        }
      }

      req.flash('success', 'Película actualizada correctamente');
      res.redirect('/admin/movies');
    } catch (error) {
      // console.error('Error al actualizar película:', error); // Will be logged by central handler
      // If there's an error and a new file was uploaded, attempt to delete it
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error al eliminar archivo subido tras fallo de actualización:', unlinkErr);
        });
      }
      next(error);
    }
  });
});

// Eliminar película
router.post('/delete/:id', movieExists, async (req, res, next) => { // Added next, movieExists calls next
  const movie = req.movie;

  try {
    const imagePathToDelete = movie.imagen;

    const deletedMovie = await Movie.findByIdAndDelete(req.params.id);
    if (!deletedMovie) {
        const error = new Error('Película no encontrada al intentar eliminar.');
        error.status = 404;
        return next(error);
    }

    if (imagePathToDelete && imagePathToDelete !== '/images/default-movie.jpg') {
      const fullPath = path.join(__dirname, '../public', imagePathToDelete);
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (unlinkErr) => {
          if (unlinkErr) console.error('Error al eliminar imagen de película borrada:', unlinkErr);
        });
      }
    }

    req.flash('success', 'Película eliminada correctamente');
    res.redirect('/admin/movies');
  } catch (error) {
    // console.error('Error al eliminar película:', error); // Will be logged by central handler
    next(error);
  }
});

module.exports = router;