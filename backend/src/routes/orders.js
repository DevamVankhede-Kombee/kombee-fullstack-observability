const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, orderController.getOrders);

router.get('/:id', auth, orderController.getOrderById);

router.post(
  '/',
  auth,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1')
  ],
  orderController.createOrder
);

router.put(
  '/:id/status',
  auth,
  adminOnly,
  [
    body('status')
      .isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid status')
  ],
  orderController.updateOrderStatus
);

module.exports = router;
