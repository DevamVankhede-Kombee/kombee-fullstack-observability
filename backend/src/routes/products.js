const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', productController.getProducts);

router.get('/:id', productController.getProductById);

router.post(
  '/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('category')
      .isIn(['Electronics', 'Clothing', 'Food', 'Other'])
      .withMessage('Invalid category'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer')
  ],
  productController.createProduct
);

router.put(
  '/:id',
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
    body('category')
      .optional()
      .isIn(['Electronics', 'Clothing', 'Food', 'Other'])
      .withMessage('Invalid category'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer')
  ],
  productController.updateProduct
);

router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;
