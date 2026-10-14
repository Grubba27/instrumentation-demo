import { Instrumentation } from 'meteor/instrumentation';

// Call this from inside a method or publication: the line is stamped with the
// traceId of the invocation that is running.
export function log(message: string, data: Record<string, unknown> = {}) {
  const { traceId, name } = Instrumentation.currentContext();
  console.log(JSON.stringify({ traceId, method: name, message, ...data }));
}

Instrumentation.on('method.end', (event) => {
  console.log(JSON.stringify({
    traceId: event.traceId,
    method: event.name,
    message: 'method.end',
    durationMs: event.durationMs,
  }));
});
