import { Mongo } from 'meteor/mongo';
import type { FeedEvent, Gauges, MethodStat, Viewers } from '/imports/api/live';

// Client-only collections filled by the `live.feed` publication.
export const FeedEvents = new Mongo.Collection<FeedEvent>('live.events');
export const MethodStats = new Mongo.Collection<MethodStat>('live.stats');
export const LiveGauges = new Mongo.Collection<Gauges>('live.gauges');
export const LiveViewers = new Mongo.Collection<Viewers>('live.viewers');
