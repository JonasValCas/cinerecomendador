/**
 * Middleware de autenticación para el Sistema de Recomendación de Películas
 */

// Middleware para verificar si el usuario está autenticado
const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
};

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.isAdmin) {
    return next();
  }
  res.status(403).render('error', { message: 'Acceso denegado. Se requieren permisos de administrador.' });
};

module.exports = { ensureAuthenticated, isAdmin };
