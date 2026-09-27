import { useState, useEffect } from 'react';

const TRANSITIONS = {
  PENDING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

export default function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/orders').then(r => r.json()).then(setOrders);
  }, []);

  const updateStatus = async (order, newStatus) => {
    setError(null);
    const previous = orders; // snapshot for rollback

    // 1. optimistic update
    setOrders(orders.map(o => o.id === order.id ? { ...o, status: newStatus } : o));

    try {
      const res = await fetch(`http://localhost:4000/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, expectedCurrentStatus: order.status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 2. confirmed - sync with server's real data
      setOrders(orders.map(o => o.id === order.id ? data : o));
    } catch (err) {
      // 3. rejected - rollback
      setOrders(previous);
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Orders</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" cellPadding="8">
        <thead>
          <tr><th>Customer</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>{order.customer}</td>
              <td>{order.amount}</td>
              <td>{order.status}</td>
              <td>
                {TRANSITIONS[order.status].map(next => (
                  <button key={next} onClick={() => updateStatus(order, next)}>
                    {next}
                  </button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}