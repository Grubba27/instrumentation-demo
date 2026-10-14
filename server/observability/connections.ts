import { Instrumentation } from 'meteor/instrumentation';

export const live = { connections: 0, subscriptions: 0 };

Instrumentation.on('ddp.connection.open', () => {
  live.connections += 1;
});

Instrumentation.on('ddp.connection.close', (event) => {
  live.connections -= 1;
  console.log(`connection ${event.connectionId} closed after ${Math.round(event.durationMs / 1000)}s`);
});

// Every publication.start is followed by exactly one stop or error.
Instrumentation.on('publication.start', () => {
  live.subscriptions += 1;
});

Instrumentation.on('publication.stop', () => {
  live.subscriptions -= 1;
});

Instrumentation.on('publication.error', (event) => {
  live.subscriptions -= 1;
  console.error(`publication failed: ${event.name} (${event.error.message})`);
});

Instrumentation.on('publication.ready', (event) => {
  console.log(`publication ready: ${event.name} in ${event.durationMs}ms`);
});
