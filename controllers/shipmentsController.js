const createResourceController = require('./resourceController');

module.exports = createResourceController({
  table: 'shipments',
  fields: {
    customer_id: 'customer_id',
    origin: 'origin',
    destination: 'destination',
    status: 'status'
  },
  requiredFields: ['customer_id', 'origin', 'destination'],
  returning: [
    'id',
    'customer_id',
    'origin',
    'destination',
    'status',
    'created_at',
    'updated_at'
  ],
  orderBy: 'created_at',
  updatedAt: true
});
