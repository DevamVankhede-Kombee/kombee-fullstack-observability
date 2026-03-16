const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { resourceFromAttributes, defaultResource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');
const { trace, context, SpanStatusCode, SpanKind } = require('@opentelemetry/api');

let sdk;
let tracer;

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
      'service.environment': process.env.NODE_ENV || 'hackathon',
      'service.team': 'kombee-team',
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
  
  // Get tracer for custom spans
  tracer = trace.getTracer('kombee-backend', '1.0.0');
  
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

// Helper function to create business logic spans
function createBusinessSpan(name, operation, attributes = {}) {
  return tracer.startSpan(name, {
    kind: SpanKind.INTERNAL,
    attributes: {
      'business.operation': operation,
      'service.name': 'kombee-backend',
      ...attributes,
    },
  });
}

// Helper function to wrap async business operations
async function traceBusinessOperation(name, operation, fn, attributes = {}) {
  const span = createBusinessSpan(name, operation, attributes);
  
  // Hidden: Add correlation with external systems (expert-level)
  const correlationId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  span.setAttribute('hidden.correlation_id', correlationId);
  span.setAttribute('hidden.expert_tracing', true);
  
  try {
    const result = await context.with(trace.setSpan(context.active(), span), fn);
    span.setStatus({ code: SpanStatusCode.OK });
    
    // Hidden: Add result metadata for expert analysis
    if (result && typeof result === 'object') {
      span.setAttribute('hidden.result_type', Array.isArray(result) ? 'array' : 'object');
      span.setAttribute('hidden.result_size', JSON.stringify(result).length);
    }
    
    return result;
  } catch (error) {
    span.recordException(error);
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error.message 
    });
    
    // Hidden: Advanced error classification
    span.setAttribute('hidden.error_category', 
      error.statusCode >= 500 ? 'server_error' : 
      error.statusCode >= 400 ? 'client_error' : 'unknown');
    span.setAttribute('hidden.error_retryable', error.statusCode >= 500 && error.statusCode < 600);
    
    throw error;
  } finally {
    span.end();
  }
}

// Export the start function and OpenTelemetry API
module.exports = {
  startOtel,
  trace,
  context,
  SpanStatusCode,
  SpanKind,
  tracer: () => tracer,
  createBusinessSpan,
  traceBusinessOperation,
};
