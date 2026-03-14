const orderService = require('../services/orderService');
const { validationResult } = require('express-validator');
const { logger } = require('../logger');

class OrderController {
  async getOrders(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const { id: userId, role } = req.user;
      
      const result = await orderService.getOrders(userId, role, page, limit, status);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const { id: userId, role } = req.user;
      
      const order = await orderService.getOrderById(id, userId, role);

      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation failed', {
          endpoint: '/api/orders',
          errors: errors.array()
        });
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { productId, quantity } = req.body;
      const { id: userId } = req.user;
      
      const order = await orderService.createOrder(userId, productId, quantity);

      logger.info('Order created', {
        orderId: order.id,
        userId,
        productId,
        quantity
      });

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation failed', {
          endpoint: `/api/orders/${req.params.id}`,
          errors: errors.array()
        });
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { status } = req.body;
      
      const order = await orderService.updateOrderStatus(id, status);

      res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
