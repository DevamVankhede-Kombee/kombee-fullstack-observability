const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { dbQueryDurationHistogram, activeUsersGauge } = require('../metrics');

const prisma = new PrismaClient();

class AuthService {
  async register(name, email, password) {
    const findTimer = dbQueryDurationHistogram.startTimer({ operation: 'findUnique', model: 'User' });
    const existingUser = await prisma.user.findUnique({ where: { email } });
    findTimer();
    
    if (existingUser) {
      const error = new Error('Email already registered');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const createTimer = dbQueryDurationHistogram.startTimer({ operation: 'create', model: 'User' });
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });
    createTimer();

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Increment active users
    activeUsersGauge.inc();

    const { password: _, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }

  async login(email, password) {
    const timer = dbQueryDurationHistogram.startTimer({ operation: 'findUnique', model: 'User' });
    const user = await prisma.user.findUnique({ where: { email } });
    timer();
    
    if (!user) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Increment active users
    activeUsersGauge.inc();

    const { password: _, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword, token };
  }
}

module.exports = new AuthService();
