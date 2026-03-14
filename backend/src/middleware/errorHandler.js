const { logger } = require('../logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Log the error with trace context
  if (statusCode >= 500) {
    logger.error('Internal server error', {
      endpoint: `${req.method} ${req.url}`,
      error: err.message,
      stack: err.stack,
      statusCode,
      errorName: err.name,
    });
  } else {
    logger.warn('Unhandled error', {
      error: err.message,
      stack: err.stack,
      statusCode,
      errorName: err.name,
      method: req.method,
      url: req.url,
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
