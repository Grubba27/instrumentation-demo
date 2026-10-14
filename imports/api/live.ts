// Shapes of the documents the `live.feed` publication sends to the dashboard.

export interface FeedEvent {
  _id: string;
  seq: number;
  type: string;
  ts: number;
  name?: string | null;
  durationMs?: number;
  traceId?: string | null;
  connectionId?: string | null;
  userId?: string | null;
  args?: unknown;
  result?: unknown;
  error?: { name: string; message: string };
}

export interface MethodStat {
  _id: string;
  count: number;
  errors: number;
  totalMs: number;
  maxMs: number;
}

export interface Gauges {
  _id: string;
  connections: number;
  subscriptions: number;
}
