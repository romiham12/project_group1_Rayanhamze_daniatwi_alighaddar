const createResourceController = require('./resourceController');

module.exports = createResourceController({
  table: 'deliveries',
  fields: {
    shipment_id: 'shipment_id',
    driver_id: 'driver_id',
    vehicle_id: 'vehicle_id',
    status: 'status',
    pickup_time: 'pickup_time',
    dropoff_time: 'dropoff_time'
  },
  requiredFields: ['shipment_id', 'driver_id', 'vehicle_id'],
  returning: [
    'id',
    'shipment_id',
    'driver_id',
    'vehicle_id',
    'status',
    'pickup_time',
    'dropoff_time',
    'created_at',
    'updated_at'
  ],
  orderBy: 'created_at',
  updatedAt: true
});
