const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const CATEGORIES = ['Electronics', 'Clothing', 'Food', 'Other'];
const PRODUCT_NAMES = [
  'Wireless Headphones', 'Smart Watch', 'Laptop Stand', 'USB-C Cable',
  'Cotton T-Shirt', 'Running Shoes', 'Yoga Mat', 'Water Bottle',
  'JavaScript Guide', 'Python Handbook', 'Design Patterns', 'Clean Code',
  'Garden Tools Set', 'LED Desk Lamp', 'Coffee Maker', 'Blender',
  'Basketball', 'Tennis Racket', 'Dumbbells', 'Resistance Bands'
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create test user
    console.log('👤 Creating test user...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'test@test.com' },
      update: {},
      create: {
        name: 'Test User',
        email: 'test@test.com',
        password: hashedPassword,
        role: 'USER'
      }
    });
    console.log(`   ✓ User created: ${user.email}`);

    // 2. Create admin user
    console.log('\n👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@test.com',
        password: adminPassword,
        role: 'ADMIN'
      }
    });
    console.log(`   ✓ Admin created: ${admin.email}`);

    // 3. Create 20 products
    console.log('\n📦 Creating 20 products...');
    const products = [];
    
    for (let i = 0; i < 20; i++) {
      const product = await prisma.product.create({
        data: {
          name: PRODUCT_NAMES[i],
          description: `High-quality ${PRODUCT_NAMES[i].toLowerCase()} for your needs.`,
          category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
          price: Math.floor(Math.random() * 500) + 10,
          stock: Math.floor(Math.random() * 100) + 20
        }
      });
      products.push(product);
      console.log(`   ✓ ${i + 1}/20: ${product.name} - $${product.price}`);
    }

    // 4. Create 10 initial orders
    console.log('\n🛒 Creating 10 initial orders...');
    
    for (let i = 0; i < 10; i++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const totalPrice = randomProduct.price * quantity;
      
      await prisma.order.create({
        data: {
          userId: user.id,
          productId: randomProduct.id,
          quantity: quantity,
          totalPrice: totalPrice,
          status: ['PENDING', 'PROCESSING', 'COMPLETED'][Math.floor(Math.random() * 3)]
        }
      });
      
      await prisma.product.update({
        where: { id: randomProduct.id },
        data: { stock: { decrement: quantity } }
      });
      
      console.log(`   ✓ ${i + 1}/10: ${quantity}x ${randomProduct.name}`);
    }

    console.log('\n✅ Database seeding completed!\n');
    console.log('📊 Summary: 2 users, 20 products, 10 orders');
    console.log('🔐 Credentials: test@test.com / password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
