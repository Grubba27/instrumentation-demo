import type { FeedEvent } from '/imports/api/live';

const time = (ts: number) => new Date(ts).toLocaleTimeString([], { hour12: false });

function label(event: FeedEvent) {
  if (event.type.startsWith('ddp.')) return event.connectionId;
  return event.name ?? '(universal publication)';
}

function detail(event: FeedEvent) {
  if (event.error) return `${event.error.name}: ${event.error.message}`;
  if (event.result !== undefined) return `result ${JSON.stringify(event.result)}`;
  if (event.args !== undefined) return `args ${JSON.stringify(event.args)}`;
  return '';
}

export const EventFeed = ({ events }: { events: FeedEvent[] }) => (
  <div className="feed">
    {events.map((event) => (
      <div className="row" key={event._id}>
        <span className="time">{time(event.ts)}</span>
        <span className={`type ${event.type.replace(/\./g, '-')}`}>{event.type}</span>
        <span className="name">{label(event)}</span>
        <span className="duration">{event.durationMs !== undefined ? `${event.durationMs}ms` : ''}</span>
        <span className="trace">{event.traceId?.slice(0, 6)}</span>
        <span className="detail">{detail(event)}</span>
      </div>
    ))}
  </div>
);
