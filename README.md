# Instrumentation demo

A small Meteor 3.6 app that exercises the new `instrumentation` package. Each
use case is one short file under `server/observability/`, and the page at
`http://localhost:3600` shows the result live.

## Run it

```bash
meteor npm install
meteor npm start
```

The app runs on port 3600 (MongoDB on 3601). Press the buttons on the left and
watch both the page and the terminal.

## Use cases

| File | What it shows |
| --- | --- |
| `config.ts` | `Instrumentation.configure`: bounded previews and `onListenerError` |
| `slow-methods.ts` | Warn on slow methods, log failing ones with the real server error |
| `method-stats.ts` | Per-method call count, error count, average and max duration |
| `trace-log.ts` | `currentContext()` stamps your own log lines with the `traceId` |
| `audit.ts` | `configureMethod` keeps a card number out of the audit trail |
| `connections.ts` | Live connection and subscription counts, time to ready |
| `anomalies.ts` | A server-only method reached through a client connection |
| `otel.ts` | One OpenTelemetry span per method call and per subscription |
| `live-feed.ts` | Streams all nine event types to the dashboard |

## OpenTelemetry

Spans are exported only when a collector endpoint is set:

```bash
docker run --rm -p 16686:16686 -p 4318:4318 jaegertracing/jaeger:latest
```

```bash
meteor npm run start:otel
```

Then open `http://localhost:16686` and pick the `instrumentation-demo` service.

## Turn it all off

```bash
METEOR_INSTRUMENTATION_DISABLED=1 meteor run --port 3600
```

## Types

The app uses the native types from Meteor 3.6, so every event is typed:

```bash
meteor npm run check-types
```
