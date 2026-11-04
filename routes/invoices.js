const express = require('express');
const pool = require('../config/database');
const { asyncHandler, HttpError, parseId } = require('../utils/helpers');
const controller = require('../controllers/invoicesController');

const router = express.Router();

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.post('/', asyncHandler(controller.create));
router.patch(
  '/:id/paid',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const { rows } = await pool.query(
      "UPDATE invoices SET payment_status = 'paid', paid_at = NOW() WHERE id = $1 " +
        'RETURNING id, shipment_id, amount, payment_status, paid_at, created_at',
      [id]
    );
    if (rows.length === 0) {
      throw new HttpError(404, 'Invoice not found');
    }
    res.json(rows[0]);
  })
);

module.exports = router;
