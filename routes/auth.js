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

// Register process with validation
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

    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: await User.countDocuments() === 0 // First user is admin
    });
    
    await user.save();
    
    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    };
    
    res.redirect('/');
  } catch (error) {
    console.error('Error en registro:', error);
    res.render('auth/register', { 
      error: 'Error al registrar usuario',
      username: req.body.username,
      email: req.body.email
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