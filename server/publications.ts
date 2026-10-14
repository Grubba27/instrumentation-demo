import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { AuditLog, Orders } from '/imports/api/orders';

Meteor.publish('orders.recent', function (limit: number) {
  check(limit, Number);
  return Orders.find({}, { sort: { createdAt: -1 }, limit });
});

// Errors for anonymous clients, works once you are logged in.
Meteor.publish('orders.mine', function () {
  if (!this.userId) {
    throw new Meteor.Error('not-authorized', 'Log in to see your orders');
  }
  return Orders.find({ ownerId: this.userId }, { sort: { createdAt: -1 }, limit: 20 });
});

Meteor.publish('audit.recent', function () {
  return AuditLog.find({}, { sort: { at: -1 }, limit: 8 });
});
