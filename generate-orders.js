// Simple script to generate orders and trigger N+1 queries
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function generateOrders() {
  try {
    // First, login to get a token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful');

    // Create a few orders
    console.log('Creating orders...');
    for (let i = 0; i < 5; i++) {
      await axios.post(`${API_BASE}/orders`, {
        productId: 1, // Assuming product ID 1 exists
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Order ${i + 1} created`);
    }

    // Now fetch orders (this will trigger N+1 queries)
    console.log('Fetching orders (this will trigger N+1 queries)...');
    const ordersResponse = await axios.get(`${API_BASE}/orders?limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`Fetched ${ordersResponse.data.orders.length} orders`);
    console.log('Check Grafana Tempo now for the N+1 query trace!');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

generateOrders();