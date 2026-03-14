const { logger } = require('../logger');
const { trace } = require('@opentelemetry/api');

/**
 * N+1 Query Anomaly
 * Simulates N+1 query pattern by executing separate queries in a loop
 * instead of using efficient JOINs
 * Toggle with: ANOMALY_N_PLUS_ONE=true
 */

function isNPlusOneAnomalyActive() {
  return process.env.ANOMALY_N_PLUS_ONE === 'true';
}

async function executeNPlusOnePattern(prisma, orders) {
  if (!isNPlusOneAnomalyActive()) {
    return orders;
  }

  const ordersCount = orders.length;
  let queriesExecuted = 1; // Initial query to get orders

  logger.warn('ANOMALY ACTIVE: N+1 query pattern', {
    anomaly: 'n-plus-one',
    ordersCount,
    queriesExecuted: ordersCount + 1
  });

  // Add span attribute if in active trace
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttribute('anomaly.type', 'n-plus-one-query');
    span.setAttribute('anomaly.queries_count', ordersCount + 1);
  }

  // Execute N+1 pattern: separate query for each order's user and product
  const enrichedOrders = [];
  
  for (const order of orders) {
    queriesExecuted++;
    
    // Separate query for user (inefficient!)
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { id: true, name: true, email: true }
    });

    queriesExecuted++;
    
    // Separate query for product (inefficient!)
    const product = await prisma.product.findUnique({
      where: { id: order.productId },
      select: { id: true, name: true, price: true }
    });

    enrichedOrders.push({
      ...order,
      user,
      product
    });
  }

  logger.warn('N+1 queries completed', {
    anomaly: 'n-plus-one',
    totalQueries: queriesExecuted
  });

  return enrichedOrders;
}

module.exports = {
  isNPlusOneAnomalyActive,
  executeNPlusOnePattern
};
