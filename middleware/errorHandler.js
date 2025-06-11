/**
 * @module middleware/errorHandler
 * @description This module provides a centralized error handling middleware for the Express application.
 * It catches errors passed via `next(error)` and formats the response appropriately
 * based on the error type and the request's accepted content type (JSON or HTML).
 */

/**
 * Centralized error handling middleware.
 * Logs the error stack and sends a standardized error response.
 * Customizes response status code and message based on error properties (e.g., `err.status`, `err.name`, `err.code`).
 * Handles Mongoose validation errors, CastErrors, and duplicate key errors specifically.
 * Responds with JSON for XHR or JSON-accepting requests, otherwise renders an HTML error page.
 *
 * @param {Error} err - The error object. Can have properties like `status`, `statusCode`, `name`, `message`, `code`, `keyValue`.
 * @param {object} req - The Express request object. Used to determine response type (JSON or HTML).
 * @param {object} res - The Express response object. Used to send the error response.
 * @param {function} next - The Express next middleware function (unused in this middleware as it's an error handler, but required by Express error middleware signature).
 */
function handleErrors(err, req, res, next) {
  console.error(err.stack); // Log the full error stack for debugging

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Ocurrió un error inesperado en el servidor.';

  // Mongoose Validation Error (err.name === 'ValidationError')
  if (err.name === 'ValidationError') {
    statusCode = 400; // Bad Request
    // Concatenate all Mongoose validation error messages for clarity
    message = Object.values(err.errors).map(error => error.message).join('. ');
  }

  // Mongoose CastError (e.g., invalid ObjectId format)
  if (err.name === 'CastError' && err.path && err.value) { // Added checks for path and value for more specific CastError handling
    statusCode = 400; // Bad Request
    message = `El valor '${err.value}' no es un formato válido para el campo '${err.path}'.`;
  }

  // MongoDB Duplicate Key Error (err.code === 11000)
  if (err.code === 11000 && err.keyValue) {
    statusCode = 409; // Conflict
    // Extract field and value from the error message to provide a user-friendly message
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message = `Ya existe un registro con el valor '${value}' para el campo '${field}'. Por favor, utiliza un valor diferente.`;
  }

  // Determine response type: JSON or HTML
  // req.xhr is true if the request was made by an AJAX call (e.g., fetch)
  // req.accepts('json') checks the 'Accept' header for 'application/json'
  // !req.accepts('html') ensures that if client accepts both, JSON is preferred if it's not explicitly an HTML request.
  if (req.xhr || (req.accepts('json') && !req.accepts('html'))) {
    res.status(statusCode).json({
      success: false,
      error: message,
      // Include stack trace in development environment for easier debugging via API
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  } else {
    // Render an HTML error page for browser-based requests
    // Assumes 'views/error.ejs' can display statusCode, message, and errorStack
    res.status(statusCode).render('error', {
      message,
      statusCode,
      // Only show stack trace in development environment for security reasons
      errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      title: `Error ${statusCode}` // Add a title for the error page
    });
  }
}

module.exports = handleErrors;
