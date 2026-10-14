import { Instrumentation } from 'meteor/instrumentation';

const SERVER_ONLY = new Set(['db.reindex']);

// A call the server makes on its own has no connection behind it.
Instrumentation.on('method.start', (event) => {
  if (SERVER_ONLY.has(event.name) && event.connectionId !== null) {
    console.error(`ALERT: ${event.name} was called by a client (connection ${event.connectionId})`);
  }
});
