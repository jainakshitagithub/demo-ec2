const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let orders = [
  { id: 1, customer: 'John', status: 'PENDING', amount: 1200 },
  { id: 2, customer: 'Mary', status: 'SHIPPED', amount: 2400 },
  { id: 3, customer: 'David', status: 'DELIVERED', amount: 1800 }
];

const TRANSITIONS = {
  PENDING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

app.get('/orders', (req, res) => res.json(orders));

app.patch('/orders/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const { status, expectedCurrentStatus } = req.body;

  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // concurrency check: is the order still in the state the client thinks it's in?
  if (expectedCurrentStatus && expectedCurrentStatus !== order.status) {
    return res.status(409).json({
      error: `Order status changed to ${order.status} by someone else`,
      order
    });
  }

  // business rule check: is this a valid transition?
  if (!TRANSITIONS[order.status].includes(status)) {
    return res.status(409).json({ error: `Cannot go from ${order.status} to ${status}`, order });
  }

  order.status = status;
  res.json(order);
});

app.listen(4000, () => console.log('API running on http://localhost:4000'));