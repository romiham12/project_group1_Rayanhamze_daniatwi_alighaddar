const createResourceController = require('./resourceController');

module.exports = createResourceController({
  table: 'packages',
  fields: {
    weight: 'weight',
    description: 'description'
  },
  requiredFields: ['weight'],
  returning: ['id', 'shipment_id', 'weight', 'description', 'created_at']
});
