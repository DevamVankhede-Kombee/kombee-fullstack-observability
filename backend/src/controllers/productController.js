const productService = require('../services/productService');
const { validationResult } = require('express-validator');
const { logger } = require('../logger');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { page, limit, category, search } = req.query;
      const result = await productService.getProducts(page, limit, category, search);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation failed', {
          endpoint: '/api/products',
          errors: errors.array()
        });
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const product = await productService.createProduct(req.body);

      logger.info('Product created', {
        productId: product.id,
        name: product.name,
        userId: req.user?.id
      });

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation failed', {
          endpoint: `/api/products/${req.params.id}`,
          errors: errors.array()
        });
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      const result = await productService.deleteProduct(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
