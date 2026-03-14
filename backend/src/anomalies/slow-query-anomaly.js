const { logger } = require('../logger');
const { trace } = require('@opentelemetry/api');

/**
 * Slow Query Anomaly
 * Adds artificial 500ms delay to simulate slow database queries
 * Toggle with: ANOMALY_SLOW_QUERY=true
 */

const DELAY_MS = 500;

function injectSlowQueryDelay() {
  const isActive = process.env.ANOMALY_SLOW_QUERY === 'true';
  
  if (!isActive) {
    return;
  }

  logger.warn('ANOMALY ACTIVE: artificial 500ms delay injected', {
    anomaly: 'slow-query',
    delayMs: DELAY_MS
  });

  // Add span attribute if in active trace
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute('anomaly.type', 'artificial-delay');
    span.setAttribute('anomaly.delay_ms', DELAY_MS);
  }

  // Synchronous delay
  const start = Date.now();
  while (Date.now() - start < DELAY_MS) {
    // Busy wait to simulate slow query
  }
}

async function injectSlowQueryDelayAsync() {
  const isActive = process.env.ANOMALY_SLOW_QUERY === 'true';
  
  if (!isActive) {
    return;
  }

  logger.warn('ANOMALY ACTIVE: artificial 500ms delay injected', {
    anomaly: 'slow-query',
    delayMs: DELAY_MS
  });

  // Add span attribute if in active trace
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute('anomaly.type', 'artificial-delay');
    span.setAttribute('anomaly.delay_ms', DELAY_MS);
  }

  // Async delay
  await new Promise(resolve => setTimeout(resolve, DELAY_MS));
}

function isSlowQueryAnomalyActive() {
  return process.env.ANOMALY_SLOW_QUERY === 'true';
}

module.exports = {
  injectSlowQueryDelay,
  injectSlowQueryDelayAsync,
  isSlowQueryAnomalyActive,
  DELAY_MS
};
