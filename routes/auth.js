const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator'); // Añadimos express-validator

// Validación de inputs
const validateLogin = [
  body('email').isEmail().withMessage('El email no es válido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
];

const validateRegister = [
  body('username').notEmpty().withMessage('El nombre de usuario es obligatorio'),
  body('email').isEmail().withMessage('El email no es válido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Las contraseñas no coinciden')
];

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/login');
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/register');
});

// Login process with validation
router.post('/login', validateLogin, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', { error: errors.array()[0].msg });
  }

  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', { error: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render('auth/login', { error: 'Credenciales inválidas' });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    };

    res.redirect('/');
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    res.render('auth/login', { error: 'Error al iniciar sesión' });
  }
});

// Register process with validation - STEP 1
router.post('/register', validateRegister, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/register', { 
      error: errors.array()[0].msg,
      username: req.body.username,
      email: req.body.email
    });
  }

  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.render('auth/register', { 
        error: 'El usuario o email ya está registrado',
        username,
        email
      });
    }

    // Hash password and store data in session
    const hashedPassword = await bcrypt.hash(password, 10);
    req.session.registrationData = {
      username,
      email,
      password: hashedPassword,
      isAdmin: await User.countDocuments() === 0 // First user is admin
    };
    
    // Redirect to simulated payment page
    res.redirect('/auth/subscribe');

  } catch (error) {
    console.error('Error en registro (paso 1):', error);
    res.render('auth/register', { 
      error: 'Error al procesar el registro',
      username: req.body.username,
      email: req.body.email
    });
  }
});

// Show subscription page - STEP 2
router.get('/subscribe', (req, res) => {
  if (!req.session.registrationData) {
    // If there's no registration data, redirect back to the start
    return res.redirect('/auth/register');
  }
  res.render('auth/subscribe');
});

// Complete registration after simulated payment - STEP 3
router.post('/complete-registration', async (req, res) => {
  try {
    if (!req.session.registrationData) {
      return res.redirect('/auth/register');
    }

    const { username, email, password, isAdmin } = req.session.registrationData;

    // Create new user
    const user = new User({
      username,
      email,
      password, // Password is already hashed
      isAdmin,
      subscriptionStatus: 'active' // Set subscription to active
    });
    
    await user.save();
    
    // Clean up session
    delete req.session.registrationData;

    // Log the user in
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    };
    
    res.redirect('/');

  } catch (error) {
    console.error('Error al completar el registro:', error);
    // Clean up session data on error to prevent being stuck
    if (req.session) {
      delete req.session.registrationData;
    }
    res.render('auth/register', { 
      error: 'Error al crear la cuenta. Por favor, intenta registrarte de nuevo.'
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.redirect('/auth/login');
  });
});

module.exports = { router, isAuthenticated: ensureAuthenticated, isAdmin };