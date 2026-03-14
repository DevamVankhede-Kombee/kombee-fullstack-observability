// CRITICAL: OpenTelemetry MUST be initialized FIRST before any other imports
require('./otel').startOtel();

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const errorHandler = require('./middleware/errorHandler');
const { register, metricsMiddleware } = require('./metrics');
const { logger, requestLogger } = require('./logger');
const { randomErrorMiddleware } = require('./anomalies/random-errors-anomaly');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics middleware
app.use(metricsMiddleware);

// Request logger middleware
app.use(requestLogger);

// Random error anomaly middleware (if enabled)
app.use(randomErrorMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Log active anomalies
  const anomalies = [];
  if (process.env.ANOMALY_SLOW_QUERY === 'true') anomalies.push('SLOW_QUERY');
  if (process.env.ANOMALY_N_PLUS_ONE === 'true') anomalies.push('N_PLUS_ONE');
  if (process.env.ANOMALY_RANDOM_ERRORS === 'true') anomalies.push('RANDOM_ERRORS');
  
  if (anomalies.length > 0) {
    logger.warn('⚠️  ANOMALIES ACTIVE', { anomalies });
  } else {
    logger.info('No anomalies active');
  }
});

module.exports = app;
