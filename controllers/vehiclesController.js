const createResourceController = require('./resourceController');

module.exports = createResourceController({
  table: 'vehicles',
  fields: {
    plate_number: 'plate_number',
    type: 'type',
    capacity: 'capacity'
  },
  requiredFields: ['plate_number', 'type', 'capacity'],
  returning: ['id', 'plate_number', 'type', 'capacity', 'created_at']
});
