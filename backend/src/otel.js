const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { resourceFromAttributes, defaultResource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');
const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

let sdk;

function startOtel() {
  // Configure the OTLP exporter
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://tempo:4318/v1/traces',
  });

  // Configure the resource with service information
  const resource = defaultResource().merge(
    resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'kombee-backend',
      [ATTR_SERVICE_VERSION]: '1.0.0',
    })
  );

  // Initialize the SDK
  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable file system instrumentation to reduce noise
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
        // Enable HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          enabled: true,
        },
        // Enable Express instrumentation
        '@opentelemetry/instrumentation-express': {
          enabled: true,
        },
        // Enable PostgreSQL instrumentation
        '@opentelemetry/instrumentation-pg': {
          enabled: true,
        },
      }),
    ],
  });

  // Start the SDK
  sdk.start();
  console.log('✅ OpenTelemetry tracing initialized');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully'))
      .catch((error) => console.error('Error shutting down OpenTelemetry SDK', error))
      .finally(() => process.exit(0));
  });
}

// Export the start function and OpenTelemetry API
module.exports = {
  startOtel,
  trace,
  context,
  SpanStatusCode,
};
