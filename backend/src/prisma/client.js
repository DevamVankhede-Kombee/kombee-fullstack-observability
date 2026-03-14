const { PrismaClient } = require('@prisma/client');

// Create a singleton Prisma client with connection pooling and retry logic
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Handle connection errors gracefully
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure Docker Desktop is running and the database container is up');
    console.log('   Run: docker-compose up -d db');
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
