const { logger } = require('../logger');
const { trace } = require('@opentelemetry/api');

/**
 * Random Errors Anomaly
 * Randomly throws errors 5% of the time to simulate intermittent failures
 * Toggle with: ANOMALY_RANDOM_ERRORS=true
 */

const ERROR_RATE = 0.05; // 5% error rate

function randomErrorMiddleware(req, res, next) {
  const isActive = process.env.ANOMALY_RANDOM_ERRORS === 'true';
  
  if (!isActive) {
    return next();
  }

  // 5% chance of throwing an error
  if (Math.random() < ERROR_RATE) {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute('anomaly.type', 'random-error');
      span.setAttribute('anomaly.error_rate', ERROR_RATE);
    }

    logger.error('ANOMALY: Random error injected', {
      anomaly: 'random-error',
      errorRate: ERROR_RATE,
      method: req.method,
      url: req.url
    });

    const error = new Error('Random server error - simulated failure');
    error.statusCode = 500;
    return next(error);
  }

  next();
}

function isRandomErrorAnomalyActive() {
  return process.env.ANOMALY_RANDOM_ERRORS === 'true';
}

module.exports = {
  randomErrorMiddleware,
  isRandomErrorAnomalyActive,
  ERROR_RATE
};
