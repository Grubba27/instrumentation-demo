import { Instrumentation } from 'meteor/instrumentation';

const SLOW_MS = 200;

Instrumentation.on('method.end', (event) => {
  if (event.durationMs > SLOW_MS) {
    console.warn(`slow method: ${event.name} took ${event.durationMs}ms`);
  }
});

Instrumentation.on('method.error', (event) => {
  const { name, message } = event.error;
  console.error(`method failed: ${event.name} after ${event.durationMs}ms (${name}: ${message})`);
});
