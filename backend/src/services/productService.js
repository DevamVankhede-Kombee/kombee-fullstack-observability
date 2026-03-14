const { PrismaClient } = require('@prisma/client');
const { dbQueryDurationHistogram } = require('../metrics');
const { injectSlowQueryDelayAsync } = require('../anomalies/slow-query-anomaly');

const prisma = new PrismaClient();

class ProductService {
  async getProducts(page = 1, limit = 10, category, search) {
    const skip = (page - 1) * limit;
    const where = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Inject slow query anomaly if enabled
    await injectSlowQueryDelayAsync();

    const timer = dbQueryDurationHistogram.startTimer({ operation: 'findMany', model: 'Product' });
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);
    timer();

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getProductById(id) {
    const timer = dbQueryDurationHistogram.startTimer({ operation: 'findUnique', model: 'Product' });
    const product = await prisma.product.findUnique({ where: { id } });
    timer();
    
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    return product;
  }

  async createProduct(data) {
    const timer = dbQueryDurationHistogram.startTimer({ operation: 'create', model: 'Product' });
    const product = await prisma.product.create({ data });
    timer();
    return product;
  }

  async updateProduct(id, data) {
    const findTimer = dbQueryDurationHistogram.startTimer({ operation: 'findUnique', model: 'Product' });
    const product = await prisma.product.findUnique({ where: { id } });
    findTimer();
    
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const updateTimer = dbQueryDurationHistogram.startTimer({ operation: 'update', model: 'Product' });
    const updated = await prisma.product.update({
      where: { id },
      data
    });
    updateTimer();
    return updated;
  }

  async deleteProduct(id) {
    const findTimer = dbQueryDurationHistogram.startTimer({ operation: 'findUnique', model: 'Product' });
    const product = await prisma.product.findUnique({ where: { id } });
    findTimer();
    
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    const deleteTimer = dbQueryDurationHistogram.startTimer({ operation: 'delete', model: 'Product' });
    await prisma.product.delete({ where: { id } });
    deleteTimer();
    return { message: 'Product deleted successfully' };
  }
}

module.exports = new ProductService();
