require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');

// Import routes
const { router: authRoutes, isAuthenticated, isAdmin } = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const userRoutes = require('./routes/users');
const chatRoutes = require('./routes/chat');
const adminMoviesRoutes = require('./routes/admin-movies');
const collectionRoutes = require('./routes/collections');
const favoriteRoutes = require('./routes/favorites');
const reviewRoutes = require('./routes/reviews');

// Flash messages
const flash = require('connect-flash');

// Create Express app
const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup EJS Layouts
app.use(ejsLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-recommender',
    ttl: 14 * 24 * 60 * 60 // 14 days
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
  }
}));

// Flash messages middleware
app.use(flash());

// Global middleware to check if user is logged in and setup flash messages
app.use((req, res, next) => {
  // Configurar datos de usuario tanto en res.locals como en req.user para consistencia
  res.locals.currentUser = req.session.user || null;
  res.locals.isAdmin = req.session.user?.isAdmin || false;
  
  // Configurar req.user para que las rutas puedan acceder a los datos del usuario
  if (req.session.user) {
    req.user = req.session.user;
  }
  
  // Configurar mensajes flash
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error'),
    info: req.flash('info')
  };
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/movies', movieRoutes);
app.use('/users', userRoutes);
app.use('/chat', chatRoutes);
app.use('/admin/movies', adminMoviesRoutes);
app.use('/collections', collectionRoutes);
app.use('/favorites', favoriteRoutes);
app.use('/reviews', reviewRoutes);

// Home route
app.get('/', (req, res) => {
  res.redirect('/movies');
});

// Error Handling Middleware
const handleErrors = require('./middleware/errorHandler');
app.use(handleErrors);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/movie-recommender')
  .then(() => {
    console.log('Connectado a MongoDB');
    // Start server with Socket.io
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    // Setup Socket.io
    const io = require('socket.io')(server);
    const { initSocketManager } = require('./services/socketManager');
    initSocketManager(io);
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
