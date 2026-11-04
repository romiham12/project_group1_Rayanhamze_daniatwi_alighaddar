const express = require('express');
const pool = require('../config/database');
const shipments = require('../controllers/shipmentsController');
const packages = require('../controllers/packagesController');
const { asyncHandler, HttpError, parseId, validateInput } = require('../utils/helpers');

const router = express.Router();

async function ensureShipment(id) {
  const { rowCount } = await pool.query('SELECT 1 FROM shipments WHERE id = $1', [id]);
  if (rowCount === 0) {
    throw new HttpError(404, 'Shipment not found');
  }
}

router.get('/', asyncHandler(shipments.list));
router.get('/:id', asyncHandler(shipments.get));
router.post('/', asyncHandler(shipments.create));
router.put('/:id', asyncHandler(shipments.update));
router.delete('/:id', asyncHandler(shipments.remove));

router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const input = validateInput(req.body, ['status'], ['status']);
    const { rows } = await pool.query(
      'UPDATE shipments SET status = $1, updated_at = NOW() WHERE id = $2 ' +
        'RETURNING id, customer_id, origin, destination, status, created_at, updated_at',
      [input.status, id]
    );
    if (rows.length === 0) {
      throw new HttpError(404, 'Shipment not found');
    }
    res.json(rows[0]);
  })
);

router.get(
  '/:id/tracking',
  asyncHandler(async (req, res) => {
    const shipmentId = parseId(req.params.id);
    await ensureShipment(shipmentId);
    const { rows } = await pool.query(
      'SELECT id, shipment_id, location, status, event_time FROM tracking_events ' +
        'WHERE shipment_id = $1 ORDER BY event_time ASC, id ASC',
      [shipmentId]
    );
    res.json(rows);
  })
);

router.post(
  '/:id/tracking',
  asyncHandler(async (req, res) => {
    const shipmentId = parseId(req.params.id);
    const input = validateInput(
      req.body,
      ['location', 'status', 'event_time'],
      ['location', 'status']
    );
    await ensureShipment(shipmentId);
    const { rows } = await pool.query(
      'INSERT INTO tracking_events (shipment_id, location, status, event_time) ' +
        'VALUES ($1, $2, $3, COALESCE($4, NOW())) ' +
        'RETURNING id, shipment_id, location, status, event_time',
      [shipmentId, input.location, input.status, input.event_time || null]
    );
    res.status(201).json(rows[0]);
  })
);

router.get(
  '/:id/packages',
  asyncHandler(async (req, res) => {
    const shipmentId = parseId(req.params.id);
    await ensureShipment(shipmentId);
    const { rows } = await pool.query(
      'SELECT id, shipment_id, weight, description, created_at FROM packages ' +
        'WHERE shipment_id = $1 ORDER BY id',
      [shipmentId]
    );
    res.json(rows);
  })
);

router.post(
  '/:id/packages',
  asyncHandler(async (req, res) => {
    const shipmentId = parseId(req.params.id);
    const input = validateInput(req.body, ['weight', 'description'], ['weight']);
    await ensureShipment(shipmentId);
    const { rows } = await pool.query(
      'INSERT INTO packages (shipment_id, weight, description) VALUES ($1, $2, $3) ' +
        'RETURNING id, shipment_id, weight, description, created_at',
      [shipmentId, input.weight, input.description || null]
    );
    res.status(201).json(rows[0]);
  })
);

module.exports = router;
