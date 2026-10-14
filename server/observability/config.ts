import { Instrumentation } from 'meteor/instrumentation';

Instrumentation.configure({
  // Off by default. The demo turns on bounded previews so the dashboard has
  // something to show.
  captureMethodArgs: 'preview',
  captureMethodResult: 'preview',
  // A failing listener is silent unless you ask to hear about it.
  onListenerError: (error, event) => {
    console.error(`[instrumentation] listener failed on ${event.type}:`, error);
  },
});
