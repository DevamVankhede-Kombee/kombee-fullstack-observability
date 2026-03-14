const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Collect default metrics (CPU, memory, event loop lag)
client.collectDefaultMetrics({ register });

// 1. HTTP Request Duration Histogram
const httpRequestDurationHistogram = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// 2. HTTP Requests Total Counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// 3. Database Query Duration Histogram
const dbQueryDurationHistogram = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
  registers: [register],
});

// 4. Active Users Gauge
const activeUsersGauge = new client.Gauge({
  name: 'active_users_total',
  help: 'Number of active authenticated sessions',
  registers: [register],
});

// 5. Orders Created Counter
const ordersCreatedCounter = new client.Counter({
  name: 'orders_created_total',
  help: 'Total orders created',
  labelNames: ['status'],
  registers: [register],
});

// 6. Database Connections Gauge
const dbConnectionsGauge = new client.Gauge({
  name: 'db_connections_active',
  help: 'Active database connections',
  registers: [register],
});

// Sanitize route - replace UUIDs and numbers with :id
function sanitizeRoute(path) {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

// Metrics Middleware
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  // Capture response finish event
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = sanitizeRoute(req.route?.path || req.path || 'unknown');
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestDurationHistogram.observe(
      { method, route, status_code: statusCode },
      duration
    );

    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
  httpRequestDurationHistogram,
  httpRequestsTotal,
  dbQueryDurationHistogram,
  activeUsersGauge,
  ordersCreatedCounter,
  dbConnectionsGauge,
};
