import { Instrumentation } from 'meteor/instrumentation';
import { SpanKind, SpanStatusCode, type Span } from '@opentelemetry/api';
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';

type Kind = 'method' | 'publication';
type Invocation = Instrumentation.InvocationEvent & { name: string | null };

// Only export when a collector is configured, e.g.
// OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 meteor run
if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  const provider = new BasicTracerProvider({
    resource: resourceFromAttributes({ 'service.name': 'instrumentation-demo' }),
    spanProcessors: [
      new BatchSpanProcessor(new OTLPTraceExporter(), { scheduledDelayMillis: 1000 }),
    ],
  });
  const tracer = provider.getTracer('meteor-instrumentation');
  const open = new Map<string, Span>();

  const start = (kind: Kind) => (event: Invocation) => {
    if (!event.traceId) return;
    const name = event.name ?? '(universal)';
    const span = tracer.startSpan(`${kind} ${name}`, {
      kind: SpanKind.SERVER,
      startTime: event.ts,
      attributes: {
        'rpc.system': 'ddp',
        'meteor.kind': kind,
        'meteor.name': name,
        'meteor.trace_id': event.traceId,
        'meteor.connection_id': event.connectionId ?? 'server',
        'meteor.user_id': event.userId ?? 'anonymous',
      },
    });
    open.set(event.traceId, span);
  };

  const finish = (event: Invocation & { error?: Instrumentation.ErrorPreview }) => {
    const span = event.traceId ? open.get(event.traceId) : undefined;
    if (!span || !event.traceId) return;
    open.delete(event.traceId);
    if (event.error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: event.error.message });
      span.setAttribute('error.type', event.error.name);
    }
    span.end(event.ts);
  };

  Instrumentation.on('method.start', start('method'));
  Instrumentation.on('method.end', finish);
  Instrumentation.on('method.error', finish);

  // A publication span covers the time from subscribe to ready. One that stops
  // before it is ready is dropped: a span that never ends is never exported.
  Instrumentation.on('publication.start', start('publication'));
  Instrumentation.on('publication.ready', finish);
  Instrumentation.on('publication.error', finish);
  Instrumentation.on('publication.stop', (event) => {
    if (event.traceId) open.delete(event.traceId);
  });

  console.log(`OpenTelemetry: exporting spans to ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}`);
}
