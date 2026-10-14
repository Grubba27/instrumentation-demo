import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Orders, type Card } from '/imports/api/orders';
import { log } from './observability/trace-log';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

Meteor.methods({
  async 'orders.create'(customer: string, total: number) {
    check(customer, String);
    check(total, Number);

    log('creating order', { customer });
    const orderId = await Orders.insertAsync({
      customer,
      total,
      status: 'paid',
      ownerId: this.userId,
      createdAt: new Date(),
    });
    log('order created', { orderId });
    return orderId;
  },

  // Slow on purpose: stands in for an aggregation that is missing an index.
  async 'orders.report'() {
    await sleep(300 + Math.random() * 500);
    const orders = await Orders.find().fetchAsync();
    return {
      count: orders.length,
      revenue: orders.reduce((sum, order) => sum + order.total, 0),
    };
  },

  async 'orders.refund'(orderId: string, amount: number, card: Card) {
    check(orderId, String);
    check(amount, Number);
    check(card, { number: String, cvv: String });

    const order = await Orders.findOneAsync(orderId);
    if (!order) {
      throw new Meteor.Error('not-found', `Order ${orderId} does not exist`);
    }
    await Orders.updateAsync(orderId, { $set: { status: 'refunded' } });
    return { orderId, refunded: amount };
  },

  // Fails with an error the client is allowed to see.
  async 'orders.import'(csv: string) {
    check(csv, String);
    throw new Meteor.Error('invalid-csv', 'Row 3 is missing the "total" column');
  },

  // Fails with a plain bug. The client only gets "Internal server error".
  async 'orders.recalculate'(orderId: unknown) {
    check(orderId, Match.Maybe(String));
    const order = await Orders.findOneAsync('this-order-does-not-exist');
    return order!.total * 1.1;
  },

  // Meant for a server-side job only. Nothing stops a client from calling it.
  async 'db.reindex'() {
    await sleep(40);
    return 'reindexed';
  },
});
