const { PrismaClient } = require('@prisma/client');
const { dbQueryDurationHistogram } = require('../metrics');
const { injectSlowQueryDelayAsync } = require('../anomalies/slow-query-anomaly');
const { traceBusinessOperation } = require('../otel');
const { logger } = require('../logger');

const prisma = new PrismaClient();

class ProductService {
  async getProducts(page = 1, limit = 10, category, search) {
    return await traceBusinessOperation(
      'ProductService.getProducts',
      'product_catalog_query',
      async () => {
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

        // Log business operation
        logger.info('Product catalog query initiated', {
          businessEvent: 'product_catalog_query',
          page,
          limit,
          category,
          search,
          hasFilters: !!(category || search),
        });

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

        const result = {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        };

        logger.info('Product catalog query completed', {
          businessEvent: 'product_catalog_query_success',
          resultCount: products.length,
          totalProducts: total,
          page,
          hasResults: products.length > 0,
        });

        return result;
      },
      {
        'business.entity': 'product',
        'business.operation_type': 'read',
        'business.page': page,
        'business.limit': limit,
        'business.has_filters': !!(category || search),
      }
    );
  }

  async getProductById(id) {
    return await traceBusinessOperation(
      'ProductService.getProductById',
      'product_detail_query',
      async () => {
        logger.info('Product detail query initiated', {
          businessEvent: 'product_detail_query',
          productId: id,
        });

        const timer = dbQueryDurationHistogram.startTimer({ operation: 'findUnique', model: 'Product' });
        const product = await prisma.product.findUnique({ where: { id } });
        timer();
        
        if (!product) {
          logger.warn('Product not found', {
            businessEvent: 'product_not_found',
            productId: id,
            businessImpact: 'user_experience',
          });
          const error = new Error('Product not found');
          error.statusCode = 404;
          throw error;
        }

        logger.info('Product detail query completed', {
          businessEvent: 'product_detail_query_success',
          productId: id,
          productName: product.name,
          category: product.category,
        });

        return product;
      },
      {
        'business.entity': 'product',
        'business.operation_type': 'read',
        'business.product_id': id,
      }
    );
  }

  async createProduct(data) {
    return await traceBusinessOperation(
      'ProductService.createProduct',
      'product_creation',
      async () => {
        logger.info('Product creation initiated', {
          businessEvent: 'product_creation_start',
          productName: data.name,
          category: data.category,
          price: data.price,
          stock: data.stock,
        });

        const timer = dbQueryDurationHistogram.startTimer({ operation: 'create', model: 'Product' });
        const product = await prisma.product.create({ data });
        timer();

        logger.info('Product creation completed', {
          businessEvent: 'product_creation_success',
          productId: product.id,
          productName: product.name,
          category: product.category,
          businessImpact: 'inventory_expansion',
        });

        return product;
      },
      {
        'business.entity': 'product',
        'business.operation_type': 'create',
        'business.product_name': data.name,
        'business.category': data.category,
        'business.price': data.price,
      }
    );
  }

  async updateProduct(id, data) {
    return await traceBusinessOperation(
      'ProductService.updateProduct',
      'product_update',
      async () => {
        logger.info('Product update initiated', {
          businessEvent: 'product_update_start',
          productId: id,
          updateFields: Object.keys(data),
        });

        const findTimer = dbQueryDurationHistogram.startTimer({ operation: 'findUnique', model: 'Product' });
        const product = await prisma.product.findUnique({ where: { id } });
        findTimer();
        
        if (!product) {
          logger.warn('Product update failed - not found', {
            businessEvent: 'product_update_failed',
            productId: id,
            reason: 'not_found',
          });
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

        logger.info('Product update completed', {
          businessEvent: 'product_update_success',
          productId: id,
          productName: updated.name,
          updatedFields: Object.keys(data),
          businessImpact: 'inventory_modification',
        });

        return updated;
      },
      {
        'business.entity': 'product',
        'business.operation_type': 'update',
        'business.product_id': id,
        'business.update_fields': Object.keys(data).join(','),
      }
    );
  }

  async deleteProduct(id) {
    return await traceBusinessOperation(
      'ProductService.deleteProduct',
      'product_deletion',
      async () => {
        logger.info('Product deletion initiated', {
          businessEvent: 'product_deletion_start',
          productId: id,
        });

        const findTimer = dbQueryDurationHistogram.startTimer({ operation: 'findUnique', model: 'Product' });
        const product = await prisma.product.findUnique({ where: { id } });
        findTimer();
        
        if (!product) {
          logger.warn('Product deletion failed - not found', {
            businessEvent: 'product_deletion_failed',
            productId: id,
            reason: 'not_found',
          });
          const error = new Error('Product not found');
          error.statusCode = 404;
          throw error;
        }

        const deleteTimer = dbQueryDurationHistogram.startTimer({ operation: 'delete', model: 'Product' });
        await prisma.product.delete({ where: { id } });
        deleteTimer();

        logger.info('Product deletion completed', {
          businessEvent: 'product_deletion_success',
          productId: id,
          productName: product.name,
          businessImpact: 'inventory_reduction',
        });

        return { message: 'Product deleted successfully' };
      },
      {
        'business.entity': 'product',
        'business.operation_type': 'delete',
        'business.product_id': id,
      }
    );
  }
}

module.exports = new ProductService();
