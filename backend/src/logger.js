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

  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    ip: req.ip,
  });

  // Capture response finish
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    return res.send(data);
  };

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration_ms: duration,
      userId: req.user?.id,
    });
  });

  // Capture errors
  const originalNext = next;
  next = function (err) {
    if (err) {
      const duration = Date.now() - startTime;
      logger.error('Request failed', {
        method: req.method,
        url: req.url,
        error: err.message,
        stack: err.stack,
        duration_ms: duration,
        userId: req.user?.id,
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
