require('dotenv').config();

const express = require('express');
const path = require('path');
const pool = require('./config/database');
const { asyncHandler, errorHandler } = require('./utils/helpers');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get(
  '/api/health',
  asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  })
);

app.use('/api/users', require('./routes/users'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/vehicles', require('./routes/vehicles'));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler);

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  const server = app.listen(port, () => {
    console.log(`Shipping & Logistics API listening on port ${port}`);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      server.close(() => {
        pool.end().then(() => process.exit(0)).catch((error) => {
          console.error('Failed to close PostgreSQL pool:', error);
          process.exit(1);
        });
      });
    });
  }
}

module.exports = app;
