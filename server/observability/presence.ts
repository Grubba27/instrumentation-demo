import { Instrumentation } from 'meteor/instrumentation';

// connectionId -> userId, null while the visitor is anonymous
const online = new Map<string, string | null>();
// publication name -> the subscriptions open on it right now
const viewers = new Map<string, Set<string>>();

Instrumentation.on('ddp.connection.open', (event) => {
  online.set(event.connectionId, null);
});

Instrumentation.on('ddp.connection.close', (event) => {
  online.delete(event.connectionId);
});

// Meteor restarts a connection's publications on login and logout, so the
// latest publication.start always carries the connection's current user.
Instrumentation.on('publication.start', (event) => {
  if (!event.connectionId) return;
  online.set(event.connectionId, event.userId);

  if (!event.name || !event.subscriptionId) return;
  if (!viewers.has(event.name)) viewers.set(event.name, new Set());
  viewers.get(event.name)!.add(event.subscriptionId);
});

const leave = (event: Instrumentation.PublicationStopEvent | Instrumentation.PublicationErrorEvent) => {
  if (event.name && event.subscriptionId) viewers.get(event.name)?.delete(event.subscriptionId);
};

Instrumentation.on('publication.stop', leave);
Instrumentation.on('publication.error', leave);

export const usersOnline = () => new Set([...online.values()].filter(Boolean)).size;
export const viewersOf = (publication: string) => viewers.get(publication)?.size ?? 0;
export const publications = () => [...viewers.keys()];
