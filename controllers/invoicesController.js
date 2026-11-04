const createResourceController = require('./resourceController');

module.exports = createResourceController({
  table: 'invoices',
  fields: {
    shipment_id: 'shipment_id',
    amount: 'amount'
  },
  requiredFields: ['shipment_id', 'amount'],
  returning: ['id', 'shipment_id', 'amount', 'payment_status', 'paid_at', 'created_at'],
  orderBy: 'created_at'
});
