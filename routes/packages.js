const express = require('express');
const { asyncHandler } = require('../utils/helpers');
const controller = require('../controllers/packagesController');

const router = express.Router();

router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.remove));

module.exports = router;
