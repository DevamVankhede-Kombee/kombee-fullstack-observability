const { PrismaClient } = require('@prisma/client');
const { ordersCreatedCounter, dbQueryDurationHistogram } = require('../metrics');
const { isNPlusOneAnomalyActive, executeNPlusOnePattern } = require('../anomalies/n-plus-one-anomaly');

const prisma = new PrismaClient();

class OrderService {
  async getOrders(userId, role, page = 1, limit = 10, status) {
    const skip = (page - 1) * limit;
    const where = {};

    if (role !== 'ADMIN') {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    let orders, total;

    if (isNPlusOneAnomalyActive()) {
      // N+1 anomaly: fetch orders without includes, then query each relation separately
      [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.order.count({ where })
      ]);

      // Execute N+1 pattern
      orders = await executeNPlusOnePattern(prisma, orders);
    } else {
      // Normal efficient query with includes
      [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }),
        prisma.order.count({ where })
      ]);
    }

    return {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderById(id, userId, role) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        product: {
          select: { id: true, name: true, price: true, category: true }
        }
      }
    });

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    if (role !== 'ADMIN' && order.userId !== userId) {
      const error = new Error('Access denied');
      error.statusCode = 403;
      throw error;
    }

    return order;
  }

  async createOrder(userId, productId, quantity) {
    const productTimer = dbQueryDurationHistogram.startTimer({ operation: 'findUnique', model: 'Product' });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    productTimer();

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    if (product.stock < quantity) {
      const error = new Error('Insufficient stock');
      error.statusCode = 400;
      throw error;
    }

    const totalPrice = product.price * quantity;

    const transactionTimer = dbQueryDurationHistogram.startTimer({ operation: 'transaction', model: 'Order' });
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          userId,
          productId,
          quantity,
          totalPrice
        },
        include: {
          product: {
            select: { id: true, name: true, price: true }
          }
        }
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } }
      })
    ]);
    transactionTimer();

    // Increment orders created counter
    ordersCreatedCounter.inc({ status: 'PENDING' });

    return order;
  }

  async updateOrderStatus(id, status) {
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    return await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        product: {
          select: { id: true, name: true, price: true }
        }
      }
    });
  }
}

module.exports = new OrderService();
