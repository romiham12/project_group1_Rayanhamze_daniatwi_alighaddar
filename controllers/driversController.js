const createResourceController = require('./resourceController');

module.exports = createResourceController({
  table: 'drivers',
  fields: {
    user_id: 'user_id',
    license_number: 'license_number'
  },
  requiredFields: ['user_id', 'license_number'],
  returning: ['id', 'user_id', 'license_number', 'created_at']
});
