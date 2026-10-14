import { Meteor, type Subscription } from 'meteor/meteor';
import { Instrumentation } from 'meteor/instrumentation';
import { stats } from './method-stats';
import { live } from './connections';
import { publications, usersOnline, viewersOf } from './presence';

// Streams the event feed to the dashboard through the low-level publish API,
// so nothing is written to MongoDB.

const MAX_EVENTS = 60;
const TYPES: Instrumentation.EventType[] = [
  'method.start', 'method.end', 'method.error',
  'publication.start', 'publication.ready', 'publication.stop', 'publication.error',
  'ddp.connection.open', 'ddp.connection.close',
];

const subscribers = new Set<Subscription>();
const recent: { id: string; fields: Record<string, unknown> }[] = [];
const known = { stats: new Set<string>(), viewers: new Set<string>() };
let sequence = 0;

const gauges = () => ({ ...live, users: usersOnline() });
// Meteor's own publications are not pages anyone is looking at.
const pages = () => publications().filter((name) => !name.startsWith('meteor'));

function upsert(collection: 'stats' | 'viewers', id: string, fields: Record<string, unknown>) {
  const isNew = !known[collection].has(id);
  known[collection].add(id);
  for (const sub of subscribers) {
    if (isNew) sub.added(`live.${collection}`, id, fields);
    else sub.changed(`live.${collection}`, id, fields);
  }
}

function publishNumbers() {
  for (const sub of subscribers) sub.changed('live.gauges', 'server', gauges());
  for (const [name, stat] of stats) upsert('stats', name, { ...stat });
  for (const name of pages()) upsert('viewers', name, { count: viewersOf(name) });
}

function publishEvent(event: Instrumentation.Event) {
  const { eventName, ...fields } = event;
  sequence += 1;
  const entry = { id: String(sequence), fields: { ...fields, seq: sequence } };

  recent.push(entry);
  for (const sub of subscribers) sub.added('live.events', entry.id, entry.fields);

  if (recent.length > MAX_EVENTS) {
    const dropped = recent.shift()!;
    for (const sub of subscribers) sub.removed('live.events', dropped.id);
  }

  // Deferred so the other listeners have updated their counters first.
  Meteor.defer(publishNumbers);
}

TYPES.forEach((type) => Instrumentation.on(type, publishEvent));

Meteor.publish('live.feed', function () {
  for (const entry of recent) this.added('live.events', entry.id, entry.fields);
  this.added('live.gauges', 'server', gauges());
  for (const [name, stat] of stats) {
    known.stats.add(name);
    this.added('live.stats', name, { ...stat });
  }
  for (const name of pages()) {
    known.viewers.add(name);
    this.added('live.viewers', name, { count: viewersOf(name) });
  }

  subscribers.add(this);
  this.onStop(() => subscribers.delete(this));
  this.ready();
});
