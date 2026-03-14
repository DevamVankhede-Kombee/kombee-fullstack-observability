const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys'];
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
    console.log(`   ✓ User created: ${user.email} (ID: ${user.id})`);

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
    console.log(`   ✓ Admin created: ${admin.email} (ID: ${admin.id})`);

    // 3. Create 20 products
    console.log('\n📦 Creating 20 products...');
    const products = [];
    
    for (let i = 0; i < 20; i++) {
      const product = await prisma.product.create({
        data: {
          name: PRODUCT_NAMES[i],
          description: `High-quality ${PRODUCT_NAMES[i].toLowerCase()} for your needs. Perfect for everyday use.`,
          category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
          price: Math.floor(Math.random() * 500) + 10, // $10 - $510
          stock: Math.floor(Math.random() * 100) + 20  // 20 - 120 items
        }
      });
      products.push(product);
      console.log(`   ✓ Product ${i + 1}/20: ${product.name} - $${product.price}`);
    }

    // 4. Create 10 initial orders
    console.log('\n🛒 Creating 10 initial orders...');
    
    for (let i = 0; i < 10; i++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
      const totalPrice = randomProduct.price * quantity;
      
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          productId: randomProduct.id,
          quantity: quantity,
          totalPrice: totalPrice,
          status: ['PENDING', 'PROCESSING', 'COMPLETED'][Math.floor(Math.random() * 3)]
        }
      });
      
      // Update product stock
      await prisma.product.update({
        where: { id: randomProduct.id },
        data: { stock: { decrement: quantity } }
      });
      
      console.log(`   ✓ Order ${i + 1}/10: ${quantity}x ${randomProduct.name} = $${totalPrice}`);
    }

    console.log('\n✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Users: 2 (1 regular, 1 admin)`);
    console.log(`   • Products: 20`);
    console.log(`   • Orders: 10`);
    console.log('\n🔐 Test Credentials:');
    console.log(`   User: test@test.com / password123`);
    console.log(`   Admin: admin@test.com / admin123`);
    console.log('\n🚀 Ready for k6 load testing!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDatabase()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
