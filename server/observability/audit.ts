import { Instrumentation } from 'meteor/instrumentation';
import { AuditLog, type Card } from '/imports/api/orders';

// orders.refund receives (orderId, amount, card). Record the first two only.
Instrumentation.configureMethod<[string, number, Card]>('orders.refund', {
  captureArgs: ([orderId, amount]) => ({ orderId, amount }),
});

Instrumentation.on('method.end', async (event) => {
  if (event.name !== 'orders.refund') return;

  await AuditLog.insertAsync({
    at: new Date(event.ts),
    userId: event.userId,
    action: event.name,
    args: event.args,
    traceId: event.traceId,
    durationMs: event.durationMs,
  });
});
