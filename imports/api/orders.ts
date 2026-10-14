import { Mongo } from 'meteor/mongo';

export interface Order {
  _id?: string;
  customer: string;
  total: number;
  status: 'paid' | 'refunded';
  ownerId: string | null;
  createdAt: Date;
}

export interface Card {
  number: string;
  cvv: string;
}

export interface AuditEntry {
  _id?: string;
  at: Date;
  userId: string | null;
  action: string;
  args: unknown;
  traceId: string | null;
  durationMs: number;
}

export const Orders = new Mongo.Collection<Order>('orders');
export const AuditLog = new Mongo.Collection<AuditEntry>('auditLog');
