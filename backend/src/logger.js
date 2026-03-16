const winston = require('winston');
const LokiTransport = require('winston-loki');
const { trace } = require('@opentelemetry/api');

// Custom format to inject traceId and spanId from OpenTelemetry
const traceFormat = winston.format((info) => {
  const span = trace.getActiveSpan();
  if (span) {
    const spanContext = span.spanContext();
    info.traceId = spanContext.traceId;
    info.spanId = spanContext.spanId;
  }
  info.serviceName = 'kombee-backend';
  return info;
});

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    traceFormat(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'kombee-backend' },
  transports: [
    // Console transport for Docker logs
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, traceId, spanId, ...meta }) => {
          let log = `${timestamp} [${level}] ${message}`;
          if (traceId) {
            log += ` [trace:${traceId.substring(0, 8)}]`;
          }
          if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
          }
          return log;
        })
      ),
    }),
  ],
});

// Add Loki transport with error handling
try {
  const lokiTransport = new LokiTransport({
    host: process.env.LOKI_HOST || 'http://loki:3100',
    labels: {
      service_name: 'kombee-backend',
      app: 'kombee-backend',
      env: process.env.NODE_ENV || 'hackathon',
    },
    json: true,
    format: winston.format.json(),
    clearOnError: false,
    batching: false, // Disable batching for immediate sending
    timeout: 30000, // 30 second timeout
    onConnectionError: (err) => {
      console.error('Loki connection error (non-fatal):', err.message);
    },
  });

  logger.add(lokiTransport);
  lokiTransport.on('error', (err) => {
    console.error('Loki transport error emitted:', err.message);
  });
  logger.info('Loki transport initialized');
} catch (error) {
  console.warn('Failed to initialize Loki transport (continuing without it):', error.message);
}

// Request logger middleware
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const sessionId = req.headers['x-session-id'] || 'anonymous';
  const userAgent = req.headers['user-agent'];
  const correlationId = req.headers['x-correlation-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add correlation ID to request for downstream services
  req.correlationId = correlationId;

  // Log request start with business context
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    sessionId,
    correlationId,
    userAgent,
    ip: req.ip,
    businessEvent: 'http_request_start',
    requestSize: req.headers['content-length'] || 0,
  });

  // Capture response finish
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    return res.send(data);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseSize = res.get('content-length') || 0;
    
    // Determine business event type
    let businessEvent = 'http_request_complete';
    if (req.url.includes('/auth/login')) businessEvent = 'user_login_attempt';
    if (req.url.includes('/auth/register')) businessEvent = 'user_registration_attempt';
    if (req.url.includes('/orders') && req.method === 'POST') businessEvent = 'order_creation_attempt';
    if (req.url.includes('/products') && req.method === 'POST') businessEvent = 'product_creation_attempt';

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration_ms: duration,
      userId: req.user?.id,
      sessionId,
      correlationId,
      businessEvent,
      responseSize,
      success: res.statusCode < 400,
      performanceCategory: duration < 100 ? 'fast' : duration < 500 ? 'normal' : 'slow',
    });
  });

  // Capture errors
  const originalNext = next;
  next = function (err) {
    if (err) {
      const duration = Date.now() - startTime;
      
      // Enhanced error logging with business context
      logger.error('Request failed', {
        method: req.method,
        url: req.url,
        error: err.message,
        errorCode: err.code,
        errorType: err.constructor.name,
        stack: err.stack,
        duration_ms: duration,
        userId: req.user?.id,
        sessionId,
        correlationId,
        businessEvent: 'http_request_error',
        businessImpact: err.statusCode >= 500 ? 'high' : 'medium',
        retryable: err.statusCode >= 500 && err.statusCode < 600,
      });
    }
    return originalNext(err);
  };

  next();
}

module.exports = {
  logger,
  requestLogger,
};
