import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const productListTrend = new Trend('product_list_duration');
const orderCreateTrend = new Trend('order_create_duration');
const errorRate = new Rate('error_rate');
const requestCounter = new Counter('total_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm up
    { duration: '60s', target: 50 },   // Normal load
    { duration: '20s', target: 100 },  // SPIKE - anomalies become visible
    { duration: '30s', target: 50 },   // Back to normal
    { duration: '20s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'],  // 95% of requests under 3s
    'http_req_failed': ['rate<0.1'],      // Less than 10% errors
    'error_rate': ['rate<0.1'],           // Less than 10% custom error rate
  },
  // Hidden: Expert-level load testing configuration
  ext: {
    loadimpact: {
      distribution: {
        'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 }
      }
    }
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Setup function - runs once before test
export function setup() {
  console.log('🔐 Setting up test - logging in...');
  
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'test@test.com',
      password: 'password123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.token;
      } catch (e) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    console.error('❌ Login failed!');
    return { token: null };
  }

  const token = JSON.parse(loginRes.body).data.token;
  console.log('✅ Login successful, token obtained');
  
  return { token };
}

// Main test function - runs for each VU
export default function (data) {
  if (!data.token) {
    console.error('No token available, skipping iteration');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // 1. GET /api/products - List products
  const productListStart = Date.now();
  const productsRes = http.get(
    `${BASE_URL}/api/products?page=1&limit=10`,
    { headers }
  );
  const productListDuration = Date.now() - productListStart;
  
  requestCounter.add(1);
  productListTrend.add(productListDuration);
  
  const productsCheck = check(productsRes, {
    'products list status 200': (r) => r.status === 200,
    'products list response time < 2000ms': (r) => productListDuration < 2000,
    'products list has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (!productsCheck) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(0.2);

  // 2. GET /api/products/:id - Get single product
  const randomProductId = Math.floor(Math.random() * 20) + 1;
  const productRes = http.get(
    `${BASE_URL}/api/products/${randomProductId}`,
    { headers }
  );
  
  requestCounter.add(1);
  
  check(productRes, {
    'product detail status 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.2);

  // 3. GET /api/orders - List orders
  const ordersRes = http.get(
    `${BASE_URL}/api/orders?page=1`,
    { headers }
  );
  
  requestCounter.add(1);
  
  const ordersCheck = check(ordersRes, {
    'orders list status 200': (r) => r.status === 200,
  });
  
  if (!ordersCheck) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(0.2);

  // 4. POST /api/orders - Create order (10% of VUs)
  if (Math.random() < 0.1) {
    // Get a product ID from the products list
    let productId;
    try {
      const productsBody = JSON.parse(productsRes.body);
      if (productsBody.data && productsBody.data.products && productsBody.data.products.length > 0) {
        const randomIndex = Math.floor(Math.random() * productsBody.data.products.length);
        productId = productsBody.data.products[randomIndex].id;
      }
    } catch (e) {
      // If parsing fails, skip order creation
      sleep(0.5);
      return;
    }

    if (productId) {
      const orderCreateStart = Date.now();
      const orderRes = http.post(
        `${BASE_URL}/api/orders`,
        JSON.stringify({
          productId: productId,
          quantity: Math.floor(Math.random() * 3) + 1, // 1-3 items
        }),
        { headers }
      );
      const orderCreateDuration = Date.now() - orderCreateStart;
      
      requestCounter.add(1);
      orderCreateTrend.add(orderCreateDuration);
      
      const orderCheck = check(orderRes, {
        'order create status 201 or 400': (r) => r.status === 201 || r.status === 400,
      });
      
      if (!orderCheck) {
        errorRate.add(1);
      } else {
        errorRate.add(0);
      }
    }
  }

  sleep(0.5);
}

// Teardown function - runs once after test
export function teardown(data) {
  console.log('🏁 Test completed!');
}

// Handle summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}✅ Test Summary\n`;
  summary += `${indent}${'='.repeat(50)}\n`;
  
  if (data.metrics.http_reqs) {
    summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  }
  
  if (data.metrics.http_req_duration) {
    summary += `${indent}Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  }
  
  if (data.metrics.http_req_failed) {
    const failRate = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}Failed Requests: ${failRate}%\n`;
  }
  
  if (data.metrics.product_list_duration) {
    summary += `${indent}Avg Product List Time: ${data.metrics.product_list_duration.values.avg.toFixed(2)}ms\n`;
  }
  
  if (data.metrics.order_create_duration) {
    summary += `${indent}Avg Order Create Time: ${data.metrics.order_create_duration.values.avg.toFixed(2)}ms\n`;
  }
  
  summary += `${indent}${'='.repeat(50)}\n`;
  
  return summary;
}
