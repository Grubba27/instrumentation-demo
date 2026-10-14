import { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useFind, useSubscribe, useTracker } from 'meteor/react-meteor-data';
import { AuditLog, Orders } from '/imports/api/orders';
import { DEMO_USER } from '/imports/api/demo-user';
import { FeedEvents, LiveGauges, LiveViewers, MethodStats } from './live';
import { EventFeed } from './EventFeed';

const CUSTOMERS = ['Ada', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara'];
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export const App = () => {
  useSubscribe('live.feed');
  useSubscribe('audit.recent');

  const [showOrders, setShowOrders] = useState(false);
  const [clientSaw, setClientSaw] = useState('Nothing yet. Press a button.');

  const userId = useTracker(() => Meteor.userId(), []);
  useTracker(() => {
    if (showOrders) Meteor.subscribe('orders.recent', 5);
  }, [showOrders]);

  const gauges = useTracker(() => LiveGauges.findOne('server'), []);
  const stats = useFind(() => MethodStats.find({}, { sort: { totalMs: -1 } }), []);
  const events = useFind(() => FeedEvents.find({}, { sort: { seq: -1 }, limit: 40 }), []);
  const viewers = useFind(() => LiveViewers.find({ count: { $gt: 0 } }, { sort: { count: -1, _id: 1 } }), []);
  const audit = useFind(() => AuditLog.find({}, { sort: { at: -1 } }), []);
  const orders = useFind(() => Orders.find({}, { sort: { createdAt: -1 }, limit: 5 }), []);

  const calls = stats.reduce((sum, stat) => sum + stat.count, 0);
  const errors = stats.reduce((sum, stat) => sum + stat.errors, 0);
  const viewingOrders = viewers.find((entry) => entry._id === 'orders.recent')?.count ?? 0;

  const call = async (name: string, ...args: unknown[]) => {
    try {
      const result = await Meteor.callAsync(name, ...args);
      setClientSaw(`${name} returned ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      setClientSaw(`${name} failed: ${(error as Error).message}`);
    }
  };

  const refund = async () => {
    const orderId = (await call('orders.create', pick(CUSTOMERS), 120)) as string | undefined;
    if (!orderId) return;
    await call('orders.refund', orderId, 120, { number: '4242 4242 4242 4242', cvv: '123' });
  };

  const subscribeToMine = () => {
    const handle = Meteor.subscribe('orders.mine', {
      onReady: () => {
        setClientSaw('orders.mine is ready');
        handle.stop();
      },
      onStop: (error?: Meteor.Error) => {
        if (error) setClientSaw(`orders.mine failed: ${error.message}`);
      },
    });
  };

  const toggleLogin = () => {
    if (userId) Meteor.logout();
    else Meteor.loginWithPassword(DEMO_USER.username, DEMO_USER.password);
  };

  return (
    <div className="page">
      <header>
        <div>
          <h1>Instrumentation demo</h1>
          <p>Every number on this page comes from <code>meteor/instrumentation</code> events.</p>
        </div>
        <button className="ghost" onClick={toggleLogin}>
          {userId ? `Log out (${DEMO_USER.username})` : 'Log in as demo'}
        </button>
      </header>

      <section className="tiles">
        <Tile label="Connections" value={gauges?.connections ?? 0} />
        <Tile label="Users online" value={gauges?.users ?? 0} />
        <Tile label="Open subscriptions" value={gauges?.subscriptions ?? 0} />
        <Tile label="Method calls" value={calls} />
        <Tile label="Failed calls" value={errors} tone={errors ? 'bad' : undefined} />
      </section>

      <section className="viewers">
        <span>Viewing now</span>
        {viewers.map((entry) => (
          <span className="chip" key={entry._id}>
            <code>{entry._id}</code> {entry.count}
          </span>
        ))}
      </section>

      <div className="columns">
        <aside>
          <h2>Methods</h2>
          <button onClick={() => call('orders.create', pick(CUSTOMERS), Math.ceil(Math.random() * 200))}>
            Create an order
          </button>
          <button onClick={() => call('orders.report')}>Run the slow report</button>
          <button onClick={refund}>Refund an order (sends a card)</button>
          <button onClick={() => call('orders.import', 'customer,amount\nAda,10')}>Import a broken CSV</button>
          <button onClick={() => call('orders.recalculate')}>Hit a server bug</button>
          <button onClick={() => call('db.reindex')}>Call a server-only method</button>

          <h2>Publications</h2>
          <button onClick={() => setShowOrders(!showOrders)}>
            {showOrders ? 'Unsubscribe from orders.recent' : 'Subscribe to orders.recent'}
          </button>
          <button onClick={subscribeToMine}>Subscribe to orders.mine</button>

          <h2>What the client saw</h2>
          <p className="client-saw">{clientSaw}</p>

          {showOrders && (
            <>
              <h2>orders.recent · {viewingOrders} viewing</h2>
              <ul className="orders">
                {orders.map((order) => (
                  <li key={order._id}>
                    {order.customer} <span>${order.total} · {order.status}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>

        <main>
          <h2>Per-method stats</h2>
          <table>
            <thead>
              <tr><th>Method</th><th>Calls</th><th>Errors</th><th>Avg ms</th><th>Max ms</th></tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat._id}>
                  <td><code>{stat._id}</code></td>
                  <td>{stat.count}</td>
                  <td className={stat.errors ? 'bad' : undefined}>{stat.errors}</td>
                  <td>{Math.round(stat.totalMs / stat.count)}</td>
                  <td className={stat.maxMs > 200 ? 'slow' : undefined}>{stat.maxMs}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Live events</h2>
          <EventFeed events={events} />

          <h2>Audit log</h2>
          <table>
            <thead>
              <tr><th>When</th><th>User</th><th>Action</th><th>Recorded arguments</th></tr>
            </thead>
            <tbody>
              {audit.map((entry) => (
                <tr key={entry._id}>
                  <td>{entry.at.toLocaleTimeString()}</td>
                  <td>{entry.userId ?? 'anonymous'}</td>
                  <td><code>{entry.action}</code></td>
                  <td><code>{JSON.stringify(entry.args)}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
};

const Tile = ({ label, value, tone }: { label: string; value: number; tone?: string }) => (
  <div className={`tile ${tone ?? ''}`}>
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);
