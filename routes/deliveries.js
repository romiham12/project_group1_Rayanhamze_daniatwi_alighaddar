const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const controller = require('../controllers/deliveriesController');

const router = express.Router();

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.get));
router.post('/', asyncHandler(controller.create));
router.put('/:id', asyncHandler(controller.update));

module.exports = router;
