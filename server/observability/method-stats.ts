import { Instrumentation } from 'meteor/instrumentation';

export interface Stat {
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
}

export const stats = new Map<string, Stat>();

function record(name: string, durationMs: number, failed: boolean) {
  const stat = stats.get(name) ?? { count: 0, errors: 0, totalMs: 0, maxMs: 0 };
  stat.count += 1;
  stat.errors += failed ? 1 : 0;
  stat.totalMs += durationMs;
  stat.maxMs = Math.max(stat.maxMs, durationMs);
  stats.set(name, stat);
}

Instrumentation.on('method.end', (event) => record(event.name, event.durationMs, false));
Instrumentation.on('method.error', (event) => record(event.name, event.durationMs, true));
